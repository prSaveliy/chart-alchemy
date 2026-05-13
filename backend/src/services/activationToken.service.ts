import { v4 } from 'uuid';

import type {
  AccountActivationTokenRepository,
  ActivationTokenOwner,
} from '../commons/interfaces/repositories/accountActivationTokenRepository.interface.js';
import type { UserRepository } from '../commons/interfaces/repositories/userRepository.interface.js';
import type { PendingUserRepository } from '../commons/interfaces/repositories/pendingUserRepository.interface.js';

export class ActivationTokenService {
  constructor(
    private readonly accountActivationTokenRepository: AccountActivationTokenRepository,
    private readonly userRepository: UserRepository,
    private readonly pendingUserRepository: PendingUserRepository,
  ) {}

  createToken(user: ActivationTokenOwner, expiresAt: Date) {
    return this.accountActivationTokenRepository.create(user, v4(), expiresAt);
  }

  getToken(token: string) {
    return this.accountActivationTokenRepository.findValidByToken(token);
  }

  async findMainUserByToken(token: string) {
    const activationToken = await this.getToken(token);

    if (!activationToken?.userId) return null;

    return this.userRepository.findById(activationToken.userId);
  }

  async findPendingUserByToken(token: string) {
    const activationToken = await this.getToken(token);

    if (!activationToken?.pendingUserId) return null;

    return this.pendingUserRepository.findById(activationToken.pendingUserId);
  }

  getTokenByUserId(user: ActivationTokenOwner) {
    return user.type === 'main'
      ? this.accountActivationTokenRepository.findByMainUserId(user.id)
      : this.accountActivationTokenRepository.findByPendingUserId(user.id);
  }

  async deleteTokenByUserId(user: ActivationTokenOwner) {
    if (user.type === 'main') {
      await this.accountActivationTokenRepository.deleteByMainUserId(user.id);
      return;
    }

    await this.accountActivationTokenRepository.deleteByPendingUserId(user.id);
  }
}
