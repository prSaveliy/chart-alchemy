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

  async save(
    fastify: FastifyInstance,
    chartData: any, // TODO: create chartData type
    name: string,
    token: string,
  ) {
    await fastify.prisma.chart.update({
      where: {
        token,
      },
      data: {
        name,
        config: chartData,
      },
    });
  }
}

export default new ChartService();
