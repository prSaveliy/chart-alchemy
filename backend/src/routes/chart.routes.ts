import { FastifyInstance } from 'fastify';

import rateLimitByIp from '../hooks/rateLimitByIp.js';
import type { ChartController } from '../controllers/chart.controller.js';

const chartRoutes = (chartController: ChartController) => {
  return (fastify: FastifyInstance) => {
    fastify.post(
      '/init',
      {
        onRequest: [fastify.auth, rateLimitByIp(10, 60 * 1000)],
      },
      chartController.init.bind(chartController),
    );

    fastify.post(
      '/verify-token',
      {
        onRequest: [fastify.auth, rateLimitByIp(60, 60 * 1000)],
      },
      chartController.verifyToken.bind(chartController),
    );

    fastify.post(
      '/generate',
      {
        onRequest: [fastify.auth, rateLimitByIp(3, 60 * 1000)],
      },
      chartController.generate.bind(chartController),
    );

    fastify.post(
      '/generate-from-dataset/:token',
      {
        onRequest: [fastify.auth, rateLimitByIp(25, 60 * 1000)],
      },
      chartController.generateFromDataset.bind(chartController),
    );

    fastify.patch(
      '/rename',
      {
        onRequest: [fastify.auth, rateLimitByIp(30, 60 * 1000)],
      },
      chartController.rename.bind(chartController),
    );

    fastify.get(
      '/',
      {
        onRequest: [fastify.auth, rateLimitByIp(60, 60 * 1000)],
      },
      chartController.list.bind(chartController),
    );

    fastify.get(
      '/:token',
      {
        onRequest: [fastify.auth, rateLimitByIp(60, 60 * 1000)],
      },
      chartController.getByToken.bind(chartController),
    );

    fastify.patch(
      '/save-config',
      {
        onRequest: [fastify.auth, rateLimitByIp(30, 60 * 1000)],
      },
      chartController.saveConfig.bind(chartController),
    );

    fastify.delete(
      '/:token',
      {
        onRequest: [fastify.auth, rateLimitByIp(30, 60 * 1000)],
      },
      chartController.delete.bind(chartController),
    );
  };
};

export default chartRoutes;
