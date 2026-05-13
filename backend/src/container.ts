import { FastifyInstance } from 'fastify';

import {
  UserRepository,
  PendingUserRepository,
  AccountActivationTokenRepository,
  RefreshTokenRepository,
  ResetPasswordTokenRepository,
  ChartRepository,
} from './repositories/index.js';
import { MailService } from './services/mail.service.js';
import { TokenService } from './services/refreshToken.service.js';
import { ActivationTokenService } from './services/activationToken.service.js';
import { GeminiService } from './services/gemini.service.js';
import { ChartService } from './services/chart.service.js';
import { DatasetService } from './services/dataset/index.js';
import { AuthService } from './services/auth.service.js';
import { OAuthService } from './services/oauth.service.js';
import { AuthController } from './controllers/auth.controller.js';
import { OAuthController } from './controllers/oauth.controller.js';
import { ChartController } from './controllers/chart.controller.js';

export const buildContainer = (app: FastifyInstance) => {
  const prisma = app.prisma;

  // repositories
  const userRepository = new UserRepository(prisma);
  const pendingUserRepository = new PendingUserRepository(prisma);
  const accountActivationTokenRepository = new AccountActivationTokenRepository(
    prisma,
  );
  const refreshTokenRepository = new RefreshTokenRepository(prisma);
  const resetPasswordTokenRepository = new ResetPasswordTokenRepository(prisma);
  const chartRepository = new ChartRepository(prisma);

  // services
  const mailService = new MailService();
  const tokenService = new TokenService(app, refreshTokenRepository);
  const activationTokenService = new ActivationTokenService(
    accountActivationTokenRepository,
    userRepository,
    pendingUserRepository,
  );
  const geminiService = new GeminiService(app);
  const chartService = new ChartService(app, chartRepository, geminiService);
  const datasetService = new DatasetService(app, chartService);
  const authService = new AuthService(
    app,
    userRepository,
    pendingUserRepository,
    resetPasswordTokenRepository,
    activationTokenService,
    tokenService,
    mailService,
  );
  const oAuthService = new OAuthService(
    app,
    userRepository,
    chartRepository,
    tokenService,
  );

  // controllers
  const authController = new AuthController(authService, tokenService);
  const oAuthController = new OAuthController(oAuthService, tokenService);
  const chartController = new ChartController(chartService, datasetService);

  return {
    userRepository,
    pendingUserRepository,
    accountActivationTokenRepository,
    refreshTokenRepository,
    resetPasswordTokenRepository,
    chartRepository,
    mailService,
    tokenService,
    activationTokenService,
    geminiService,
    chartService,
    datasetService,
    authService,
    oAuthService,
    authController,
    oAuthController,
    chartController,
  };
};
