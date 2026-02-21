import authService from '../services/auth.service.js';
import tokenService from '../services/token.service.js';

import { FastifyRequest, FastifyReply } from 'fastify';

import validateSchema from '../utils/validateSchema.js';

import { registrationSchema } from '../commons/schemas/registration.schema.js';
import { resetPasswordSchema } from '../commons/schemas/resetPassword.schema.js';

import { ActivateLinkRoute, VerifyTokenRoute } from '../commons/types/routes.js';

class AuthController {
  async registration(request: FastifyRequest, reply: FastifyReply) {
    const { email, password } = validateSchema<{ email: string, password: string }>
      (request, registrationSchema);
    
    const user = await authService.registration(request.server, email, password);
    return user;
  } 
  
  async login(request: FastifyRequest, reply: FastifyReply) {
    const { email, password } = validateSchema<{ email: string, password: string }>
      (request, registrationSchema);
    
    const data = await authService.login(request.server, email, password);
    tokenService.saveToCookie(reply, data.refreshToken);

    return data;
  }
  
  async activate(request: FastifyRequest<ActivateLinkRoute>, reply: FastifyReply) {
    const { link } = request.params;
    await authService.activate(request.server, link);
    // redirect to the client
  }
  
  async refresh(request: FastifyRequest, reply: FastifyReply) {
    const { refreshToken } = request.cookies;
    
    if (!refreshToken) {
      throw request.server.httpErrors.unauthorized('Unable to find refresh token');
    }
    
    try {
      request.server.jwt.verify(refreshToken);
    } catch {
      throw request.server.httpErrors.unauthorized('Invalid refresh token');
    }
    
    const data = await authService.refresh(request.server, refreshToken);
    tokenService.saveToCookie(reply, data.refreshToken);

    return data;
  }
  
  async logout(request: FastifyRequest, reply: FastifyReply) {
    const { refreshToken } = request.cookies;
    if (!refreshToken) {
      return;
    }
    await authService.logout(request.server, refreshToken);
    reply.clearCookie('refreshToken');
  }
  
  async forgotPassword(request: FastifyRequest, reply: FastifyReply) {
    const emailSchema = registrationSchema.omit({
      password: true,
    });
    
    const { email } = validateSchema<{ email: string }>(request, emailSchema);
    await authService.forgotPassword(request.server, email);
  }
  
  async verifyResetToken(request: FastifyRequest<VerifyTokenRoute>, reply: FastifyReply) {
    const { token } = request.params;
    await authService.verifyResetToken(request.server, token);
  }
  
  async resetPassword(request: FastifyRequest, reply: FastifyReply) {
    const { token, password } = validateSchema<{ token: string, password: string }>
      (request, resetPasswordSchema);
    await authService.resetPassword(request.server, token, password);
    reply.code(201);
  }
}

export default new AuthController();
