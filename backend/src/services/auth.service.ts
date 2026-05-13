import type { FastifyInstance } from 'fastify';

import bcrypt from 'bcrypt';
import crypto from 'node:crypto';

import type { PendingUser } from '../commons/types/pendingUser.js';
import type { UserRepository } from '../commons/interfaces/repositories/userRepository.interface.js';
import type { PendingUserRepository } from '../commons/interfaces/repositories/pendingUserRepository.interface.js';
import type { ResetPasswordTokenRepository } from '../commons/interfaces/repositories/resetPasswordTokenRepository.interface.js';

import type { MailService } from './mail.service.js';
import type { TokenService } from './refreshToken.service.js';
import type { ActivationTokenService } from './activationToken.service.js';

export class AuthService {
  constructor(
    private readonly app: FastifyInstance,
    private readonly userRepository: UserRepository,
    private readonly pendingUserRepository: PendingUserRepository,
    private readonly resetPasswordTokenRepository: ResetPasswordTokenRepository,
    private readonly activationTokenService: ActivationTokenService,
    private readonly tokenService: TokenService,
    private readonly mailService: MailService,
  ) {}

  async registration(email: string, password: string) {
    const existingUser = await this.userRepository.findByEmail(email);
    const pendingUser = await this.pendingUserRepository.findByEmail(email);

    if (existingUser) {
      if (existingUser.password) {
        const token = await this.activationTokenService.getTokenByUserId({
          type: 'main',
          id: existingUser.id,
        });

        if (!token && existingUser.isActivated) {
          throw this.app.httpErrors.conflict(
            'User with this email already exists',
          );
        }

        if (!existingUser.isActivated) {
          if (token && token.expiresAt > new Date()) {
            throw this.app.httpErrors.badRequest(
              'This email has already been registered and is awaiting activation. Please check your inbox for the confirmation email',
            );
          }

          await this.activationTokenService.deleteTokenByUserId({
            type: 'main',
            id: existingUser.id,
          });

          const activationToken = await this.activationTokenService.createToken(
            { type: 'main', id: existingUser.id },
            new Date(Date.now() + 60 * 60 * 1000),
          );

          await this.mailService.sendActivationLink(
            email,
            `${this.app.config.CLIENT_API_URL}/activate/${activationToken.token}`,
          );
        }

        return;
      }

      if (pendingUser) {
        const token = await this.activationTokenService.getTokenByUserId({
          type: 'pending',
          id: pendingUser.id,
        });

        if (!token || token.expiresAt < new Date()) {
          await this.activationTokenService.deleteTokenByUserId({
            type: 'pending',
            id: pendingUser.id,
          });

          const activationToken = await this.activationTokenService.createToken(
            { type: 'pending', id: pendingUser.id },
            new Date(Date.now() + 60 * 60 * 1000),
          );

          await this.mailService.sendActivationLink(
            email,
            `${this.app.config.CLIENT_API_URL}/activate/${activationToken.token}`,
          );
        } else {
          throw this.app.httpErrors.badRequest(
            'This email has already been registered and is awaiting activation. Please check your inbox for the confirmation email',
          );
        }

        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await this.pendingUserRepository.create(
        email,
        hashedPassword,
      );
      const activationToken = await this.activationTokenService.createToken(
        { type: 'pending', id: user.id },
        new Date(Date.now() + 60 * 60 * 1000),
      );

      await this.mailService.sendActivationLink(
        email,
        `${this.app.config.CLIENT_API_URL}/activate/${activationToken.token}`,
      );

      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.userRepository.createWithPassword(
      email,
      hashedPassword,
    );
    const activationToken = await this.activationTokenService.createToken(
      { type: 'main', id: user.id },
      new Date(Date.now() + 60 * 60 * 1000),
    );

    await this.mailService.sendActivationLink(
      email,
      `${this.app.config.CLIENT_API_URL}/activate/${activationToken.token}`,
    );
  }

  async login(email: string, password: string) {
    const user = await this.userRepository.findByEmail(email);

    if (!user || !user.isActivated || !user.password) {
      throw this.app.httpErrors.unauthorized('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw this.app.httpErrors.unauthorized('Invalid credentials');
    }

    const userData = {
      id: user.id,
      email: user.email,
      isActivated: user.isActivated,
    };
    const tokens = this.tokenService.generateTokens(userData);
    await this.tokenService.saveToken(user.id, tokens.refreshToken);

    return { ...tokens, picture: user.picture };
  }

  async activate(token: string) {
    const user = await this.activationTokenService.findMainUserByToken(token);
    const pendingUser =
      await this.activationTokenService.findPendingUserByToken(token);

    if (!user && !pendingUser) {
      throw this.app.httpErrors.badRequest('Incorrect activation link');
    }

    if (user && !pendingUser) {
      await this.userRepository.setActivated(user.id);
      await this.activationTokenService.deleteTokenByUserId({
        type: 'main',
        id: user.id,
      });
      return;
    }

    if (!user && pendingUser) {
      const originalUser = await this.userRepository.findByEmail(
        pendingUser.email,
      );

      if (originalUser) {
        await this.userRepository.setPasswordAndActivate(
          pendingUser.email,
          pendingUser.password,
        );
      }

      const activationToken = await this.activationTokenService.getToken(token);
      if (activationToken?.pendingUserId) {
        await this.pendingUserRepository.deleteById(
          activationToken.pendingUserId,
        );
      }
    }
  }

  async refresh(refreshToken: string) {
    const token = await this.tokenService.findToken(refreshToken);

    if (!token) {
      throw this.app.httpErrors.unauthorized('Invalid refresh token');
    }

    const user = await this.userRepository.findById(token.userId);

    if (!user) {
      throw this.app.httpErrors.unauthorized('Invalid refresh token');
    }

    const userData = {
      id: user.id,
      email: user.email,
      isActivated: user.isActivated,
    };

    const tokens = this.tokenService.generateTokens(userData);
    await this.tokenService.deleteToken(token.token);
    await this.tokenService.saveToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(refreshToken: string) {
    await this.tokenService.deleteToken(refreshToken);
  }

  async forgotPassword(email: string) {
    const user = await this.userRepository.findByEmail(email);
    const pendingUser = await this.pendingUserRepository.findByEmail(email);

    if (!user && !pendingUser) {
      return;
    }

    await this.resetPasswordTokenRepository.deleteByEmail(email);

    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    await this.resetPasswordTokenRepository.create(
      email,
      hashedToken,
      new Date(Date.now() + 60 * 60 * 1000),
    );

    await this.mailService.sendPasswordResetLink(
      email,
      `${this.app.config.CLIENT_API_URL}/password-reset/${token}`,
    );
  }

  async verifyResetToken(token: string) {
    const hashedIncomingToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const resetToken =
      await this.resetPasswordTokenRepository.findByToken(hashedIncomingToken);

    if (!resetToken || resetToken.expiresAt < new Date()) {
      throw this.app.httpErrors.badRequest('Invalid password reset token');
    }

    return resetToken;
  }

  async resetPassword(
    token: string,
    password: string,
  ) {
    const resetToken = await this.verifyResetToken(token);
    const hashedPassword = await bcrypt.hash(password, 10);

    let pendingUser: PendingUser | null = null;
    try {
      pendingUser = await this.pendingUserRepository.deleteByEmail(
        resetToken.email,
      );
    } catch {
      // Ignore missing pending users during password reset cleanup
    }

    const user = await this.userRepository.setPasswordAndActivate(
      resetToken.email,
      hashedPassword,
    );

    await this.activationTokenService.deleteTokenByUserId({
      type: 'main',
      id: user.id,
    });

    await this.resetPasswordTokenRepository.deleteByEmail(user.email);

    if (!pendingUser) {
      await this.tokenService.deleteTokensByUserId(user.id);
    }
  }
}
