export interface PendingUserRecord {
  id: number;
  email: string;
  password: string;
}

export interface PendingUserRepository {
  findByEmail(email: string): Promise<PendingUserRecord | null>;

  findById(id: number): Promise<PendingUserRecord | null>;

  create(email: string, hashedPassword: string): Promise<PendingUserRecord>;

  deleteById(id: number): Promise<PendingUserRecord>;

  deleteByEmail(email: string): Promise<PendingUserRecord>;
}
