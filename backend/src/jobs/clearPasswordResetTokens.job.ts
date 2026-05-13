import { FastifyInstance } from 'fastify';
import { SimpleIntervalJob, AsyncTask } from 'toad-scheduler';
import { ResetPasswordTokenRepository } from '../repositories/resetPasswordToken.repository.js';

const createPasswordResetTokenJob = (fastify: FastifyInstance) => {
  const resetPasswordTokenRepository = new ResetPasswordTokenRepository(
    fastify.prisma,
  );

  const task = new AsyncTask(
    'clearPasswordResetTokens',
    async () => {
      await resetPasswordTokenRepository.deleteExpired();
    }
  );
  
  return new SimpleIntervalJob({ hours: 1 }, task);
};

export default createPasswordResetTokenJob;