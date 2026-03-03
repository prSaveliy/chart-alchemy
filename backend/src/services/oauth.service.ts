import { FastifyInstance } from 'fastify';

import { GoogleResponse } from '../commons/types/googleResponse.js';
import { IDToken } from '../commons/types/idToken.js';
import { UserDTO } from '../commons/types/user.js';

import tokenService from './token.service.js';

class OAuthService {
  generateURI(fastify: FastifyInstance) {
    const state = crypto.randomUUID();
    const uri = new URLSearchParams({
      client_id: fastify.config.OAUTH_GOOGLE_CLIENT_ID,
      redirect_uri: `${fastify.config.CLIENT_API_URL}/auth/google`,
      response_type: 'code',
      scope: ['email', 'openid', 'profile'].join(' '),
      prompt: 'consent',
      state: state,
    });

    return { state, uri };
  }

  async handleCode(fastify: FastifyInstance, code: string) {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: fastify.config.OAUTH_GOOGLE_CLIENT_ID,
          client_secret: fastify.config.OAUTH_GOOGLE_CLIENT_SECRET,
          redirect_uri: `${fastify.config.CLIENT_API_URL}/auth/google`,
          grant_type: 'authorization_code',
        }).toString(),
      });

      if (!response.ok) {
        throw new Error(`Something went wrong: ${response.status}`);
      }

      const data = (await response.json()) as GoogleResponse;
      const user = await this.authorize(fastify, data);

      return user;
    } catch (err) {
      console.log(err);
      throw fastify.httpErrors.badRequest();
    }
  }

  async authorize(fastify: FastifyInstance, data: GoogleResponse) {
    const idTokenData = fastify.jwt.decode(data.id_token) as IDToken;
    const userByEmail = await fastify.prisma.user.findUnique({
      where: {
        email: idTokenData.email,
      },
    });
    const userBySub = await fastify.prisma.user.findUnique({
      where: {
        sub: idTokenData.sub,
      },
    });

    /*
      only check by email for the first time to prevent
      creating a new account if the user changed email
    */
    if (!userBySub) {
      if (!userByEmail) {
        await fastify.prisma.user.create({
          data: {
            email: idTokenData.email,
            sub: idTokenData.sub,
            isActivated: false,
          },
        });
      } else {
        await fastify.prisma.user.update({
          where: {
            email: userByEmail.email,
          },
          data: {
            sub: idTokenData.sub,
          },
        });
      }
    }

    const user = await fastify.prisma.user.findUnique({
      where: {
        sub: idTokenData.sub,
      },
    });

    const userData: UserDTO = {
      id: user!.id,
      email: user!.email,
      isActivated: user!.isActivated,
    };
    const tokens = tokenService.generateTokens(fastify, userData);
    await tokenService.saveToken(fastify, user!.id, tokens.refreshToken);

    return { ...tokens, user: userData };
  }
}

export default new OAuthService();
