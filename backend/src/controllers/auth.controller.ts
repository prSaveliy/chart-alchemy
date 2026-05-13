import { FastifyRequest, FastifyReply } from 'fastify';

import validateRequest from '../utils/validateRequest.js';

import { registrationSchema } from '../commons/schemas/registration.schema.js';
import { resetPasswordSchema } from '../commons/schemas/resetPassword.schema.js';
import { accountActivationSchema } from '../commons/schemas/accountActivation.schema.js';
import { tokenSchema } from '../commons/schemas/token.schema.js';

import { AuthService } from '../services/auth.service.js';
import { TokenService } from '../services/refreshToken.service.js';

export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  async registration(request: FastifyRequest) {
    const { email, password } = validateRequest(
      request,
      registrationSchema,
      'Invalid credentials',
    );
    await this.authService.registration(request.server, email, password);
  }

  async login(request: FastifyRequest, reply: FastifyReply) {
    const { email, password } = validateRequest(
      request,
      registrationSchema,
      'Invalid credentials',
    );

    const { refreshToken, ...body } = await this.authService.login(
      request.server,
      email,
      password,
    );
    this.tokenService.saveToCookie(reply, refreshToken);

    return body;
  }

  async activate(request: FastifyRequest) {
    const { token } = validateRequest(
      request,
      accountActivationSchema,
      'Invalid request body',
    );
    await this.authService.activate(request.server, token);
  }

  async refresh(request: FastifyRequest, reply: FastifyReply) {
    const { refreshToken } = request.cookies;

    if (!refreshToken) {
      throw request.server.httpErrors.unauthorized(
        'Unable to find refresh token',
      );
    }

    try {
      request.server.jwt.verify(refreshToken);
    } catch {
      throw request.server.httpErrors.unauthorized('Invalid refresh token');
    }

    const tokens = await this.authService.refresh(request.server, refreshToken);
    this.tokenService.saveToCookie(reply, tokens.refreshToken);

    return { accessToken: tokens.accessToken };
  }

  async logout(request: FastifyRequest, reply: FastifyReply) {
    const { refreshToken } = request.cookies;
    if (!refreshToken) {
      return;
    }
    await this.authService.logout(request.server, refreshToken);
    reply.clearCookie('refreshToken');
  }

  async forgotPassword(request: FastifyRequest) {
    const emailSchema = registrationSchema.omit({
      password: true,
    });

    const { email } = validateRequest(request, emailSchema, 'Invalid email address');
    await this.authService.forgotPassword(request.server, email);
  }

  async verifyResetToken(request: FastifyRequest) {
    const { token } = validateRequest(
      request,
      tokenSchema,
      'Invalid request body',
      'params',
    );
    await this.authService.verifyResetToken(request.server, token);
  }

  async resetPassword(request: FastifyRequest, reply: FastifyReply) {
    const { token, password } = validateRequest(
      request,
      resetPasswordSchema,
      'Invalid request body',
    );
    await this.authService.resetPassword(request.server, token, password);
    reply.code(201);
  }
}
