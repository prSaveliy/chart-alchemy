import { FastifyInstance } from 'fastify';

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

  async save(
    fastify: FastifyInstance,
    chartData: any, // TODO: create chartData type
    name: string,
    token: string,
    userId: number,
  ) {
    const chart = await fastify.prisma.chart.findUnique({
      where: {
        token,
      },
    });

    if (!chart) {
      await fastify.prisma.chart.create({
        data: {
          name,
          token,
          config: chartData,
          userId: userId,
        },
      });
    } else if (chart.userId === userId) {
      await fastify.prisma.chart.update({
        where: {
          token,
        },
        data: {
          name,
          config: chartData,
        },
      });
    } else {
      throw fastify.httpErrors.forbidden();
    }
  }
}

export default new ChartService();
