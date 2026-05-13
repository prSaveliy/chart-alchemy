import { FastifyRequest, FastifyReply } from 'fastify';

import validateRequest from '../utils/validateRequest.js';

import { googleRedirectSchema } from '../commons/schemas/googleRedirect.schema.js';

import { OAuthService } from '../services/oauth.service.js';
import { TokenService } from '../services/refreshToken.service.js';

export class OAuthController {
  constructor(
    private readonly oAuthService: OAuthService,
    private readonly tokenService: TokenService,
  ) {}

  async redirectToURL(request: FastifyRequest, reply: FastifyReply) {
    const { state, uri } = this.oAuthService.generateURI();
    const baseURL = 'https://accounts.google.com/o/oauth2/v2/auth';
    reply.setCookie('oauth_state', state, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 300,
      path: '/',
    });
    reply.redirect(`${baseURL}?${uri}`);
  }

  async handleCode(request: FastifyRequest, reply: FastifyReply) {
    const { code, state } = validateRequest(
      request,
      googleRedirectSchema,
      'Invalid request body',
    );
    const { oauth_state } = request.cookies;

    if (!oauth_state || oauth_state !== state) {
      throw request.server.httpErrors.forbidden();
    }

    reply.clearCookie('oauth_state');

    const { refreshToken, ...body } = await this.oAuthService.handleCode(code);
    this.tokenService.saveToCookie(reply, refreshToken);

    return body;
  }
}
