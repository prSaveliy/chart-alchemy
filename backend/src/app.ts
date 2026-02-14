import Fastify from "fastify";

import fastifyEnv from "@fastify/env";

import { envSchema } from "./commons/schemas/env.schema.js";

const buildApp = async () => {
  const app = Fastify({
    logger: true,
  });
  
  // plugins
  await app.register(fastifyEnv, {
    schema: envSchema,
    dotenv: true,
  });

  return app;
};

export default buildApp;
