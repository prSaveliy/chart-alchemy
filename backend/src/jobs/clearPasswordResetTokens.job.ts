import { FastifyInstance } from 'fastify';
import { SimpleIntervalJob, AsyncTask } from 'toad-scheduler';

const createPasswordResetTokenJob = (fastify: FastifyInstance) => {
  const task = new AsyncTask(
    'clearPasswordResetTokens',
    async () => {
      await fastify.prisma.resetPasswordToken.deleteMany({
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

export default createPasswordResetTokenJob;