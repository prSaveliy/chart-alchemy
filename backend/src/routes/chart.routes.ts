import { FastifyInstance } from 'fastify';

import chartController from '../controllers/chart.controller.js';

import rateLimitByIp from '../hooks/rateLimitByIp.js';

import { VerifyTokenRoute as GetChartByTokenRoute } from '../commons/types/routes.js';

const chartRoutes = (fastify: FastifyInstance) => {
  fastify.post(
    '/init',
    {
      // onRequest: rateLimitByIp(5, 60 * 1000),
      preHandler: [fastify.auth],
    },
    chartController.init,
  );

  fastify.post(
    '/verify-token',
    {
      // onRequest: rateLimitByIp(30, 60 * 1000),
      preHandler: [fastify.auth],
    },
    chartController.verifyToken,
  );

  fastify.post(
    '/generate',
    {
      // onRequest: rateLimitByIp(5, 60 * 1000),
      preHandler: [fastify.auth],
    },
    chartController.generate,
  );

  fastify.patch(
    '/rename',
    {
      // onRequest: rateLimitByIp(30, 60 * 1000),
      preHandler: [fastify.auth],
    },
    chartController.rename,
  );

  fastify.get<GetChartByTokenRoute>(
    '/:token',
    {
      // onRequest: rateLimitByIp(5, 60 * 1000),
      preHandler: [fastify.auth],
    },
    chartController.getByToken,
  );
};

export default chartRoutes;
