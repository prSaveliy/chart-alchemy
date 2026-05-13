import type { FastifyInstance } from 'fastify';

import type { GoogleResponse } from '../commons/types/googleResponse.js';
import type { UserRepository } from '../commons/interfaces/repositories/userRepository.interface.js';
import type { ChartRepository } from '../commons/interfaces/repositories/chartRepository.interface.js';

import type { TokenService } from './refreshToken.service.js';

export class OAuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly chartRepository: ChartRepository,
    private readonly tokenService: TokenService,
  ) {}

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
    } catch {
      throw fastify.httpErrors.badRequest();
    }
  }

  async authorize(fastify: FastifyInstance, data: GoogleResponse) {
    const ticket = await fastify.googleAuthClient.verifyIdToken({
      idToken: data.id_token,
      audience: fastify.config.OAUTH_GOOGLE_CLIENT_ID,
    });
    const idTokenData = ticket.getPayload();

    if (!idTokenData) {
      // technically should't happen if verifyIdToken succeeds
      throw new Error();
    }

    if (!idTokenData.email || !idTokenData.sub) {
      throw new Error();
    }

    const userByEmail = await this.userRepository.findByEmail(
      idTokenData.email,
    );
    const userBySub = await this.userRepository.findBySub(idTokenData.sub);

    const picture = idTokenData.picture;

    /*
      only check by email for the first time to prevent
      creating a new account if the user changed email
    */
    if (!userBySub) {
      if (!userByEmail) {
        await this.userRepository.createWithSub(
          idTokenData.email,
          idTokenData.sub,
          picture,
        );
      } else {
        await this.userRepository.linkSub(
          userByEmail.email,
          idTokenData.sub,
          picture,
        );
      }
    } else if (
      userByEmail &&
      (!userByEmail.sub || userByEmail.sub !== idTokenData.sub) // check for duplicate email
    ) {
      // delete the unactivated account and update the original user
      if (!userByEmail.isActivated) {
        await this.userRepository.deleteByEmail(userByEmail.email);
        await this.userRepository.updateSubProfile(
          idTokenData.sub,
          idTokenData.email,
          idTokenData.picture,
        );
      } else {
        // merge two accounts: keep userByEmail (activated, may have password),
        // absorb userBySub's charts, then delete userBySub
        await this.chartRepository.reassignUser(userBySub.id, userByEmail.id);
        await this.userRepository.deleteBySub(idTokenData.sub);
        await this.userRepository.linkSub(
          userByEmail.email,
          idTokenData.sub,
          idTokenData.picture,
        );
      }
    } else {
      // just update the existing user
      await this.userRepository.updateSubProfile(
        idTokenData.sub,
        idTokenData.email,
        idTokenData.picture,
      );
    }

    const user = await this.userRepository.findBySub(idTokenData.sub);

    if (!user) {
      throw new Error();
    }

    const userData = {
      id: user.id,
      email: user.email,
      isActivated: user.isActivated,
    };
    const tokens = this.tokenService.generateTokens(fastify, userData);
    await this.tokenService.saveToken(user.id, tokens.refreshToken);

    return { ...tokens, picture };
  }
}
