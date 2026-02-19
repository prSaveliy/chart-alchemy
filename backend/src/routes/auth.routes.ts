import { FastifyInstance } from 'fastify';

import authController from '../controllers/auth.controller.js';

const authRoutes = async (fastify: FastifyInstance) => {
  fastify.post('/registration', authController.registration);
  fastify.post('/login', authController.login);
  fastify.post('/logout', authController.logout);
  fastify.get('/activate/:link', authController.activate);
  fastify.post('/refresh', authController.refresh);
  fastify.post('/forgot-password', authController.forgotPassword);
  fastify.get('/verify-reset-token/:token', authController.verifyResetToken);
  fastify.post('/reset-password', authController.resetPassword);
};

export default authRoutes;
