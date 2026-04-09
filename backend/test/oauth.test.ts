import { describe, test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import request from 'supertest';
import { FastifyInstance } from 'fastify';
import buildApp from '../src/app.js';
import oauthService from '../src/services/oauth.service.js';

describe('oauth integration tests', () => {
  let app: FastifyInstance;

  before(async () => {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('Refusing to wipe database: NODE_ENV is not "test"');
    }
    app = await buildApp();
    await app.ready();
    const { execSync } = await import('node:child_process');
    execSync('npx prisma migrate reset --force');
  });

  after(async () => {
    await app.close();
  });

  describe('GET /oauth/google/redirect-to-url', () => {
    test('redirects to Google OAuth URL', async () => {
      const response = await request(app.server).get(
        '/oauth/google/redirect-to-url',
      );

      assert.equal(response.status, 302);
      assert.ok(
        response.headers.location?.startsWith(
          'https://accounts.google.com/o/oauth2/v2/auth',
        ),
      );
    });

    test('sets oauth_state cookie', async () => {
      const response = await request(app.server).get(
        '/oauth/google/redirect-to-url',
      );

      const setCookie = response.headers['set-cookie'] as string[] | string;
      const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
      const stateCookie = cookies.find(c => c.startsWith('oauth_state='));
      assert.ok(stateCookie, 'oauth_state cookie should be set');
    });

    test('includes state param in redirect URL matching the cookie value', async () => {
      const response = await request(app.server).get(
        '/oauth/google/redirect-to-url',
      );

      const setCookie = response.headers['set-cookie'] as string[] | string;
      const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
      const stateCookie = cookies.find(c => c.startsWith('oauth_state='));
      assert.ok(stateCookie);

      const cookieValue = stateCookie.split(';')[0].split('=')[1];
      const redirectUrl = new URL(response.headers.location!);
      assert.equal(redirectUrl.searchParams.get('state'), cookieValue);
    });

    test('redirect URL includes required OAuth params', async () => {
      const response = await request(app.server).get(
        '/oauth/google/redirect-to-url',
      );

      const redirectUrl = new URL(response.headers.location!);
      assert.ok(redirectUrl.searchParams.get('client_id'));
      assert.ok(redirectUrl.searchParams.get('redirect_uri'));
      assert.equal(redirectUrl.searchParams.get('response_type'), 'code');
      assert.ok(redirectUrl.searchParams.get('scope'));
      assert.ok(redirectUrl.searchParams.get('state'));
    });
  });

  describe('POST /oauth/google/handle-code', () => {
    test('returns 400 if code is missing', async () => {
      const response = await request(app.server)
        .post('/oauth/google/handle-code')
        .send({ state: 'some-state' })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 400);
    });

    test('returns 400 if state is missing', async () => {
      const response = await request(app.server)
        .post('/oauth/google/handle-code')
        .send({ code: 'some-code' })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 400);
    });

    test('returns 400 if body is empty', async () => {
      const response = await request(app.server)
        .post('/oauth/google/handle-code')
        .send({})
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 400);
    });

    test('returns 403 if oauth_state cookie is absent', async () => {
      const response = await request(app.server)
        .post('/oauth/google/handle-code')
        .send({ code: 'some-code', state: 'some-state' })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 403);
    });

    test('returns 403 if oauth_state cookie does not match state in body', async () => {
      const response = await request(app.server)
        .post('/oauth/google/handle-code')
        .send({ code: 'some-code', state: 'state-from-body' })
        .set('Content-Type', 'application/json')
        .set('Cookie', 'oauth_state=different-state');

      assert.equal(response.status, 403);
    });

    test('returns 400 when state matches but Google rejects the code', async () => {
      const state = 'valid-matching-state';

      const response = await request(app.server)
        .post('/oauth/google/handle-code')
        .send({ code: 'invalid-google-code', state })
        .set('Content-Type', 'application/json')
        .set('Cookie', `oauth_state=${state}`);

      assert.equal(response.status, 400);
    });
  });

  describe('OAuthService.authorize', () => {
    before(() => {
      (app as any).googleAuthClient.verifyIdToken = async ({ idToken }: { idToken: string }) => {
        const payload = app.jwt.decode<{ email: string; sub: string; picture: string }>(idToken);
        return { getPayload: () => payload };
      };
    });

    function makeIdToken(
      email: string,
      sub: string,
      picture = 'https://pic.test/avatar.jpg',
    ) {
      return (app as any).jwt.sign({ email, sub, picture });
    }

    test('creates a new user when no matching sub or email exists', async () => {
      const email = 'new-user@oauth-authorize.test';
      const sub = 'sub-new-user';

      await oauthService.authorize(app, { id_token: makeIdToken(email, sub, 'pic-new') } as any);

      const user = await (app as any).prisma.user.findUnique({ where: { sub } });
      assert.ok(user);
      assert.equal(user.email, email);
      assert.equal(user.picture, 'pic-new');
      assert.equal(user.isActivated, false);
    });

    test('assigns sub and picture to an existing email-only user', async () => {
      const email = 'assign-sub@oauth-authorize.test';
      const sub = 'sub-assign';
      await (app as any).prisma.user.create({
        data: { email, password: 'hash', isActivated: true },
      });

      await oauthService.authorize(app, { id_token: makeIdToken(email, sub, 'pic-url') } as any);

      const user = await (app as any).prisma.user.findUnique({ where: { email } });
      assert.equal(user.sub, sub);
      assert.equal(user.picture, 'pic-url');
    });

    test('updates picture when same user logs in again with same email', async () => {
      const email = 'repeat-login@oauth-authorize.test';
      const sub = 'sub-repeat-login';
      await (app as any).prisma.user.create({
        data: { email, sub, isActivated: true, picture: 'old-pic' },
      });

      await oauthService.authorize(app, { id_token: makeIdToken(email, sub, 'new-pic') } as any);

      const user = await (app as any).prisma.user.findUnique({ where: { sub } });
      assert.equal(user.email, email);
      assert.equal(user.picture, 'new-pic');
    });

    test('updates email and picture when sub matches with no collision', async () => {
      const sub = 'sub-update-email';
      await (app as any).prisma.user.create({
        data: { email: 'old@oauth-authorize.test', sub, isActivated: true, picture: 'old-pic' },
      });

      await oauthService.authorize(
        app,
        { id_token: makeIdToken('new@oauth-authorize.test', sub, 'new-pic') } as any,
      );

      const user = await (app as any).prisma.user.findUnique({ where: { sub } });
      assert.equal(user.email, 'new@oauth-authorize.test');
      assert.equal(user.picture, 'new-pic');
    });

    test('returns access token, refresh token, and user DTO', async () => {
      const email = 'returns-tokens@oauth-authorize.test';
      const sub = 'sub-returns-tokens';

      const result = await oauthService.authorize(app, { id_token: makeIdToken(email, sub) } as any);

      assert.ok(result.accessToken);
      assert.ok(result.refreshToken);
      assert.equal(result.user.email, email);
      assert.ok(result.user.id);
    });

    test('saves refresh token to DB', async () => {
      const email = 'saves-refresh@oauth-authorize.test';
      const sub = 'sub-saves-refresh';

      await oauthService.authorize(app, { id_token: makeIdToken(email, sub) } as any);

      const user = await (app as any).prisma.user.findUnique({ where: { sub } });
      const token = await (app as any).prisma.refreshToken.findFirst({
        where: { userId: user.id },
      });
      assert.ok(token);
      assert.ok(token.expiresAt > new Date());
    });

    describe('when Google email changed and collision account is unactivated', () => {
      test('deletes the unactivated collision account', async () => {
        const sub = 'sub-collision-unactivated';
        const collisionId = (await (app as any).prisma.user.create({
          data: { email: 'collision-unactivated@oauth-authorize.test', password: 'hash', isActivated: false },
        })).id;
        await (app as any).prisma.user.create({
          data: { email: 'coll-unact-old@oauth-authorize.test', sub, isActivated: true },
        });

        await oauthService.authorize(
          app,
          { id_token: makeIdToken('collision-unactivated@oauth-authorize.test', sub) } as any,
        );

        const deleted = await (app as any).prisma.user.findUnique({ where: { id: collisionId } });
        assert.equal(deleted, null);
      });

      test('updates the sub user to the new email', async () => {
        const sub = 'sub-collision-email-update';
        await (app as any).prisma.user.create({
          data: { email: 'coll-email-old@oauth-authorize.test', sub, isActivated: true },
        });
        await (app as any).prisma.user.create({
          data: { email: 'coll-email-new@oauth-authorize.test', password: 'hash', isActivated: false },
        });

        await oauthService.authorize(
          app,
          { id_token: makeIdToken('coll-email-new@oauth-authorize.test', sub) } as any,
        );

        const user = await (app as any).prisma.user.findUnique({ where: { sub } });
        assert.equal(user.email, 'coll-email-new@oauth-authorize.test');
      });
    });

    describe('when Google email changed and collision account is activated (merge)', () => {
      test('moves charts from sub user to the activated collision account', async () => {
        const sub = 'sub-merge-charts';
        const subUser = await (app as any).prisma.user.create({
          data: { email: 'merge-charts-old@oauth-authorize.test', sub, isActivated: true },
        });
        const emailUser = await (app as any).prisma.user.create({
          data: { email: 'merge-charts-new@oauth-authorize.test', password: 'hash', isActivated: true },
        });
        await (app as any).prisma.chart.createMany({
          data: [
            { userId: subUser.id, name: 'Chart A', token: crypto.randomUUID(), config: '{}' },
            { userId: subUser.id, name: 'Chart B', token: crypto.randomUUID(), config: '{}' },
          ],
        });

        await oauthService.authorize(
          app,
          { id_token: makeIdToken('merge-charts-new@oauth-authorize.test', sub) } as any,
        );

        const charts = await (app as any).prisma.chart.findMany({
          where: { userId: emailUser.id },
        });
        assert.equal(charts.length, 2);
      });

      test('deletes the sub user after merging', async () => {
        const sub = 'sub-merge-delete';
        const subUser = await (app as any).prisma.user.create({
          data: { email: 'merge-delete-old@oauth-authorize.test', sub, isActivated: true },
        });
        await (app as any).prisma.user.create({
          data: { email: 'merge-delete-new@oauth-authorize.test', password: 'hash', isActivated: true },
        });

        await oauthService.authorize(
          app,
          { id_token: makeIdToken('merge-delete-new@oauth-authorize.test', sub) } as any,
        );

        const deleted = await (app as any).prisma.user.findUnique({ where: { id: subUser.id } });
        assert.equal(deleted, null);
      });

      test('links sub and picture to the surviving activated account', async () => {
        const sub = 'sub-merge-link';
        await (app as any).prisma.user.create({
          data: { email: 'merge-link-old@oauth-authorize.test', sub, isActivated: true },
        });
        const emailUser = await (app as any).prisma.user.create({
          data: { email: 'merge-link-new@oauth-authorize.test', password: 'hash', isActivated: true },
        });

        await oauthService.authorize(
          app,
          { id_token: makeIdToken('merge-link-new@oauth-authorize.test', sub, 'merged-pic') } as any,
        );

        const merged = await (app as any).prisma.user.findUnique({ where: { sub } });
        assert.equal(merged.id, emailUser.id);
        assert.equal(merged.picture, 'merged-pic');
      });

      test('returns tokens scoped to the surviving account', async () => {
        const sub = 'sub-merge-tokens';
        await (app as any).prisma.user.create({
          data: { email: 'merge-tokens-old@oauth-authorize.test', sub, isActivated: true },
        });
        const emailUser = await (app as any).prisma.user.create({
          data: { email: 'merge-tokens-new@oauth-authorize.test', password: 'hash', isActivated: true },
        });

        const result = await oauthService.authorize(
          app,
          { id_token: makeIdToken('merge-tokens-new@oauth-authorize.test', sub) } as any,
        );

        assert.ok(result.accessToken);
        assert.equal(result.user.id, emailUser.id);
        assert.equal(result.user.email, 'merge-tokens-new@oauth-authorize.test');
      });
    });
  });
});
