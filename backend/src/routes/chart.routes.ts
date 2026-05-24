import { FastifyInstance } from 'fastify';

import rateLimit from '../hooks/rateLimit.js';
import type { ChartController } from '../controllers/chart.controller.js';

const chartRoutes = (chartController: ChartController) => {
  return (fastify: FastifyInstance) => {
    fastify.post(
      '/init',
      {
        onRequest: [fastify.auth, rateLimit('ip', 10, 60 * 1000)],
      },
      chartController.init.bind(chartController),
    );

    fastify.post(
      '/verify-token',
      {
        onRequest: [fastify.auth, rateLimit('ip', 60, 60 * 1000)],
      },
      chartController.verifyToken.bind(chartController),
    );

    fastify.post(
      '/generate',
      {
        onRequest: [fastify.auth, rateLimit('ip', 10, 60 * 1000)],
      },
      chartController.generate.bind(chartController),
    );

    fastify.post(
      '/upload-and-generate-from-dataset/:token',
      {
        onRequest: [fastify.auth, rateLimit('ip', 5, 60 * 1000)],
      },
      chartController.uploadAndGenerateFromDataset.bind(chartController),
    );

    fastify.post(
      '/regenerate-from-dataset/:token',
      {
        onRequest: [fastify.auth, rateLimit('ip', 25, 60 * 1000)],
      },
      chartController.regenerateFromDataset.bind(chartController),
    );

    fastify.patch(
      '/rename',
      {
        onRequest: [fastify.auth, rateLimit('ip', 30, 60 * 1000)],
      },
      chartController.rename.bind(chartController),
    );

    fastify.get(
      '/',
      {
        onRequest: [fastify.auth, rateLimit('ip', 60, 60 * 1000)],
      },
      chartController.list.bind(chartController),
    );

    fastify.get(
      '/:token',
      {
        onRequest: [fastify.auth, rateLimit('ip', 60, 60 * 1000)],
      },
      chartController.getByToken.bind(chartController),
    );

    fastify.patch(
      '/save-config',
      {
        onRequest: [fastify.auth, rateLimit('ip', 30, 60 * 1000)],
      },
      chartController.saveConfig.bind(chartController),
    );

    fastify.delete(
      '/:token',
      {
        onRequest: [fastify.auth, rateLimit('ip', 30, 60 * 1000)],
      },
      chartController.delete.bind(chartController),
    );

    fastify.patch(
      '/switch-active-version',
      {
        onRequest: [fastify.auth, rateLimit('ip', 30, 60 * 1000)],
      },
      chartController.switchActiveVersion.bind(chartController),
    );
  };
};

export default chartRoutes;
