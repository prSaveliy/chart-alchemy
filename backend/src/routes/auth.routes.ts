import { FastifyInstance } from 'fastify';

import rateLimitByEmail from '../hooks/rateLimitByEmail.js';
import rateLimitByIp from '../hooks/rateLimitByIp.js';
import type { AuthController } from '../controllers/auth.controller.js';

const authRoutes = (authController: AuthController) => {
  return async (fastify: FastifyInstance) => {
    fastify.post('/registration', {
      onRequest: rateLimitByIp(10, 60 * 60 * 1000),
    }, authController.registration.bind(authController));
    
    fastify.post('/login', {
      onRequest: rateLimitByIp(10, 60 * 1000),
      preHandler: rateLimitByEmail(5, 15 * 60 * 1000),
    }, authController.login.bind(authController));
    
    fastify.post('/logout', {
      onRequest: rateLimitByIp(100, 60 * 60 * 1000),
    }, authController.logout.bind(authController));
    
    fastify.post('/activate', {
      onRequest: rateLimitByIp(15, 60 * 60 * 1000),
    }, authController.activate.bind(authController));
    
    fastify.post('/refresh', {
      onRequest: rateLimitByIp(30, 60 * 60 * 1000),
    }, authController.refresh.bind(authController));
    
    fastify.post('/forgot-password', {
      onRequest: rateLimitByIp(10, 60 * 60 * 1000),
      preHandler: rateLimitByEmail(3, 60 * 60 * 1000),
    }, authController.forgotPassword.bind(authController));
    
    fastify.get('/verify-reset-token/:token', {
      onRequest: rateLimitByIp(20, 15 * 60 * 1000),
    }, authController.verifyResetToken.bind(authController));
    
    fastify.post('/reset-password', {
      onRequest: rateLimitByIp(5, 60 * 60 * 1000),
    }, authController.resetPassword.bind(authController));
  };
};

export default authRoutes;
