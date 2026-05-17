import type { PrismaClient } from '../generated/prisma/client.js';

export class PendingUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findByEmail(email: string) {
    return this.prisma.pendingUser.findUnique({
      where: { email },
    });
  }

  findById(id: number) {
    return this.prisma.pendingUser.findUnique({
      where: { id },
    });
  }

  create(email: string, hashedPassword: string) {
    return this.prisma.pendingUser.create({
      data: {
        email,
        password: hashedPassword,
      },
    });
  }

  deleteById(id: number) {
    return this.prisma.pendingUser.delete({
      where: { id },
    });
  }

  deleteByEmail(email: string) {
    return this.prisma.pendingUser.delete({
      where: { email },
    });
  }
}
