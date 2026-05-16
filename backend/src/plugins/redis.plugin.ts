import fastifyPlugin from 'fastify-plugin';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';

import fastifyRedis from '@fastify/redis';

const redisPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const isTlsRedis = fastify.config.REDIS_URL.startsWith('rediss://');

  await fastify.register(fastifyRedis, {
    url: fastify.config.REDIS_URL,
    closeClient: true,
    ...(isTlsRedis
      ? {
          tls: {
            rejectUnauthorized: false,
          },
        }
      : {}),
  });
};

export default fastifyPlugin(redisPlugin);
