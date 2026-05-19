import { Prisma, type PrismaClient } from '../generated/prisma/client.js';
import type { DatasetField } from '../commons/interfaces/dataset/dataset.interface.js';

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
      include: {
        datasetSource: true,
        aiChartVersions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  updateName(token: string, name: string) {
    return this.prisma.chart.update({
      where: { token },
      data: { name },
    });
  }

  updateConfig(
    token: string,
    config: unknown,
    manualType?: string,
    activeAiVersionId?: number,
  ) {
    return this.prisma.chart.update({
      where: { token },
      data: {
        config: config as Prisma.InputJsonValue,
        ...(manualType !== undefined ? { manualType } : {}),
        ...(activeAiVersionId !== undefined ? { activeAiVersionId } : {}),
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

  async deleteByToken(token: string) {
    const chart = await this.prisma.chart.findUnique({
      where: { token },
      select: { datasetSourceId: true },
    });

    const deletedChart = await this.prisma.chart.delete({
      where: { token },
    });

    if (chart?.datasetSourceId) {
      const remainingChartsCount = await this.prisma.chart.count({
        where: { datasetSourceId: chart.datasetSourceId },
      });

      if (remainingChartsCount === 0) {
        await this.prisma.datasetSource.delete({
          where: { id: chart.datasetSourceId },
        });
      }
    }

    return deletedChart;
  }

  async reassignUser(fromUserId: number, toUserId: number) {
    const result = await this.prisma.chart.updateMany({
      where: { userId: fromUserId },
      data: { userId: toUserId },
    });

    return result.count;
  }

  async findOrCreateDatasetSource(
    fileName: string,
    mimeType: string,
    fileSize: number,
    fileHash: string,
    fields: DatasetField[],
    rows: Record<string, unknown>[],
    truncated: boolean,
    rowCount: number,
  ) {
    let source = await this.prisma.datasetSource.findFirst({
      where: { fileHash, fileName, mimeType, fileSize },
    });

    if (!source) {
      source = await this.prisma.datasetSource.create({
        data: {
          fileName,
          mimeType,
          fileSize,
          fileHash,
          fields: fields as unknown as Prisma.InputJsonValue,
          rows: rows as unknown as Prisma.InputJsonValue,
          truncated,
          rowCount,
        },
      });
    }

    return source;
  }

  async assignDatasetSource(
    token: string,
    datasetSourceId: number,
    selectedType: string,
    selectedXField: string,
    selectedYField: string,
  ) {
    const chart = await this.prisma.chart.findUnique({
      where: { token },
      select: { datasetSourceId: true },
    });

    const updatedChart = await this.prisma.chart.update({
      where: { token },
      data: {
        datasetSourceId,
        selectedType,
        selectedXField,
        selectedYField,
      },
    });

    if (chart?.datasetSourceId && chart.datasetSourceId !== datasetSourceId) {
      const remainingChartsCount = await this.prisma.chart.count({
        where: { datasetSourceId: chart.datasetSourceId },
      });

      if (remainingChartsCount === 0) {
        await this.prisma.datasetSource.delete({
          where: { id: chart.datasetSourceId },
        });
      }
    }

    return updatedChart;
  }

  async addAiVersion(token: string, config: unknown, prompt?: string) {
    const chart = await this.prisma.chart.findUnique({
      where: { token },
      select: { id: true },
    });

    if (!chart) return null;

    const version = await this.prisma.aiChartVersion.create({
      data: {
        chartId: chart.id,
        config: config as Prisma.InputJsonValue,
        prompt,
      },
    });

    await this.pruneOldAiVersions(chart.id);

    return version;
  }

  async pruneOldAiVersions(chartId: number) {
    const versions = await this.prisma.aiChartVersion.findMany({
      where: { chartId },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    if (versions.length > 10) {
      const versionsToDelete = versions.slice(10).map((v) => v.id);
      await this.prisma.aiChartVersion.deleteMany({
        where: { id: { in: versionsToDelete } },
      });
    }
  }

  async setActiveAiVersion(token: string, versionId: number) {
    const version = await this.prisma.aiChartVersion.findUnique({
      where: { id: versionId },
    });

    if (!version) return null;

    return this.prisma.chart.update({
      where: { token },
      data: {
        activeAiVersionId: version.id,
        config: version.config as Prisma.InputJsonValue,
      },
    });
  }
}
