import { FastifyInstance } from 'fastify';
import { SimpleIntervalJob, AsyncTask } from 'toad-scheduler';
import { AccountActivationTokenRepository } from '../repositories/accountActivationToken.repository.js';

const createExpiredActivationTokensJob = (fastify: FastifyInstance) => {
  const accountActivationTokenRepository = new AccountActivationTokenRepository(
    fastify.prisma,
  );

  const task = new AsyncTask(
    'clearExpiredActivationTokens',
    async () => {
      await accountActivationTokenRepository.deleteExpired();
    }
  );
  
  return new SimpleIntervalJob({ hours: 1 }, task);
};

export default createExpiredActivationTokensJob;