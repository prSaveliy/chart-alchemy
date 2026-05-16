import Fastify, { FastifyRequest, FastifyReply } from 'fastify';

import fastifyEnv from '@fastify/env';
import fastifySensible from '@fastify/sensible';
import cookie from '@fastify/cookie';
import fastifySchedule from '@fastify/schedule';
import rateLimit from '@fastify/rate-limit';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import authPlugin from './plugins/auth.plugin.js';
import dbPlugin from './plugins/db.plugin.js';
import geminiPlugin from './plugins/gemini.plugin.js';
import googleAuthPlugin from './plugins/googleAuth.plugin.js';
import redisPlugin from './plugins/redis.plugin.js';

import authRoutes from './routes/auth.routes.js';
import oAuthRoutes from './routes/oauth.routes.js';
import chartRoutes from './routes/chart.routes.js';
import { buildContainer } from './container.js';

import { envSchema } from './commons/schemas/env.schema.js';
import type { AppError } from './commons/interfaces/errors/appError.interface.js';

import createPasswordResetTokenJob from './jobs/clearPasswordResetTokens.job.js';
import createExpiredRefreshTokensJob from './jobs/clearExpiredRefreshTokens.job.js';
import createExpiredActivationTokensJob from './jobs/clearExpiredActivationTokens.job.js';

const buildApp = async () => {
  const app = Fastify({
    logger: true,
    trustProxy: 1,
  });
  
  app.setErrorHandler((error: AppError, request: FastifyRequest, reply: FastifyReply) => {
    const statusCode = error.statusCode || 500;
    if (statusCode >= 500) {
      request.log.error({ err: error }, 'request failed');
    }
    reply.status(statusCode).send({
      message: statusCode < 500 || statusCode === 502
        ? error.message
        : 'Internal server error',
      details: error.details ?? '',
    });
  });

  // plugins
  await app.register(fastifyEnv, {
    schema: envSchema,
    dotenv: true,
  });
  app.register(fastifySensible);
  app.register(cookie);
  app.register(fastifySchedule);
  await app.register(rateLimit, {
    global: true,
    max: 1000,
    timeWindow: '15 minutes',
  });
  await app.register(cors, {
    origin: app.config.CORS_ORIGIN.split(',').map(s => s.trim()).filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  await app.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 1,
      fields: 10,
    },
    throwFileSizeLimit: true,
  });
  await app.register(dbPlugin);
  await app.register(authPlugin);
  await app.register(geminiPlugin);
  await app.register(googleAuthPlugin);
  await app.register(redisPlugin);

  const { authController, oAuthController, chartController } = buildContainer(app);

  // routes
  await app.register(authRoutes(authController), {
    prefix: 'auth',
  });
  await app.register(oAuthRoutes(oAuthController), {
    prefix: 'oauth/google',
  });
  await app.register(chartRoutes(chartController), {
    prefix: 'chart',
  });
  
  // async jobs
  app.ready().then(() => {
    app.scheduler.addSimpleIntervalJob(createPasswordResetTokenJob(app));
    app.scheduler.addSimpleIntervalJob(createExpiredRefreshTokensJob(app));
    app.scheduler.addSimpleIntervalJob(createExpiredActivationTokensJob(app));
  });

  return app;
};

export default buildApp;
