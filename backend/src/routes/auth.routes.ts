import { FastifyInstance } from 'fastify';

import rateLimit from '../hooks/rateLimit.js';
import type { AuthController } from '../controllers/auth.controller.js';

const authRoutes = (authController: AuthController) => {
  return async (fastify: FastifyInstance) => {
    fastify.post('/registration', {
      onRequest: rateLimit('ip', 10, 60 * 60 * 1000),
    }, authController.registration.bind(authController));
    
    fastify.post('/login', {
      onRequest: rateLimit('ip', 10, 60 * 1000),
      preHandler: rateLimit('email', 5, 15 * 60 * 1000),
    }, authController.login.bind(authController));
    
    fastify.post('/logout', {
      onRequest: rateLimit('ip', 100, 60 * 60 * 1000),
    }, authController.logout.bind(authController));
    
    fastify.post('/activate', {
      onRequest: rateLimit('ip', 15, 60 * 60 * 1000),
    }, authController.activate.bind(authController));
    
    fastify.post('/refresh', {
      onRequest: rateLimit('ip', 30, 60 * 60 * 1000),
    }, authController.refresh.bind(authController));
    
    fastify.post('/forgot-password', {
      onRequest: rateLimit('ip', 10, 60 * 60 * 1000),
      preHandler: rateLimit('email', 3, 60 * 60 * 1000),
    }, authController.forgotPassword.bind(authController));
    
    fastify.get('/verify-reset-token/:token', {
      onRequest: rateLimit('ip', 20, 15 * 60 * 1000),
    }, authController.verifyResetToken.bind(authController));
    
    fastify.post('/reset-password', {
      onRequest: rateLimit('ip', 5, 60 * 60 * 1000),
    }, authController.resetPassword.bind(authController));
  };
};

export default authRoutes;
