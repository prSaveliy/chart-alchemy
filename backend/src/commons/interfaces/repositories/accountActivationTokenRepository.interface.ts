export interface AccountActivationTokenRecord {
  id: number;
  userId: number | null;
  pendingUserId: number | null;
  token: string;
  expiresAt: Date;
}

export interface ActivationTokenOwner {
  type: 'main' | 'pending';
  id: number;
}

export interface AccountActivationTokenRepository {
  // Creates an activation token for either a main user or a pending user.
  create(
    owner: ActivationTokenOwner,
    token: string,
    expiresAt: Date
  ): Promise<AccountActivationTokenRecord>;

  // Returns only tokens that are still valid at lookup time.
  findValidByToken(token: string): Promise<AccountActivationTokenRecord | null>;

  findByMainUserId(userId: number): Promise<AccountActivationTokenRecord | null>;

  findByPendingUserId(pendingUserId: number): Promise<AccountActivationTokenRecord | null>;

  deleteByMainUserId(userId: number): Promise<void>;

  deleteByPendingUserId(pendingUserId: number): Promise<void>;

  deleteExpired(): Promise<number>;
}
