import type { PrismaClient } from '../generated/prisma/client.js';

import type { PendingUserRepository as PendingUserRepositoryContract } from '../commons/interfaces/repositories/pendingUserRepository.interface.js';

export class PendingUserRepository implements PendingUserRepositoryContract {
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
