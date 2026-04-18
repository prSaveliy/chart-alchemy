import { describe, test, before, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { FastifyInstance } from 'fastify';
import buildApp from '../src/app.js';

import geminiService from '../src/services/gemini.service.js';

const makeUser = async (app: FastifyInstance, email: string) => {
  const bcrypt = await import('bcrypt');
  const password = 'password123';
  await (app as any).prisma.user.create({
    data: {
      email,
      password: await bcrypt.hash(password, 10),
      isActivated: true,
    },
  });
  const loginRes = await request(app.server)
    .post('/auth/login')
    .send({ email, password })
    .set('Content-Type', 'application/json');
  return loginRes.body.accessToken as string;
};

describe('chart integration tests', () => {
  let app: FastifyInstance;

  before(async () => {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('Refusing to wipe database: NODE_ENV is not "test"');
    }

    mock.method(geminiService, 'generate', async () => ({
      option: {
        series: [{ type: 'bar', data: [100, 150, 120] }],
      },
    }));

    app = await buildApp();
    await app.ready();
    const { execSync } = await import('node:child_process');
    execSync('npx prisma migrate reset --force');
  });

  after(async () => {
    await app.close();
  });

  describe('POST /chart/init', () => {
    test('returns token for chartType "ai"', async () => {
      const token = await makeUser(app, 'init-ai@qwertyuiop1234.com');

      const response = await request(app.server)
        .post('/chart/init')
        .set('Authorization', `Bearer ${token}`)
        .send({ chartType: 'ai' })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 200);
      assert.ok(response.body.token);
    });

    test('creates chart record in DB', async () => {
      const accessToken = await makeUser(app, 'init-db@qwertyuiop1234.com');

      const response = await request(app.server)
        .post('/chart/init')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ chartType: 'ai' })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 200);

      const chart = await (app as any).prisma.chart.findUnique({
        where: { token: response.body.token },
      });
      assert.ok(chart);
    });

    test('returns 400 for invalid chartType', async () => {
      const token = await makeUser(app, 'init-bad-type@qwertyuiop1234.com');

      const response = await request(app.server)
        .post('/chart/init')
        .set('Authorization', `Bearer ${token}`)
        .send({ chartType: 'invalid' })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 400);
    });

    test('returns 400 when chartType is missing', async () => {
      const token = await makeUser(app, 'init-no-type@qwertyuiop1234.com');

      const response = await request(app.server)
        .post('/chart/init')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 400);
    });

    test('returns 401 without auth', async () => {
      const response = await request(app.server)
        .post('/chart/init')
        .send({ chartType: 'ai' })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 401);
    });
  });

  describe('POST /chart/verify-token', () => {
    test('returns 200 for own chart token', async () => {
      const accessToken = await makeUser(app, 'verify-ok@qwertyuiop1234.com');

      const initRes = await request(app.server)
        .post('/chart/init')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ chartType: 'ai' })
        .set('Content-Type', 'application/json');

      const response = await request(app.server)
        .post('/chart/verify-token')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ token: initRes.body.token })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 200);
    });

    test('returns 403 when chart belongs to another user', async () => {
      const ownerToken = await makeUser(app, 'verify-owner@qwertyuiop1234.com');
      const otherToken = await makeUser(app, 'verify-other@qwertyuiop1234.com');

      const initRes = await request(app.server)
        .post('/chart/init')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ chartType: 'ai' })
        .set('Content-Type', 'application/json');

      const response = await request(app.server)
        .post('/chart/verify-token')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ token: initRes.body.token })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 403);
    });

    test('returns 404 for nonexistent token', async () => {
      const accessToken = await makeUser(app, 'verify-notfound@qwertyuiop1234.com');

      const response = await request(app.server)
        .post('/chart/verify-token')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ token: 'ai-00000000-0000-0000-0000-000000000000' })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 404);
    });

    test('returns 400 when token field is missing', async () => {
      const accessToken = await makeUser(app, 'verify-missing@qwertyuiop1234.com');

      const response = await request(app.server)
        .post('/chart/verify-token')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 400);
    });

    test('returns 401 without auth', async () => {
      const response = await request(app.server)
        .post('/chart/verify-token')
        .send({ token: 'ai-some-token' })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 401);
    });
  });

  describe('POST /chart/generate', () => {
    test('returns chartData for valid prompt', async () => {
      const accessToken = await makeUser(app, 'gen-ok@qwertyuiop1234.com');

      const initRes = await request(app.server)
        .post('/chart/init')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ chartType: 'ai' })
        .set('Content-Type', 'application/json');

      const chartToken = initRes.body.token;

      const response = await request(app.server)
        .post('/chart/generate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          prompt: 'A bar chart showing monthly sales for January through March: 100, 150, 120',
          token: chartToken,
          memory: null,
          thinkingMode: 'false',
        })
        .set('Content-Type', 'application/json')
        .timeout(30000);

      assert.equal(response.status, 200);
      assert.ok(response.body.chartData);

      const chart = await (app as any).prisma.chart.findUnique({
        where: { token: chartToken },
      });
      assert.deepEqual(chart.config, response.body.chartData);
    });

    test('returns 403 when chart belongs to another user', async () => {
      const ownerToken = await makeUser(app, 'gen-owner@qwertyuiop1234.com');
      const otherToken = await makeUser(app, 'gen-other@qwertyuiop1234.com');

      const initRes = await request(app.server)
        .post('/chart/init')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ chartType: 'ai' })
        .set('Content-Type', 'application/json');

      const response = await request(app.server)
        .post('/chart/generate')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          prompt: 'A bar chart of monthly sales',
          token: initRes.body.token,
          memory: null,
          thinkingMode: 'false',
        })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 403);
    });

    test('returns 404 for nonexistent chart token', async () => {
      const accessToken = await makeUser(app, 'gen-notfound@qwertyuiop1234.com');

      const response = await request(app.server)
        .post('/chart/generate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          prompt: 'A bar chart',
          token: 'ai-00000000-0000-0000-0000-000000000000',
          memory: null,
          thinkingMode: 'false',
        })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 404);
    });

    test('returns 400 when prompt is missing', async () => {
      const accessToken = await makeUser(app, 'gen-no-prompt@qwertyuiop1234.com');

      const initRes = await request(app.server)
        .post('/chart/init')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ chartType: 'ai' })
        .set('Content-Type', 'application/json');

      const response = await request(app.server)
        .post('/chart/generate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          token: initRes.body.token,
          memory: null,
          thinkingMode: 'false',
        })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 400);
    });

    test('returns 400 when thinkingMode is invalid', async () => {
      const accessToken = await makeUser(app, 'gen-bad-mode@qwertyuiop1234.com');

      const initRes = await request(app.server)
        .post('/chart/init')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ chartType: 'ai' })
        .set('Content-Type', 'application/json');

      const response = await request(app.server)
        .post('/chart/generate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          prompt: 'A pie chart',
          token: initRes.body.token,
          memory: null,
          thinkingMode: 'yes',
        })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 400);
    });

    test('returns 401 without auth', async () => {
      const response = await request(app.server)
        .post('/chart/generate')
        .send({
          prompt: 'A bar chart',
          token: 'ai-some-token',
          memory: null,
          thinkingMode: 'false',
        })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 401);
    });
  });

  describe('PATCH /chart/rename', () => {
    test('renames chart successfully', async () => {
      const accessToken = await makeUser(app, 'rename-ok@qwertyuiop1234.com');

      const initRes = await request(app.server)
        .post('/chart/init')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ chartType: 'manual' })
        .set('Content-Type', 'application/json');

      const chartToken = initRes.body.token;

      const response = await request(app.server)
        .patch('/chart/rename')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'My Chart', token: chartToken })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 200);

      const chart = await (app as any).prisma.chart.findUnique({
        where: { token: chartToken },
      });
      assert.equal(chart.name, 'My Chart');
    });

    test('returns 403 when chart belongs to another user', async () => {
      const ownerToken = await makeUser(app, 'rename-owner@qwertyuiop1234.com');
      const otherToken = await makeUser(app, 'rename-other@qwertyuiop1234.com');

      const initRes = await request(app.server)
        .post('/chart/init')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ chartType: 'manual' })
        .set('Content-Type', 'application/json');

      const response = await request(app.server)
        .patch('/chart/rename')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ name: 'Stolen Name', token: initRes.body.token })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 403);
    });

    test('returns 404 for nonexistent chart token', async () => {
      const accessToken = await makeUser(app, 'rename-notfound@qwertyuiop1234.com');

      const response = await request(app.server)
        .patch('/chart/rename')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Ghost', token: 'ai-00000000-0000-0000-0000-000000000000' })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 404);
    });

    test('returns 400 when name exceeds 255 characters', async () => {
      const accessToken = await makeUser(app, 'rename-long@qwertyuiop1234.com');

      const initRes = await request(app.server)
        .post('/chart/init')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ chartType: 'manual' })
        .set('Content-Type', 'application/json');

      const response = await request(app.server)
        .patch('/chart/rename')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'a'.repeat(256), token: initRes.body.token })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 400);
    });

    test('returns 400 when name is missing', async () => {
      const accessToken = await makeUser(app, 'rename-no-name@qwertyuiop1234.com');

      const initRes = await request(app.server)
        .post('/chart/init')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ chartType: 'manual' })
        .set('Content-Type', 'application/json');

      const response = await request(app.server)
        .patch('/chart/rename')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ token: initRes.body.token })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 400);
    });

    test('returns 401 without auth', async () => {
      const response = await request(app.server)
        .patch('/chart/rename')
        .send({ name: 'Test', token: 'ai-some-token' })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 401);
    });

    test('preserves saved config and manualType', async () => {
      const accessToken = await makeUser(
        app,
        'rename-preserve@qwertyuiop1234.com',
      );

      const initRes = await request(app.server)
        .post('/chart/init')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ chartType: 'manual' })
        .set('Content-Type', 'application/json');

      const chartToken = initRes.body.token;
      const chartData = { series: [{ type: 'bar', data: [1, 2, 3] }] };

      await request(app.server)
        .patch('/chart/save-config')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ token: chartToken, chartData, manualType: 'bar' })
        .set('Content-Type', 'application/json');

      await request(app.server)
        .patch('/chart/rename')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Renamed', token: chartToken })
        .set('Content-Type', 'application/json');

      const chart = await (app as any).prisma.chart.findUnique({
        where: { token: chartToken },
      });
      assert.equal(chart.name, 'Renamed');
      assert.deepEqual(chart.config, chartData);
      assert.equal(chart.manualType, 'bar');
    });
  });

  describe('PATCH /chart/save-config', () => {
    test('saves chart config successfully', async () => {
      const accessToken = await makeUser(app, 'save-ok@qwertyuiop1234.com');

      const initRes = await request(app.server)
        .post('/chart/init')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ chartType: 'manual' })
        .set('Content-Type', 'application/json');

      const chartToken = initRes.body.token;
      const chartData = { series: [{ type: 'bar', data: [10, 20, 30] }] };

      const response = await request(app.server)
        .patch('/chart/save-config')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ token: chartToken, chartData })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 200);

      const chart = await (app as any).prisma.chart.findUnique({
        where: { token: chartToken },
      });
      assert.deepEqual(chart.config, chartData);
    });

    test('persists manualType when provided', async () => {
      const accessToken = await makeUser(
        app,
        'save-manual-type@qwertyuiop1234.com',
      );

      const initRes = await request(app.server)
        .post('/chart/init')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ chartType: 'manual' })
        .set('Content-Type', 'application/json');

      const chartToken = initRes.body.token;

      const response = await request(app.server)
        .patch('/chart/save-config')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          token: chartToken,
          chartData: { series: [{ type: 'pie', data: [1, 2, 3] }] },
          manualType: 'pie',
        })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 200);

      const chart = await (app as any).prisma.chart.findUnique({
        where: { token: chartToken },
      });
      assert.equal(chart.manualType, 'pie');
    });

    test('leaves manualType unchanged when omitted on subsequent save', async () => {
      const accessToken = await makeUser(
        app,
        'save-preserve-type@qwertyuiop1234.com',
      );

      const initRes = await request(app.server)
        .post('/chart/init')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ chartType: 'manual' })
        .set('Content-Type', 'application/json');

      const chartToken = initRes.body.token;

      await request(app.server)
        .patch('/chart/save-config')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          token: chartToken,
          chartData: { series: [{ type: 'bar', data: [1] }] },
          manualType: 'bar',
        })
        .set('Content-Type', 'application/json');

      await request(app.server)
        .patch('/chart/save-config')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          token: chartToken,
          chartData: { series: [{ type: 'bar', data: [2] }] },
        })
        .set('Content-Type', 'application/json');

      const chart = await (app as any).prisma.chart.findUnique({
        where: { token: chartToken },
      });
      assert.equal(chart.manualType, 'bar');
    });

    test('overwrites previous config on subsequent save', async () => {
      const accessToken = await makeUser(
        app,
        'save-overwrite@qwertyuiop1234.com',
      );

      const initRes = await request(app.server)
        .post('/chart/init')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ chartType: 'manual' })
        .set('Content-Type', 'application/json');

      const chartToken = initRes.body.token;

      await request(app.server)
        .patch('/chart/save-config')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          token: chartToken,
          chartData: { series: [{ type: 'bar', data: [1] }] },
        })
        .set('Content-Type', 'application/json');

      const newConfig = { series: [{ type: 'line', data: [5, 10, 15] }] };

      await request(app.server)
        .patch('/chart/save-config')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ token: chartToken, chartData: newConfig })
        .set('Content-Type', 'application/json');

      const chart = await (app as any).prisma.chart.findUnique({
        where: { token: chartToken },
      });
      assert.deepEqual(chart.config, newConfig);
    });

    test('returns 403 when chart belongs to another user', async () => {
      const ownerToken = await makeUser(app, 'save-owner@qwertyuiop1234.com');
      const otherToken = await makeUser(app, 'save-other@qwertyuiop1234.com');

      const initRes = await request(app.server)
        .post('/chart/init')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ chartType: 'manual' })
        .set('Content-Type', 'application/json');

      const response = await request(app.server)
        .patch('/chart/save-config')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          token: initRes.body.token,
          chartData: { series: [{ type: 'bar', data: [1] }] },
        })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 403);
    });

    test('returns 404 for nonexistent chart token', async () => {
      const accessToken = await makeUser(
        app,
        'save-notfound@qwertyuiop1234.com',
      );

      const response = await request(app.server)
        .patch('/chart/save-config')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          token: 'manual-00000000-0000-0000-0000-000000000000',
          chartData: { series: [{ type: 'bar', data: [1] }] },
        })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 404);
    });

    test('returns 400 when chartData is missing', async () => {
      const accessToken = await makeUser(
        app,
        'save-no-data@qwertyuiop1234.com',
      );

      const initRes = await request(app.server)
        .post('/chart/init')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ chartType: 'manual' })
        .set('Content-Type', 'application/json');

      const response = await request(app.server)
        .patch('/chart/save-config')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ token: initRes.body.token })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 400);
    });

    test('returns 400 when token is missing', async () => {
      const accessToken = await makeUser(
        app,
        'save-no-token@qwertyuiop1234.com',
      );

      const response = await request(app.server)
        .patch('/chart/save-config')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ chartData: { series: [{ type: 'bar', data: [1] }] } })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 400);
    });

    test('returns 400 when manualType is invalid', async () => {
      const accessToken = await makeUser(
        app,
        'save-bad-type@qwertyuiop1234.com',
      );

      const initRes = await request(app.server)
        .post('/chart/init')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ chartType: 'manual' })
        .set('Content-Type', 'application/json');

      const response = await request(app.server)
        .patch('/chart/save-config')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          token: initRes.body.token,
          chartData: { series: [{ type: 'bar', data: [1] }] },
          manualType: 'donut',
        })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 400);
    });

    test('returns 401 without auth', async () => {
      const response = await request(app.server)
        .patch('/chart/save-config')
        .send({
          token: 'manual-some-token',
          chartData: { series: [{ type: 'bar', data: [1] }] },
        })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 401);
    });
  });

  describe('GET /chart', () => {
    test('returns empty list when user has no charts', async () => {
      const accessToken = await makeUser(app, 'list-empty@qwertyuiop1234.com');

      const response = await request(app.server)
        .get('/chart')
        .set('Authorization', `Bearer ${accessToken}`);

      assert.equal(response.status, 200);
      assert.deepEqual(response.body.charts, []);
    });

    test('returns only charts belonging to current user', async () => {
      const ownerToken = await makeUser(app, 'list-owner@qwertyuiop1234.com');
      const otherToken = await makeUser(app, 'list-other@qwertyuiop1234.com');

      const ownedInit = await request(app.server)
        .post('/chart/init')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ chartType: 'ai' })
        .set('Content-Type', 'application/json');

      await request(app.server)
        .post('/chart/init')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ chartType: 'manual' })
        .set('Content-Type', 'application/json');

      const response = await request(app.server)
        .get('/chart')
        .set('Authorization', `Bearer ${ownerToken}`);

      assert.equal(response.status, 200);
      assert.equal(response.body.charts.length, 1);
      assert.equal(response.body.charts[0].token, ownedInit.body.token);
    });

    test('returns charts ordered by updatedAt desc', async () => {
      const accessToken = await makeUser(app, 'list-order@qwertyuiop1234.com');

      const firstInit = await request(app.server)
        .post('/chart/init')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ chartType: 'manual' })
        .set('Content-Type', 'application/json');

      const secondInit = await request(app.server)
        .post('/chart/init')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ chartType: 'manual' })
        .set('Content-Type', 'application/json');

      await request(app.server)
        .patch('/chart/rename')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Bumped', token: firstInit.body.token })
        .set('Content-Type', 'application/json');

      const response = await request(app.server)
        .get('/chart')
        .set('Authorization', `Bearer ${accessToken}`);

      assert.equal(response.status, 200);
      assert.equal(response.body.charts.length, 2);
      assert.equal(response.body.charts[0].token, firstInit.body.token);
      assert.equal(response.body.charts[1].token, secondInit.body.token);
    });

    test('returns expected summary fields', async () => {
      const accessToken = await makeUser(app, 'list-fields@qwertyuiop1234.com');

      const initRes = await request(app.server)
        .post('/chart/init')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ chartType: 'manual' })
        .set('Content-Type', 'application/json');

      await request(app.server)
        .patch('/chart/save-config')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          token: initRes.body.token,
          chartData: { series: [{ type: 'pie', data: [1, 2] }] },
          manualType: 'pie',
        })
        .set('Content-Type', 'application/json');

      await request(app.server)
        .patch('/chart/rename')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Summary', token: initRes.body.token })
        .set('Content-Type', 'application/json');

      const response = await request(app.server)
        .get('/chart')
        .set('Authorization', `Bearer ${accessToken}`);

      assert.equal(response.status, 200);
      const [chart] = response.body.charts;
      assert.equal(chart.token, initRes.body.token);
      assert.equal(chart.name, 'Summary');
      assert.equal(chart.manualType, 'pie');
      assert.ok(chart.createdAt);
      assert.ok(chart.updatedAt);
      assert.ok(!('config' in chart));
      assert.ok(!('userId' in chart));
      assert.ok(!('id' in chart));
    });

    test('returns 401 without auth', async () => {
      const response = await request(app.server).get('/chart');

      assert.equal(response.status, 401);
    });
  });

  describe('GET /chart/:token', () => {
    test('returns chart data for own chart', async () => {
      const accessToken = await makeUser(app, 'get-ok@qwertyuiop1234.com');

      const initRes = await request(app.server)
        .post('/chart/init')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ chartType: 'manual' })
        .set('Content-Type', 'application/json');

      const chartToken = initRes.body.token;

      const response = await request(app.server)
        .get(`/chart/${chartToken}`)
        .set('Authorization', `Bearer ${accessToken}`);

      assert.equal(response.status, 200);
      assert.ok('chartData' in response.body);
      assert.ok('chartName' in response.body);
    });

    test('returns stored chart name and config after rename', async () => {
      const accessToken = await makeUser(app, 'get-named@qwertyuiop1234.com');

      const initRes = await request(app.server)
        .post('/chart/init')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ chartType: 'manual' })
        .set('Content-Type', 'application/json');

      const chartToken = initRes.body.token;

      await request(app.server)
        .patch('/chart/rename')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Sales Dashboard', token: chartToken })
        .set('Content-Type', 'application/json');

      const response = await request(app.server)
        .get(`/chart/${chartToken}`)
        .set('Authorization', `Bearer ${accessToken}`);

      assert.equal(response.status, 200);
      assert.equal(response.body.chartName, 'Sales Dashboard');
    });

    test('returns 403 when chart belongs to another user', async () => {
      const ownerToken = await makeUser(app, 'get-owner@qwertyuiop1234.com');
      const otherToken = await makeUser(app, 'get-other@qwertyuiop1234.com');

      const initRes = await request(app.server)
        .post('/chart/init')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ chartType: 'ai' })
        .set('Content-Type', 'application/json');

      const response = await request(app.server)
        .get(`/chart/${initRes.body.token}`)
        .set('Authorization', `Bearer ${otherToken}`);

      assert.equal(response.status, 403);
    });

    test('returns 404 for nonexistent token', async () => {
      const accessToken = await makeUser(app, 'get-notfound@qwertyuiop1234.com');

      const response = await request(app.server)
        .get('/chart/ai-00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`);

      assert.equal(response.status, 404);
    });

    test('returns 401 without auth', async () => {
      const response = await request(app.server).get('/chart/ai-some-token');

      assert.equal(response.status, 401);
    });
  });
});
