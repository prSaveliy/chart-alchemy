import type { PrismaClient } from '../generated/prisma/client.js';

import type { ResetPasswordTokenRepository as ResetPasswordTokenRepositoryContract } from '../commons/interfaces/repositories/resetPasswordTokenRepository.interface.js';

export class ResetPasswordTokenRepository implements ResetPasswordTokenRepositoryContract {
  constructor(private readonly prisma: PrismaClient) {}

  findByToken(token: string) {
    return this.prisma.resetPasswordToken.findUnique({
      where: { token },
    });
  }

  create(email: string, token: string, expiresAt: Date) {
    return this.prisma.resetPasswordToken.create({
      data: {
        email,
        token,
        expiresAt,
      },
    });
  }

  async deleteByEmail(email: string) {
    const result = await this.prisma.resetPasswordToken.deleteMany({
      where: { email },
    });

    return result.count;
  }

  async deleteExpired() {
    const result = await this.prisma.resetPasswordToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }
}
