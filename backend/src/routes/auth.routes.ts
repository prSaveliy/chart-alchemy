import { FastifyInstance } from 'fastify';

import authController from '../controllers/auth.controller.js';

import rateLimitByEmail from '../hooks/rateLimitByEmail.js';
import rateLimitByIp from '../hooks/rateLimitByIp.js';

import { ActivateLinkRoute, VerifyTokenRoute } from '../commons/types/routes.js';

const authRoutes = async (fastify: FastifyInstance) => {
  fastify.post('/registration', {
    onRequest: rateLimitByIp(10, 60 * 60 * 1000),
  }, authController.registration);
  
  fastify.post('/login', {
    onRequest: rateLimitByIp(10, 60 * 1000),
    preHandler: rateLimitByEmail(5, 15 * 60 * 1000),
  }, authController.login);
  
  fastify.post('/logout', {
    onRequest: rateLimitByIp(100, 60 * 60 * 1000),
  }, authController.logout);
  
  fastify.get<ActivateLinkRoute>('/activate/:link', {
    onRequest: rateLimitByIp(15, 60 * 60 * 1000),
  }, authController.activate);
  
  fastify.post('/refresh', {
    onRequest: rateLimitByIp(30, 60 * 60 * 1000),
  }, authController.refresh);
  
  fastify.post('/forgot-password', {
    onRequest: rateLimitByIp(10, 60 * 60 * 1000),
    preHandler: rateLimitByEmail(3, 60 * 60 * 1000),
  }, authController.forgotPassword);
  
  fastify.get<VerifyTokenRoute>('/verify-reset-token/:token', {
    onRequest: rateLimitByIp(20, 15 * 60 * 1000),
  }, authController.verifyResetToken);
  
  fastify.post('/reset-password', {
    onRequest: rateLimitByIp(5, 60 * 60 * 1000),
  }, authController.resetPassword);
};

export default authRoutes;
