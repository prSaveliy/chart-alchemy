export interface RefreshTokenRecord {
  id: number;
  userId: number;
  token: string;
  expiresAt: Date;
}

export interface RefreshTokenRepository {
  findByToken(token: string): Promise<RefreshTokenRecord | null>;

  create(userId: number, token: string, expiresAt: Date): Promise<RefreshTokenRecord>;

  deleteByToken(token: string): Promise<void>;

  deleteByUserId(userId: number): Promise<number>;

  deleteExpired(): Promise<number>;
}
