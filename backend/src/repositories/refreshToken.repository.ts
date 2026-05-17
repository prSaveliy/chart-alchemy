import type { PrismaClient } from '../generated/prisma/client.js';

export class RefreshTokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findByToken(token: string) {
    return this.prisma.refreshToken.findUnique({
      where: { token },
    });
  }

  create(userId: number, token: string, expiresAt: Date) {
    return this.prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }

  async deleteByToken(token: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { token },
    });
  }

  async deleteByUserId(userId: number) {
    const result = await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    return result.count;
  }

  async deleteExpired() {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }
}
