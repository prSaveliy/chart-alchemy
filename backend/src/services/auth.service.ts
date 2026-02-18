import { FastifyInstance } from 'fastify';

import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import { v4 } from 'uuid';

import mailService from './mail.service.js';
import tokenService from './token.service.js';

import { UserDTO } from '../commons/types/user.d.js';

class AuthService {
  async registration(fastify: FastifyInstance, email: string, password: string) {
    const existingUser = await fastify.prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (existingUser) {
      throw fastify.httpErrors.conflict('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const activationLink = v4();
    const user = await fastify.prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
        isActivated: false,
        activationLink: activationLink,
      },
    });

    await mailService.sendActivationLink(
      email,
      `${fastify.config.API_URL}/auth/activate/${activationLink}`,
    );

    const userData: UserDTO = {
      id: user.id,
      email: email,
      isActivated: user.isActivated,
    };
    
    return userData;
  }
  
  async login(fastify: FastifyInstance, email: string, password: string) {
    const user = await fastify.prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    
    if (!user) {
      throw fastify.httpErrors.unauthorized('Invalid credentials');
    }
    
    if (!user.isActivated) {
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
  
  async activate(fastify: FastifyInstance, link: string) {
    const user = await fastify.prisma.user.findUnique({
      where: {
        activationLink: link,
      }
    });
    
    if (!user) {
      throw fastify.httpErrors.badRequest('Incorrect activation link');
    }
    
    await fastify.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        isActivated: true,
        activationLink: null,
      },
    });
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
    tokenService.saveToken(fastify, user.id, tokens.refreshToken);
    
    return { ...tokens, user: userData };
  }
  
  async logout(fastify: FastifyInstance, refreshToken: string) {
    try {
      await fastify.prisma.token.delete({
        where: {
          refreshToken: refreshToken,
        },
      });
    } catch (err) {}
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
        activationLink: null,
      },
    });
    
    await fastify.prisma.resetPasswordToken.deleteMany({
      where: {
        userId: user.id,
      },
    });
  }
}

export default new AuthService();
