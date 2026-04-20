import { FastifyInstance } from 'fastify';

import chartController from '../controllers/chart.controller.js';

import rateLimitByIp from '../hooks/rateLimitByIp.js';

import memoizePrompt from '../hooks/memoizePrompt.js';

const promptHooks = memoizePrompt();

const chartRoutes = (fastify: FastifyInstance) => {
  fastify.post(
    '/init',
    {
      // onRequest: [fastify.auth, rateLimitByIp(5, 60 * 1000)],
      onRequest: fastify.auth,
    },
    chartController.init,
  );

  fastify.post(
    '/verify-token',
    {
      // onRequest: [fastify.auth, rateLimitByIp(30, 60 * 1000)],
      onRequest: fastify.auth,
    },
    chartController.verifyToken,
  );

  fastify.post(
    '/generate',
    {
      onRequest: [fastify.auth, rateLimitByIp(3, 60 * 1000)],
      preHandler: [promptHooks.preHandler],
      onSend: promptHooks.onSend,
    },
    chartController.generate,
  );

  fastify.patch(
    '/rename',
    {
      // onRequest: [fastify.auth, rateLimitByIp(30, 60 * 1000)],
      onRequest: fastify.auth,
    },
    chartController.rename,
  );

  fastify.get(
    '/',
    {
      onRequest: fastify.auth,
    },
    chartController.list,
  );

  fastify.get(
    '/:token',
    {
      // onRequest: [fastify.auth, rateLimitByIp(5, 60 * 1000)],
      onRequest: fastify.auth,
    },
    chartController.getByToken,
  );

  fastify.patch(
    '/save-config',
    {
      // onRequest: [fastify.auth, rateLimitByIp(30, 60 * 1000)],
      onRequest: fastify.auth,
    },
    chartController.saveConfig,
  );
};

export default chartRoutes;
