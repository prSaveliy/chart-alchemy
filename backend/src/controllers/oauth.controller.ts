import { FastifyRequest, FastifyReply } from 'fastify';

import oAuthService from '../services/oauth.service.js';
import tokenService from '../services/refreshToken.service.js';

import validateSchema from '../utils/validateSchema.js';

import { googleRedirectSchema } from '../commons/schemas/googleRedirect.schema.js';

class OAuthController {
  async redirectToURL(request: FastifyRequest, reply: FastifyReply) {
    const { state, uri } = oAuthService.generateURI(request.server);
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
    const { code, state } = validateSchema(request, googleRedirectSchema, 'Invalid request body');
    const { oauth_state } = request.cookies;
    
    if (!oauth_state || oauth_state !== state) {
      throw request.server.httpErrors.forbidden();
    }
    
    reply.clearCookie('oauth_state');
    
    const data = await oAuthService.handleCode(request.server, code);
    tokenService.saveToCookie(reply, data.refreshToken);
    
    return data;
  }
}

export default new OAuthController();
