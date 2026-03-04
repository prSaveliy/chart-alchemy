import { FastifyInstance } from 'fastify';

import oAuthController from '../controllers/oauth.controller.js';

import rateLimitByIp from '../hooks/rateLimitByIp.js';

const oAuthRoutes = (fastify: FastifyInstance) => {
  fastify.get('/redirect-to-url', oAuthController.redirectToURL);
  fastify.post('/handle-code', {
    onRequest: rateLimitByIp(10, 60 * 1000)
  }, oAuthController.handleCode);
};

export default oAuthRoutes;