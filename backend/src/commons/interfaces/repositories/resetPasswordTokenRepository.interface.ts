export interface ResetPasswordTokenRecord {
  id: number;
  email: string;
  token: string;
  expiresAt: Date;
}

export interface ResetPasswordTokenRepository {
  findByToken(token: string): Promise<ResetPasswordTokenRecord | null>;

  create(
    email: string,
    token: string,
    expiresAt: Date
  ): Promise<ResetPasswordTokenRecord>;

  deleteByEmail(email: string): Promise<number>;

  deleteExpired(): Promise<number>;
}
