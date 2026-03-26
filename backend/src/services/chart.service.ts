import { FastifyInstance } from 'fastify';

class ChartService {
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
