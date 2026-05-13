import { FastifyInstance } from 'fastify';
import { SimpleIntervalJob, AsyncTask } from 'toad-scheduler';
import { RefreshTokenRepository } from '../repositories/refreshToken.repository.js';

const createExpiredRefreshTokensJob = (fastify: FastifyInstance) => {
  const refreshTokenRepository = new RefreshTokenRepository(fastify.prisma);

  const task = new AsyncTask(
    'clearExpiredRefreshTokens',
    async () => {
      await refreshTokenRepository.deleteExpired();
    }
  );
  
  return new SimpleIntervalJob({ hours: 1 }, task);
};

export default createExpiredRefreshTokensJob;