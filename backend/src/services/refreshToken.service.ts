import type { FastifyInstance, FastifyReply } from 'fastify';

import type { UserDTO } from '../commons/types/user.js';
import type { RefreshTokenRepository } from '../commons/interfaces/repositories/refreshTokenRepository.interface.js';

export class TokenService {
  constructor(
    private readonly app: FastifyInstance,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  generateTokens(payload: UserDTO) {
    const accessToken = this.app.jwt.sign(payload, { expiresIn: '30m' });
    const refreshToken = this.app.jwt.sign(
      { ...payload, jti: crypto.randomUUID() } as UserDTO,
      { expiresIn: '30d' },
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  async saveToken(userId: number, refreshToken: string) {
    await this.refreshTokenRepository.create(
      userId,
      refreshToken,
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    );
  }

  findToken(refreshToken: string) {
    return this.refreshTokenRepository.findByToken(refreshToken);
  }

  async deleteToken(refreshToken: string) {
    await this.refreshTokenRepository.deleteByToken(refreshToken);
  }

  async deleteTokensByUserId(userId: number) {
    await this.refreshTokenRepository.deleteByUserId(userId);
  }

  saveToCookie(reply: FastifyReply, refreshToken: string) {
    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });
  }
}
