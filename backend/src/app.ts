import Fastify, { FastifyRequest, FastifyReply } from 'fastify';

import fastifyEnv from '@fastify/env';
import fastifySensible from '@fastify/sensible';
import cookie from '@fastify/cookie';
import fastifySchedule from '@fastify/schedule';
import authPlugin from './plugins/auth.plugin.js';
import dbPlugin from './plugins/db.plugin.js';

import authRoutes from './routes/auth.routes.js';

import { envSchema } from './commons/schemas/env.schema.js';
import { AppError } from './commons/types/error.js';

import createPasswordResetTokenJob from './jobs/clearPasswordResetTokens.job.js';
import createExpiredRefreshTokensJob from './jobs/clearExpiredRefreshTokens.job.js';

const buildApp = async () => {
  const app = Fastify({
    logger: true,
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
  app.register(dbPlugin);
  app.register(authPlugin);

  // routes
  app.register(authRoutes, {
    prefix: 'auth',
  });
  
  // async jobs
  app.ready().then(() => {
    app.scheduler.addSimpleIntervalJob(createPasswordResetTokenJob(app));
    app.scheduler.addSimpleIntervalJob(createExpiredRefreshTokensJob(app));
  });

  return app;
};

export default buildApp;
