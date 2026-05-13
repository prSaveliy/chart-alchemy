import { FastifyInstance } from 'fastify';

import rateLimitByIp from '../hooks/rateLimitByIp.js';
import type { OAuthController } from '../controllers/oauth.controller.js';

const oAuthRoutes = (oAuthController: OAuthController) => {
  return (fastify: FastifyInstance) => {
    fastify.get(
      '/redirect-to-url',
      oAuthController.redirectToURL.bind(oAuthController),
    );
    fastify.post('/handle-code', {
      onRequest: rateLimitByIp(10, 60 * 1000),
    }, oAuthController.handleCode.bind(oAuthController));
  };
};

export default oAuthRoutes;