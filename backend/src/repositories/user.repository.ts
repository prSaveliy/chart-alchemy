import type { PrismaClient } from '../generated/prisma/client.js';

import type { UserRepository as UserRepositoryContract } from '../commons/interfaces/repositories/userRepository.interface.js';

export class UserRepository implements UserRepositoryContract {
  constructor(private readonly prisma: PrismaClient) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  findById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  findBySub(sub: string) {
    return this.prisma.user.findUnique({
      where: { sub },
    });
  }

  createWithPassword(email: string, hashedPassword: string) {
    return this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        isActivated: false,
      },
    });
  }

  createWithSub(email: string, sub: string, picture?: string | null) {
    return this.prisma.user.create({
      data: {
        email,
        sub,
        isActivated: false,
        picture: picture ?? null,
      },
    });
  }

  setActivated(id: number) {
    return this.prisma.user.update({
      where: { id },
      data: { isActivated: true },
    });
  }

  setPasswordAndActivate(email: string, hashedPassword: string) {
    return this.prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        isActivated: true,
      },
    });
  }

  linkSub(email: string, sub: string, picture?: string | null) {
    return this.prisma.user.update({
      where: { email },
      data: {
        sub,
        picture: picture ?? null,
      },
    });
  }

  updateSubProfile(sub: string, email: string, picture?: string | null) {
    return this.prisma.user.update({
      where: { sub },
      data: {
        email,
        picture: picture ?? null,
      },
    });
  }

  deleteByEmail(email: string) {
    return this.prisma.user.delete({
      where: { email },
    });
  }

  deleteBySub(sub: string) {
    return this.prisma.user.delete({
      where: { sub },
    });
  }
}
