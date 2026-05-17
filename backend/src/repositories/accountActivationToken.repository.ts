import type { PrismaClient } from '../generated/prisma/client.js';

export interface ActivationTokenOwner {
  type: 'main' | 'pending';
  id: number;
}

export class AccountActivationTokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(owner: ActivationTokenOwner, token: string, expiresAt: Date) {
    return this.prisma.accountActivationToken.create({
      data: {
        userId: owner.type === 'main' ? owner.id : null,
        pendingUserId: owner.type === 'pending' ? owner.id : null,
        token,
        expiresAt,
      },
    });
  }

  findValidByToken(token: string) {
    return this.prisma.accountActivationToken.findFirst({
      where: {
        token,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  }

  findByMainUserId(userId: number) {
    return this.prisma.accountActivationToken.findUnique({
      where: { userId },
    });
  }

  findByPendingUserId(pendingUserId: number) {
    return this.prisma.accountActivationToken.findUnique({
      where: { pendingUserId },
    });
  }

  async deleteByMainUserId(userId: number) {
    await this.prisma.accountActivationToken.deleteMany({
      where: { userId },
    });
  }

  async deleteByPendingUserId(pendingUserId: number) {
    await this.prisma.accountActivationToken.deleteMany({
      where: { pendingUserId },
    });
  }

  async deleteExpired() {
    const result = await this.prisma.accountActivationToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }
}
