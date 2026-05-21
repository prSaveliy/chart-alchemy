import { describe, test, before, after, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { FastifyInstance } from 'fastify';
import buildApp from '../src/app.js';
import { GeminiService } from '../src/services/gemini.service.js';
import { RedisService } from '../src/services/redis.service.js';

describe('GeminiService Token Limit & Hardening Tests', () => {
  let app: FastifyInstance;
  let service: GeminiService;

  before(async () => {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('Refusing to run tests: NODE_ENV is not "test"');
    }

    app = await buildApp();
    await app.ready();
    service = new GeminiService(app, new RedisService((app as any).redis));
  });

  after(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean state before each test
    await (app as any).redis.del('billing:tokens:daily_pool');
    mock.restoreAll();
  });

  const mockGeminiSuccess = (
    tokens: number,
    responseText: string,
    actualTokensUsed = 100,
  ) => {
    mock.method((app as any).gemini.models, 'countTokens', async () => ({
      totalTokens: tokens,
    }));

    mock.method((app as any).gemini.models, 'generateContent', async () => ({
      text: responseText,
      usageMetadata: {
        totalTokenCount: actualTokensUsed,
      },
    }));
  };

  test('rejects request immediately if daily token pool limit is exceeded', async () => {
    await (app as any).redis.set(
      'billing:tokens:daily_pool',
      (app as any).config.GEMINI_DAILY_TOKEN_LIMIT,
    );

    let error: any;
    try {
      await service.generate('test prompt', null, false);
    } catch (e) {
      error = e;
    }

    assert.ok(error);
    assert.equal(error.statusCode, 429);
    assert.match(
      error.message,
      /Service temporarily unavailable due to high volume/,
    );
  });

  test('increments daily pool, sets TTL, and refunds overestimation on success', async () => {
    const mockConfig = {
      option: {
        series: [{ type: 'line', data: [1, 2, 3] }],
      },
    };
    mockGeminiSuccess(50, JSON.stringify(mockConfig), 120);

    const result = await service.generate('test prompt', null, false);

    assert.deepEqual(result, mockConfig);

    const poolVal = await (app as any).redis.get('billing:tokens:daily_pool');
    // projected was 50 + GEMINI_MAX_OUTPUT_TOKENS (50000) = 50050.
    // actual used was 120. Overestimation was 50050 - 120 = 49930.
    // Net result: incremented by 50050, decremented by 49930. Total should be exactly 120.
    assert.equal(Number(poolVal), 120);

    const ttl = await (app as any).redis.ttl('billing:tokens:daily_pool');
    assert.ok(ttl > 0 && ttl <= 86400);
  });

  test('fully refunds the projected worst case cost if Gemini API throws an error', async () => {
    mock.method((app as any).gemini.models, 'countTokens', async () => ({
      totalTokens: 50,
    }));
    mock.method((app as any).gemini.models, 'generateContent', async () => {
      const err = new Error('Rate limit exceeded');
      (err as any).status = 429;
      throw err;
    });

    let error: any;
    try {
      await service.generate('test prompt', null, false);
    } catch (e) {
      error = e;
    }

    assert.ok(error);
    assert.equal(error.statusCode, 429);

    // Should be fully refunded since generateContent failed and actualTokensUsed remained null
    const poolVal = await (app as any).redis.get('billing:tokens:daily_pool');
    assert.equal(Number(poolVal || 0), 0);
  });

  test('refunds overestimation and retains actual usage if content safety block is triggered', async () => {
    mock.method((app as any).gemini.models, 'countTokens', async () => ({
      totalTokens: 50,
    }));
    mock.method((app as any).gemini.models, 'generateContent', async () => ({
      candidates: [
        {
          finishReason: 'SAFETY',
        },
      ],
      usageMetadata: {
        totalTokenCount: 150,
      },
    }));

    let error: any;
    try {
      await service.generate('test prompt', null, false);
    } catch (e) {
      error = e;
    }

    assert.ok(error);
    assert.equal(error.statusCode, 400);
    assert.match(error.message, /violates content safety guidelines/);

    // Overestimation is refunded, actual consumed tokens (150) are retained to prevent budget bypass attacks
    const poolVal = await (app as any).redis.get('billing:tokens:daily_pool');
    assert.equal(Number(poolVal), 150);
  });

  test('refunds overestimation and retains actual usage if config validation fails', async () => {
    mock.method((app as any).gemini.models, 'countTokens', async () => ({
      totalTokens: 50,
    }));
    mock.method((app as any).gemini.models, 'generateContent', async () => ({
      text: 'invalid json format {{{',
      usageMetadata: {
        totalTokenCount: 175,
      },
    }));

    let error: any;
    try {
      await service.generate('test prompt', null, false);
    } catch (e) {
      error = e;
    }

    assert.ok(error);
    assert.equal(error.statusCode, 502);

    // Validation failed but actual tokens used (175) are charged, overestimation refunded
    const poolVal = await (app as any).redis.get('billing:tokens:daily_pool');
    assert.equal(Number(poolVal), 175);
  });

  test('rejects request and decrements worst case cost if projected tokens exceed the limit', async () => {
    const nearLimit = (app as any).config.GEMINI_DAILY_TOKEN_LIMIT - 1000;
    await (app as any).redis.set('billing:tokens:daily_pool', nearLimit);

    mock.method((app as any).gemini.models, 'countTokens', async () => ({
      totalTokens: 50,
    }));

    let error: any;
    try {
      await service.generate('test prompt', null, false);
    } catch (e) {
      error = e;
    }

    assert.ok(error);
    assert.equal(error.statusCode, 429);

    // Pool should go back to nearLimit because it was atomic decremented
    const poolVal = await (app as any).redis.get('billing:tokens:daily_pool');
    assert.equal(Number(poolVal), nearLimit);
  });

  test('atomically sets TTL=86400 via EXPIRE NX when key has no expiry', async () => {
    mockGeminiSuccess(50, JSON.stringify({ option: {} }), 100);

    // Simulate a key that exists but has no TTL (e.g. after a crash before expire ran)
    await (app as any).redis.set('billing:tokens:daily_pool', 10);
    assert.equal(await (app as any).redis.ttl('billing:tokens:daily_pool'), -1);

    await service.generate('test prompt', null, false);

    // EXPIRE NX must have set the TTL without sliding an already-existing window
    const ttlAfter = await (app as any).redis.ttl('billing:tokens:daily_pool');
    assert.ok(ttlAfter > 0 && ttlAfter <= 86400);
  });
});
