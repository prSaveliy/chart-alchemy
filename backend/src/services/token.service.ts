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
    const tokenData = await fastify.prisma.token.findFirst({
      where: {
        userId: userId,
      },
    });
    
    if (tokenData) {
      await fastify.prisma.token.update({
        where: { id: tokenData.id },
        data: {
          refreshToken: refreshToken,
        },
      });
    } else {
      await fastify.prisma.token.create({
        data: {
          userId: userId,
          refreshToken: refreshToken,
        },
      });
    }
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
