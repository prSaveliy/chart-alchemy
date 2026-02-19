import { FastifyInstance } from 'fastify';
import { SimpleIntervalJob, AsyncTask } from 'toad-scheduler';

const createExpiredRefreshTokensJob = (fastify: FastifyInstance) => {
  const task = new AsyncTask(
    'clearExpiredRefreshTokens',
    async () => {
      await fastify.prisma.token.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });
    }
  );
  
  return new SimpleIntervalJob({ hours: 1 }, task);
};

export default createExpiredRefreshTokensJob;