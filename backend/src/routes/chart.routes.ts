import { FastifyInstance } from 'fastify';

import chartController from '../controllers/chart.controller.js';

import rateLimitByIp from '../hooks/rateLimitByIp.js';

const chartRoutes = (fastify: FastifyInstance) => {
  fastify.post(
    '/init',
    {
      onRequest: [fastify.auth, rateLimitByIp(10, 60 * 1000)],
    },
    chartController.init,
  );

  fastify.post(
    '/verify-token',
    {
      onRequest: [fastify.auth, rateLimitByIp(60, 60 * 1000)],
    },
    chartController.verifyToken,
  );

  fastify.post(
    '/generate',
    {
      onRequest: [fastify.auth, rateLimitByIp(3, 60 * 1000)],
    },
    chartController.generate,
  );

  fastify.patch(
    '/rename',
    {
      onRequest: [fastify.auth, rateLimitByIp(30, 60 * 1000)],
    },
    chartController.rename,
  );

  fastify.get(
    '/',
    {
      onRequest: [fastify.auth, rateLimitByIp(60, 60 * 1000)],
    },
    chartController.list,
  );

  fastify.get(
    '/:token',
    {
      onRequest: [fastify.auth, rateLimitByIp(60, 60 * 1000)],
    },
    chartController.getByToken,
  );

  fastify.patch(
    '/save-config',
    {
      onRequest: [fastify.auth, rateLimitByIp(30, 60 * 1000)],
    },
    chartController.saveConfig,
  );
};

export default chartRoutes;
