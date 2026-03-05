import { FastifyInstance } from 'fastify';
import { SimpleIntervalJob, AsyncTask } from 'toad-scheduler';

const createExpiredActivationTokensJob = (fastify: FastifyInstance) => {
  const task = new AsyncTask(
    'clearExpiredActivationTokens',
    async () => {
      await fastify.prisma.accountActivationToken.deleteMany({
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

export default createExpiredActivationTokensJob;