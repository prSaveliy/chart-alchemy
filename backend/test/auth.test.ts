import { describe, test, before, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import crypto from 'node:crypto';

import { FastifyInstance } from 'fastify';

import buildApp from '../src/app.js';

import mailService from '../src/services/mail.service.js';

describe('auth integration tests', () => {
  let app: FastifyInstance;

  before(async () => {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('Refusing to wipe database: NODE_ENV is not "test"');
    }

    mock.method(mailService, 'sendActivationLink', async () => {});
    mock.method(mailService, 'sendPasswordResetLink', async () => {});

    app = await buildApp();
    await app.ready();
    const { execSync } = await import('node:child_process');
    execSync('npx prisma migrate reset --force');
  });

  after(async () => {
    await app.close();
  });

  describe('POST /auth/registration', () => {
    test('return 200 on successful registration with valid credentials', async () => {
      const email = 'successful-registration@qwertyuiop1234.com';

      const response = await request(app.server)
        .post('/auth/registration')
        .send({
          email,
          password: 'password123',
        })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 200);
    });

    test('return 400 if email is invalid', async () => {
      const response = await request(app.server)
        .post('/auth/registration')
        .send({
          email: 'not-an-email',
          password: 'password123',
        })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 400);
    });

    test('return 400 if email is awaiting activation', async () => {
      const email = 'active-token@qwertyuiop1234.com';
      const user = await (app as any).prisma.user.create({
        data: {
          email,
          password: 'hashedpassword',
          isActivated: false,
        },
      });

      await (app as any).prisma.accountActivationToken.create({
        data: {
          userId: user.id,
          token: 'active-token',
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      const response = await request(app.server)
        .post('/auth/registration')
        .send({
          email,
          password: 'password123',
        })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 400);
    });

    test('return 200 and resend activation if user exists, is not activated, and token is missing', async () => {
      const email = 'missing-token@qwertyuiop1234.com';
      await (app as any).prisma.user.create({
        data: {
          email,
          password: 'hashedpassword',
          isActivated: false,
        },
      });

      const response = await request(app.server)
        .post('/auth/registration')
        .send({
          email,
          password: 'password123',
        })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 200);

      const token = await (app as any).prisma.accountActivationToken.findFirst({
        where: { user: { email } },
      });
      assert.ok(token);
    });

    test('return 200 and resend activation if user exists, is not activated, and token is expired', async () => {
      const email = 'expired-token@qwertyuiop1234.com';
      const user = await (app as any).prisma.user.create({
        data: {
          email,
          password: 'hashedpassword',
          isActivated: false,
        },
      });
      await (app as any).prisma.accountActivationToken.create({
        data: {
          userId: user.id,
          token: 'old-expired-token',
          expiresAt: new Date(Date.now() - 10000),
        },
      });

      const response = await request(app.server)
        .post('/auth/registration')
        .send({
          email,
          password: 'password123',
        })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 200);

      const tokens = await (app as any).prisma.accountActivationToken.findMany({
        where: { userId: user.id },
      });
      assert.equal(tokens.length, 1);
      assert.notEqual(tokens[0].token, 'old-expired-token');
    });

    test('return 409 if fully activated user already exists', async () => {
      const email = 'activated@qwertyuiop1234.com';
      await (app as any).prisma.user.create({
        data: {
          email,
          password: 'hashedpassword',
          isActivated: true,
        },
      });

      const response = await request(app.server)
        .post('/auth/registration')
        .send({ email, password: 'password123' })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 409);
    });

    test('create pending user if the oauth account already exists', async () => {
      const email = 'pending@qwertyuiop1234.com';
      await (app as any).prisma.user.create({
        data: {
          email,
          isActivated: false,
          sub: '12345',
        },
      });

      const response = await request(app.server)
        .post('/auth/registration')
        .send({ email, password: 'password123' })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 200);

      const pendingUser = await (app as any).prisma.pendingUser.findUnique({
        where: { email },
      });

      assert.ok(pendingUser);
    });

    test('create account activation token for pending user if missing', async () => {
      const email = 'missing-token-pending@qwertyuiop1234.com';
      await (app as any).prisma.user.create({
        data: {
          email,
          isActivated: false,
          sub: '123456',
        },
      });

      const pendingUser = await (app as any).prisma.pendingUser.create({
        data: {
          email,
          password: 'hashedpassword',
        },
      });

      const response = await request(app.server)
        .post('/auth/registration')
        .send({ email, password: 'password123' })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 200);

      const token = await (app as any).prisma.accountActivationToken.findUnique(
        {
          where: { pendingUserId: pendingUser.id },
        },
      );

      assert.ok(token);
    });

    test('create account activation token for pending user if expired', async () => {
      const email = 'expired-token-pending@qwertyuiop1234.com';
      await (app as any).prisma.user.create({
        data: {
          email,
          isActivated: false,
          sub: '1234567',
        },
      });

      const pendingUser = await (app as any).prisma.pendingUser.create({
        data: {
          email,
          password: 'hashedpassword',
        },
      });

      await (app as any).prisma.accountActivationToken.create({
        data: {
          pendingUserId: pendingUser.id,
          token: 'old-expired-token-pending',
          expiresAt: new Date(Date.now() - 10000),
        },
      });

      const response = await request(app.server)
        .post('/auth/registration')
        .send({ email, password: 'password123' })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 200);

      const token = await (app as any).prisma.accountActivationToken.findUnique(
        {
          where: { pendingUserId: pendingUser.id },
        },
      );

      assert.ok(token.expiresAt > new Date());
    });

    test('return 400 if activation token is not expired for pending user', async () => {
      const email = 'active-token-pending@qwertyuiop1234.com';
      await (app as any).prisma.user.create({
        data: {
          email,
          isActivated: false,
          sub: '12345678',
        },
      });

      const pendingUser = await (app as any).prisma.pendingUser.create({
        data: {
          email,
          password: 'hashedpassword',
        },
      });

      await (app as any).prisma.accountActivationToken.create({
        data: {
          pendingUserId: pendingUser.id,
          token: 'active-token-pending',
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      const response = await request(app.server)
        .post('/auth/registration')
        .send({ email, password: 'password123' })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 400);
    });
  });

  describe('POST /auth/activate', () => {
    test('activates user and returns 200 with valid token', async () => {
      const email = 'activate-me@qwertyuiop1234.com';
      const user = await (app as any).prisma.user.create({
        data: { email, password: 'hashedpassword', isActivated: false },
      });
      const { v4: uuidv4 } = await import('uuid');
      const tokenValue = uuidv4();
      await (app as any).prisma.accountActivationToken.create({
        data: {
          userId: user.id,
          token: tokenValue,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      const response = await request(app.server)
        .post('/auth/activate')
        .send({ token: tokenValue })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 200);

      const updated = await (app as any).prisma.user.findUnique({
        where: { email },
      });
      assert.equal(updated.isActivated, true);

      const deletedToken = await (
        app as any
      ).prisma.accountActivationToken.findUnique({
        where: { userId: user.id },
      });
      assert.equal(deletedToken, null);
    });

    test('returns 400 on invalid token', async () => {
      const response = await request(app.server)
        .post('/auth/activate')
        .send({ token: 'nonexistent-token' })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 400);
    });

    test('returns 400 on expired token', async () => {
      const email = 'expired-activation@qwertyuiop1234.com';
      const user = await (app as any).prisma.user.create({
        data: { email, password: 'hashedpassword', isActivated: false },
      });
      const { v4: uuidv4 } = await import('uuid');
      const tokenValue = uuidv4();
      await (app as any).prisma.accountActivationToken.create({
        data: {
          userId: user.id,
          token: tokenValue,
          expiresAt: new Date(Date.now() - 1000),
        },
      });

      const response = await request(app.server)
        .post('/auth/activate')
        .send({ token: tokenValue })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 400);
    });
  });

  describe('POST /auth/login', () => {
    test('returns 200 with tokens for valid activated user', async () => {
      const bcrypt = await import('bcrypt');
      const email = 'login-ok@qwertyuiop1234.com';
      const password = 'password123';
      await (app as any).prisma.user.create({
        data: {
          email,
          password: await bcrypt.hash(password, 10),
          isActivated: true,
        },
      });

      const response = await request(app.server)
        .post('/auth/login')
        .send({ email, password })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 200);
      assert.ok(response.body.accessToken);
      assert.ok(response.headers['set-cookie']);
    });

    test('returns 401 on wrong password', async () => {
      const bcrypt = await import('bcrypt');
      const email = 'login-wrongpass@qwertyuiop1234.com';
      await (app as any).prisma.user.create({
        data: {
          email,
          password: await bcrypt.hash('correctpassword', 10),
          isActivated: true,
        },
      });

      const response = await request(app.server)
        .post('/auth/login')
        .send({ email, password: 'wrongpassword' })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 401);
    });

    test('returns 401 for non-existent user', async () => {
      const response = await request(app.server)
        .post('/auth/login')
        .send({ email: 'nobody@qwertyuiop1234.com', password: 'password123' })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 401);
    });

    test('returns 401 for unactivated user', async () => {
      const bcrypt = await import('bcrypt');
      const email = 'login-inactive@qwertyuiop1234.com';
      const password = 'password123';
      await (app as any).prisma.user.create({
        data: {
          email,
          password: await bcrypt.hash(password, 10),
          isActivated: false,
        },
      });

      const response = await request(app.server)
        .post('/auth/login')
        .send({ email, password })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 401);
    });

    test('returns 400 on invalid email format', async () => {
      const response = await request(app.server)
        .post('/auth/login')
        .send({ email: 'not-an-email', password: 'password123' })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 400);
    });

    test('returns 400 on password shorter than 8 characters', async () => {
      const response = await request(app.server)
        .post('/auth/login')
        .send({ email: 'user@qwertyuiop1234.com', password: 'short' })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 400);
    });
  });

  describe('POST /auth/refresh', () => {
    test('returns 200 with new tokens for valid refresh cookie', async () => {
      const bcrypt = await import('bcrypt');
      const email = 'refresh-ok@qwertyuiop1234.com';
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

      const cookie = loginRes.headers['set-cookie'];
      assert.ok(cookie, 'login should set a cookie');

      const oldToken = await (app as any).prisma.refreshToken.findFirst({
        where: { user: { email } },
      });

      const response = await request(app.server)
        .post('/auth/refresh')
        .set('Cookie', cookie);

      assert.equal(response.status, 200);
      assert.ok(response.body.accessToken);
      assert.ok(response.headers['set-cookie']);

      const rotatedOut = await (app as any).prisma.refreshToken.findUnique({
        where: { token: oldToken.token },
      });
      assert.equal(rotatedOut, null);
    });

    test('returns 401 with no refresh cookie', async () => {
      const response = await request(app.server).post('/auth/refresh');
      assert.equal(response.status, 401);
    });

    test('returns 401 with a malformed JWT in cookie', async () => {
      const response = await request(app.server)
        .post('/auth/refresh')
        .set('Cookie', 'refreshToken=not.a.jwt');

      assert.equal(response.status, 401);
    });

    test('returns 401 with valid JWT not stored in DB', async () => {
      const bcrypt = await import('bcrypt');
      const email = 'refresh-missing-db@qwertyuiop1234.com';
      const password = 'password123';
      const user = await (app as any).prisma.user.create({
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

      await (app as any).prisma.refreshToken.deleteMany({
        where: { userId: user.id },
      });

      const cookie = loginRes.headers['set-cookie'];
      const response = await request(app.server)
        .post('/auth/refresh')
        .set('Cookie', cookie);

      assert.equal(response.status, 401);
    });
  });

  describe('POST /auth/logout', () => {
    test('returns 200 and removes refresh token from DB', async () => {
      const bcrypt = await import('bcrypt');
      const email = 'logout-ok@qwertyuiop1234.com';
      const password = 'password123';
      const user = await (app as any).prisma.user.create({
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

      const cookie = loginRes.headers['set-cookie'];

      const response = await request(app.server)
        .post('/auth/logout')
        .set('Cookie', cookie);

      assert.equal(response.status, 200);

      const tokens = await (app as any).prisma.refreshToken.findMany({
        where: { userId: user.id },
      });
      assert.equal(tokens.length, 0);
    });

    test('returns 200 when no cookie is present', async () => {
      const response = await request(app.server).post('/auth/logout');
      assert.equal(response.status, 200);
    });
  });

  describe('POST /auth/forgot-password', () => {
    test('returns 200 and creates reset token for existing user', async () => {
      const bcrypt = await import('bcrypt');
      const email = 'forgot-ok@qwertyuiop1234.com';
      await (app as any).prisma.user.create({
        data: {
          email,
          password: await bcrypt.hash('password123', 10),
          isActivated: true,
        },
      });

      const response = await request(app.server)
        .post('/auth/forgot-password')
        .send({ email })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 200);

      const token = await (app as any).prisma.resetPasswordToken.findFirst({
        where: { email },
      });
      assert.ok(token);
      assert.ok(token.expiresAt > new Date());
    });

    test('returns 200 and creates reset token for oauth only user', async () => {
      const email = 'oauth-only@qwertyuiop1234.com';
      await (app as any).prisma.user.create({
        data: {
          email,
          isActivated: false,
          sub: '123456789',
        },
      });

      const response = await request(app.server)
        .post('/auth/forgot-password')
        .send({ email })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 200);

      const token = await (app as any).prisma.resetPasswordToken.findFirst({
        where: { email },
      });
      assert.ok(token);
    });

    test('returns 200 silently when user does not exist', async () => {
      const response = await request(app.server)
        .post('/auth/forgot-password')
        .send({ email: 'ghost@qwertyuiop1234.com' })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 200);
    });

    test('replaces existing reset token when requested again', async () => {
      const bcrypt = await import('bcrypt');
      const email = 'forgot-replace@qwertyuiop1234.com';
      await (app as any).prisma.user.create({
        data: {
          email,
          password: await bcrypt.hash('password123', 10),
          isActivated: true,
        },
      });
      await (app as any).prisma.resetPasswordToken.create({
        data: {
          email,
          token: 'old-reset-token',
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      await request(app.server)
        .post('/auth/forgot-password')
        .send({ email })
        .set('Content-Type', 'application/json');

      const tokens = await (app as any).prisma.resetPasswordToken.findMany({
        where: { email },
      });
      assert.equal(tokens.length, 1);
      assert.notEqual(tokens[0].token, 'old-reset-token');
    });

    test('returns 400 on invalid email format', async () => {
      const response = await request(app.server)
        .post('/auth/forgot-password')
        .send({ email: 'not-an-email' })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 400);
    });
  });

  describe('GET /auth/verify-reset-token/:token', () => {
    test('returns 200 for valid reset token', async () => {
      const email = 'verify-token-ok@qwertyuiop1234.com';
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');
      await (app as any).prisma.resetPasswordToken.create({
        data: {
          email,
          token: hashedToken,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      const response = await request(app.server).get(
        `/auth/verify-reset-token/${rawToken}`,
      );

      assert.equal(response.status, 200);
    });

    test('returns 400 for nonexistent token', async () => {
      const rawToken = crypto.randomBytes(32).toString('hex');

      const response = await request(app.server).get(
        `/auth/verify-reset-token/${rawToken}`,
      );

      assert.equal(response.status, 400);
    });

    test('returns 400 for expired token', async () => {
      const email = 'verify-token-expired@qwertyuiop1234.com';
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');
      await (app as any).prisma.resetPasswordToken.create({
        data: {
          email,
          token: hashedToken,
          expiresAt: new Date(Date.now() - 1000),
        },
      });

      const response = await request(app.server).get(
        `/auth/verify-reset-token/${rawToken}`,
      );

      assert.equal(response.status, 400);
    });
  });

  describe('POST /auth/reset-password', () => {
    test('returns 201 and updates password with valid token', async () => {
      const bcrypt = await import('bcrypt');
      const email = 'reset-ok@qwertyuiop1234.com';
      await (app as any).prisma.user.create({
        data: {
          email,
          password: await bcrypt.hash('oldpassword', 10),
          isActivated: true,
        },
      });
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');
      await (app as any).prisma.resetPasswordToken.create({
        data: {
          email,
          token: hashedToken,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      const response = await request(app.server)
        .post('/auth/reset-password')
        .send({ token: rawToken, password: 'newpassword123' })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 201);

      const remaining = await (app as any).prisma.resetPasswordToken.findFirst({
        where: { email },
      });
      assert.equal(remaining, null);

      const bcrypt2 = await import('bcrypt');
      const updatedUser = await (app as any).prisma.user.findUnique({
        where: { email },
      });
      assert.equal(updatedUser.isActivated, true);
      assert.ok(await bcrypt2.compare('newpassword123', updatedUser.password));
    });

    test('returns 400 on invalid token', async () => {
      const rawToken = crypto.randomBytes(32).toString('hex');

      const response = await request(app.server)
        .post('/auth/reset-password')
        .send({ token: rawToken, password: 'newpassword123' })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 400);
    });

    test('returns 400 on password shorter than 8 characters', async () => {
      const rawToken = crypto.randomBytes(32).toString('hex');

      const response = await request(app.server)
        .post('/auth/reset-password')
        .send({ token: rawToken, password: 'short' })
        .set('Content-Type', 'application/json');

      assert.equal(response.status, 400);
    });
  });
});
