import { Prisma, type PrismaClient } from '../generated/prisma/client.js';

export class ChartRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(token: string, userId: number) {
    return this.prisma.chart.create({
      data: {
        token,
        userId,
      },
    });
  }

  findByToken(token: string) {
    return this.prisma.chart.findUnique({
      where: { token },
    });
  }

  updateName(token: string, name: string) {
    return this.prisma.chart.update({
      where: { token },
      data: { name },
    });
  }

  updateConfig(token: string, config: unknown, manualType?: string) {
    return this.prisma.chart.update({
      where: { token },
      data: {
        config: config as Prisma.InputJsonValue,
        ...(manualType !== undefined ? { manualType } : {}),
      },
    });
  }

  async acquireGenerationLock(token: string) {
    const result = await this.prisma.chart.updateMany({
      where: {
        token,
        genState: 'idle',
      },
      data: {
        genState: 'in_progress',
      },
    });

    return result.count === 1;
  }

  async releaseGenerationLock(token: string) {
    await this.prisma.chart.update({
      where: { token },
      data: {
        genState: 'idle',
      },
    });
  }

  listByUser(userId: number) {
    return this.prisma.chart.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        token: true,
        name: true,
        manualType: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  deleteByToken(token: string) {
    return this.prisma.chart.delete({
      where: { token },
    });
  }

  async reassignUser(fromUserId: number, toUserId: number) {
    const result = await this.prisma.chart.updateMany({
      where: { userId: fromUserId },
      data: { userId: toUserId },
    });

    return result.count;
  }
}
