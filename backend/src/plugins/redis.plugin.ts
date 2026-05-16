import fastifyPlugin from 'fastify-plugin';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';

import fastifyRedis from '@fastify/redis';

const redisPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  await fastify.register(fastifyRedis, {
    url: fastify.config.REDIS_URL,
    closeClient: true,
  });
};

export default fastifyPlugin(redisPlugin);
