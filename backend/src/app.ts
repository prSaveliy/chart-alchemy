import Fastify from 'fastify';

import fastifyEnv from '@fastify/env';
import dbPlugin from './plugins/db.plugin.js';

import { envSchema } from './commons/schemas/env.schema.js';

const buildApp = async () => {
  const app = Fastify({
    logger: true,
  });

  // plugins
  await app.register(fastifyEnv, {
    schema: envSchema,
    dotenv: true,
  });
  app.register(dbPlugin);

  return app;
};

export default buildApp;
