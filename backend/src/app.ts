import Fastify, { FastifyRequest, FastifyReply } from 'fastify';

import fastifyEnv from '@fastify/env';
import fastifySensible from '@fastify/sensible';
import cookie from '@fastify/cookie';
import fastifySchedule from '@fastify/schedule';
import rateLimit from '@fastify/rate-limit';
import cors from '@fastify/cors';
import authPlugin from './plugins/auth.plugin.js';
import dbPlugin from './plugins/db.plugin.js';
import geminiPlugin from './plugins/gemini.plugin.js';

import authRoutes from './routes/auth.routes.js';
import oAuthRoutes from './routes/oauth.routes.js';
import geminiRoutes from './routes/gemini.routes.js';

import { envSchema } from './commons/schemas/env.schema.js';
import { AppError } from './commons/types/error.js';

import createPasswordResetTokenJob from './jobs/clearPasswordResetTokens.job.js';
import createExpiredRefreshTokensJob from './jobs/clearExpiredRefreshTokens.job.js';
import createExpiredActivationTokensJob from './jobs/clearExpiredActivationTokens.job.js';

const buildApp = async () => {
  const app = Fastify({
    logger: true,
    trustProxy: 1,
  });
  
  app.setErrorHandler((error: AppError, request: FastifyRequest, reply: FastifyReply) => {
    reply.status(error.statusCode || 500).send({
      message: error.statusCode && error.statusCode < 500
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
    origin: 'http://localhost:5173',
    credentials: true,
  });
  app.register(dbPlugin);
  app.register(authPlugin);
  app.register(geminiPlugin);

  // routes
  app.register(authRoutes, {
    prefix: 'auth',
  });
  app.register(oAuthRoutes, {
    prefix: 'oauth/google',
  });
  app.register(geminiRoutes, {
    prefix: 'gemini',
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
