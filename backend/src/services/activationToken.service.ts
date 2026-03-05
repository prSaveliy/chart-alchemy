import { FastifyInstance } from 'fastify';

import { randomLetterGenerator, generateString } from '../utils/generateRandomString.js';

class ActivationTokenService {
  async createToken(
    fastify: FastifyInstance,
    user: { type: 'main' | 'pending'; id: number },
    expiresAt: Date,
  ) {
    const iter = randomLetterGenerator();
    const token = await generateString(iter, 3);
    return await fastify.prisma.accountActivationToken.create({
      data: {
        userId: user.type === 'main' ? user.id : null,
        pendingUserId: user.type === 'pending' ? user.id : null,
        token: token,
        expiresAt,
      },
    });
  }

  async getToken(fastify: FastifyInstance, token: string) {
    return await fastify.prisma.accountActivationToken.findUnique({
      where: {
        token,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  }

  async findMainUserbyToken(fastify: FastifyInstance, token: string) {
    const activationToken = await this.getToken(fastify, token);

    if (!activationToken?.userId) return null;

    return await fastify.prisma.user.findUnique({
      where: {
        id: activationToken.userId,
      },
    });
  }

  async findPendingUserbyToken(fastify: FastifyInstance, token: string) {
    const activationToken = await this.getToken(fastify, token);

    if (!activationToken?.pendingUserId) return null;

    return await fastify.prisma.pendingUser.findUnique({
      where: {
        id: activationToken.pendingUserId,
      },
    });
  }

  async getTokenByUserId(
    fastify: FastifyInstance,
    user: { type: 'main' | 'pending'; id: number },
  ) {
    if (user.type === 'main') {
      return await fastify.prisma.accountActivationToken.findUnique({
        where: {
          userId: user.id,
        },
      });
    } else {
      return await fastify.prisma.accountActivationToken.findUnique({
        where: {
          pendingUserId: user.id,
        },
      });
    }
  }
  
  async deleteTokenByUserId(
    fastify: FastifyInstance,
    user: { type: 'main' | 'pending'; id: number },
  ) {
    try {
      if (user.type === 'main') {
        await fastify.prisma.accountActivationToken.delete({
          where: {
            userId: user.id,
          },
        });
      } else {
        await fastify.prisma.accountActivationToken.delete({
          where: {
            pendingUserId: user.id,
          },
        });
      }
    } catch {}
  }
}

export default new ActivationTokenService();
