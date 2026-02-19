import { FastifyInstance, FastifyReply } from 'fastify';
import { UserDTO } from '../commons/types/user.js';

class TokenService {
  generateTokens(fastify: FastifyInstance, payload: UserDTO) {
    const accessToken = fastify.jwt.sign(payload, { expiresIn: '30m' });
    const refreshToken = fastify.jwt.sign(payload, { expiresIn: '30d' });

    return {
      accessToken,
      refreshToken,
    };
  }
  
  async saveToken(fastify: FastifyInstance, userId: number, refreshToken: string) {
    await fastify.prisma.token.create({
      data: {
        userId: userId,
        refreshToken: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }
  
  async deleteToken(fastify: FastifyInstance, refreshToken: string) {
    try {
      await fastify.prisma.token.delete({
        where: {
          refreshToken: refreshToken,
        },
      });
    } catch {}
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

export default new TokenService();
