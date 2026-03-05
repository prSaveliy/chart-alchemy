import { FastifyInstance } from 'fastify';

import bcrypt from 'bcrypt';
import crypto from 'node:crypto';

import mailService from './mail.service.js';
import tokenService from './token.service.js';
import activationTokenService from './activationToken.service.js';

import { UserDTO } from '../commons/types/user.d.js';

class AuthService {
  async registration(fastify: FastifyInstance, email: string, password: string) {
    const existingUser = await fastify.prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    const pendingUser = await fastify.prisma.pendingUser.findUnique({
      where: {
        email: email,
      },
    });

    if (existingUser) {
      if (existingUser.password) {
        const token = await activationTokenService.getTokenByUserId(
          fastify,
          { type: 'main', id: existingUser.id },
        );
        if (!token && existingUser.isActivated) {
          throw fastify.httpErrors.conflict('User with this email already exists');
        } else if ((token && !existingUser.isActivated) || (!token && !existingUser.isActivated)) {
          if (token) {
            if (token.expiresAt > new Date()) {
              throw fastify.httpErrors.badRequest('Activation token has not expired yet');
            }
          }
          await activationTokenService.deleteTokenByUserId(
            fastify,
            { type: 'main', id: existingUser.id },
          );
          const activationToken = await activationTokenService.createToken(
            fastify,
            { type: 'main', id: existingUser.id },
            new Date(Date.now() + 30 * 1000),
          );
          await mailService.sendActivationLink(
            email,
            `${fastify.config.API_URL}/auth/activate/${activationToken.token}`,
          );
        } 
      } else {
        if (pendingUser) { 
          const token = await activationTokenService.getTokenByUserId(
            fastify,
            { type: 'pending', id: pendingUser.id },
          );
          if (!token || token.expiresAt < new Date()) {
            await activationTokenService.deleteTokenByUserId(
              fastify,
              { type: 'pending', id: pendingUser.id },
            );
            const activationToken = await activationTokenService.createToken(
              fastify,
              { type: 'pending', id: pendingUser.id },
              new Date(Date.now() + 60 * 1000),
            );
            await mailService.sendActivationLink(
              email,
              `${fastify.config.API_URL}/auth/activate/${activationToken.token}`,
            );
          } else if (token.expiresAt > new Date()) {
            throw fastify.httpErrors.badRequest('Activation token has not expired yet');
          }
        } else {
          const hashedPassword = await bcrypt.hash(password, 10);
          const user = await fastify.prisma.pendingUser.create({
            data: {
              email: email,
              password: hashedPassword,
            },
          });
          const activationToken = await activationTokenService.createToken(
            fastify,
            { type: 'pending', id: user.id },
            new Date(Date.now() + 60 * 1000),
          );
          await mailService.sendActivationLink(
            email,
            `${fastify.config.API_URL}/auth/activate/${activationToken.token}`,
          );
          const userData = {
            id: user.id,
            email: email,
          };
          
          return userData;
        }
      }
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await fastify.prisma.user.create({
        data: {
          email: email,
          password: hashedPassword,
          isActivated: false,
        },
      });
      
      const activationToken = await activationTokenService.createToken(
        fastify,
        { type: 'main', id: user.id },
        new Date(Date.now() + 60 * 1000),
      );
  
      await mailService.sendActivationLink(
        email,
        `${fastify.config.API_URL}/auth/activate/${activationToken.token}`,
      );
  
      const userData: UserDTO = {
        id: user.id,
        email: email,
        isActivated: user.isActivated,
      };
      
      return userData;
    }
  }
  
  async login(fastify: FastifyInstance, email: string, password: string) {
    const user = await fastify.prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    
    if (!user || !user.isActivated || !user.password) {
      throw fastify.httpErrors.unauthorized('Invalid credentials');
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw fastify.httpErrors.unauthorized('Invalid credentials');
    }
    
    const userData: UserDTO = {
      id: user.id,
      email: user.email,
      isActivated: user.isActivated,
    }
    const tokens = tokenService.generateTokens(fastify, userData);
    await tokenService.saveToken(fastify, user.id, tokens.refreshToken);
    
    return { ...tokens, user: userData };
  }
  
  async activate(fastify: FastifyInstance, token: string) {;
    const user = await activationTokenService.findMainUserbyToken(fastify, token);
    const pendingUser = await activationTokenService.findPendingUserbyToken(fastify, token);

    if (!user && !pendingUser) {
      throw fastify.httpErrors.badRequest('Incorrect activation link');
    } else if (user && !pendingUser) {
      await fastify.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          isActivated: true,
        },
      });
      await activationTokenService.deleteTokenByUserId(fastify, { type: 'main', id: user.id });
    } else if (!user && pendingUser) {
      const originalUser = await fastify.prisma.user.findUnique({
        where: {
          email: pendingUser.email,
        },
      });
      if (originalUser) {
        await fastify.prisma.user.update({
          where: {
            email: pendingUser.email,
          },
          data: {
            password: pendingUser.password,
            isActivated: true,
          },
        });
      }
      
      const activationToken = await activationTokenService.getToken(fastify, token);
      if (activationToken?.pendingUserId) {
        await fastify.prisma.pendingUser.delete({
          where: {
            id: activationToken.pendingUserId,
          },
        });
      }
    }
  }
  
  async refresh(fastify: FastifyInstance, refreshToken: string) {
    const token = await fastify.prisma.token.findUnique({
      where: {
        refreshToken: refreshToken,
      },
    });
    
    if (!token) {
      throw fastify.httpErrors.unauthorized('Invalid refresh token');
    }
    
    const user = await fastify.prisma.user.findUnique({
      where: {
        id: token.userId,
      },
    });
    
    if (!user) {
      throw fastify.httpErrors.unauthorized('Invalid refresh token');
    }
    
    const userData: UserDTO = {
      id: user.id,
      email: user.email,
      isActivated: user.isActivated,
    };
    
    const tokens = tokenService.generateTokens(fastify, userData);
    await tokenService.deleteToken(fastify, token.refreshToken);
    await tokenService.saveToken(fastify, user.id, tokens.refreshToken);
    
    return { ...tokens, user: userData };
  }
  
  async logout(fastify: FastifyInstance, refreshToken: string) {
    await tokenService.deleteToken(fastify, refreshToken)
  }
  
  async forgotPassword(fastify: FastifyInstance, email: string) {
    const user = await fastify.prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    
    if (!user) {
      return;
    }
    
    await fastify.prisma.resetPasswordToken.deleteMany({
      where: {
        userId: user.id,
      },
    });
    
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    await fastify.prisma.resetPasswordToken.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    
    await mailService.sendPasswordResetLink(
      email,
      `${fastify.config.CLIENT_API_URL}/password-reset/${token}`
    );
  }
  
  async verifyResetToken(fastify: FastifyInstance, token: string) {
    const hashedIncomingToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    
    const resetToken = await fastify.prisma.resetPasswordToken.findUnique({
      where: {
        token: hashedIncomingToken,
      },
    });
    
    if (!resetToken || resetToken.expiresAt < new Date()) {
      throw fastify.httpErrors.badRequest('Invalid password reset token');
    }
    
    return resetToken;
  }
  
  async resetPassword(fastify: FastifyInstance, token: string, password: string) {
    const resetToken = await this.verifyResetToken(fastify, token);
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await fastify.prisma.user.update({
      where: {
        id: resetToken?.userId,
      },
      data: {
        password: hashedPassword,
        isActivated: true,
      },
    });
    await activationTokenService.deleteTokenByUserId(fastify, { type: 'main', id: user.id });
    
    await fastify.prisma.resetPasswordToken.deleteMany({
      where: {
        userId: user.id,
      },
    });
  }
}

export default new AuthService();
