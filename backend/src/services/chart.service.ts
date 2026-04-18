import { FastifyInstance } from 'fastify';
import { Prisma } from '../generated/prisma/client.js';

import geminiService from './gemini.service.js';
import { ChartConfig } from '../commons/schemas/chartConfig.schema.js';
import { EChartsOption } from '../commons/schemas/chartConfig.schema.js';

import { v4 } from 'uuid';

class ChartService {
  async init(
    fastify: FastifyInstance,
    chartType: 'ai' | 'dataset' | 'manual',
    userId: number,
  ) {
    const randomString = v4();
    const token = `${chartType}-${randomString}`;

    await fastify.prisma.chart.create({
      data: {
        token,
        userId,
      },
    });

    return { token };
  }

  async verifyToken(fastify: FastifyInstance, token: string, userId: number) {
    const chart = await fastify.prisma.chart.findUnique({
      where: {
        token,
      },
    });

    if (!chart) {
      throw fastify.httpErrors.notFound('Chart not found');
    } else if (chart.userId !== userId) {
      throw fastify.httpErrors.forbidden(
        "You don't have permissions to access this chart",
      );
    }
  }

  async generate(
    fastify: FastifyInstance,
    prompt: string,
    token: string,
    userId: number,
    memory: ChartConfig | null,
    thinkingMode: boolean,
  ) {
    await this.verifyToken(fastify, token, userId);

    const chartData = await geminiService.generate(
      fastify,
      prompt,
      memory,
      thinkingMode,
    );

    await this.save(fastify, chartData, token);

    return { chartData };
  }

  async rename(
    fastify: FastifyInstance,
    name: string,
    token: string,
    userId: number,
  ) {
    await this.verifyToken(fastify, token, userId);

    await fastify.prisma.chart.update({
      where: { token },
      data: { name },
    });
  }

  async save(fastify: FastifyInstance, chartData: ChartConfig, token: string) {
    await fastify.prisma.chart.update({
      where: {
        token,
      },
      data: {
        config: chartData as Prisma.InputJsonValue,
      },
    });
  }

  async getByToken(fastify: FastifyInstance, token: string, userId: number) {
    await this.verifyToken(fastify, token, userId);

    const chart = await fastify.prisma.chart.findUnique({
      where: {
        token,
      },
    });

    return {
      chartData: chart?.config,
      chartName: chart?.name,
      manualType: chart?.manualType ?? null,
    };
  }

  async saveConfig(
    fastify: FastifyInstance,
    token: string,
    chartData: EChartsOption,
    userId: number,
    manualType?: string,
  ) {
    await this.verifyToken(fastify, token, userId);

    await fastify.prisma.chart.update({
      where: {
        token,
      },
      data: {
        config: chartData as Prisma.InputJsonValue,
        ...(manualType !== undefined ? { manualType } : {}),
      },
    });
  }
}

export default new ChartService();
