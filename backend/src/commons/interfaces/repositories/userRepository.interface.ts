export interface UserRecord {
  id: number;
  email: string;
  password: string | null;
  picture: string | null;
  sub: string | null;
  isActivated: boolean;
}

export interface UserRepository {
  findByEmail(email: string): Promise<UserRecord | null>;

  findById(id: number): Promise<UserRecord | null>;

  findBySub(sub: string): Promise<UserRecord | null>;

  // Creates a local account with password credentials.
  createWithPassword(email: string, hashedPassword: string): Promise<UserRecord>;

  // Creates an OAuth-backed account linked by provider subject.
  createWithSub(
    email: string,
    sub: string,
    picture?: string | null
  ): Promise<UserRecord>;

  setActivated(id: number): Promise<UserRecord>;

  // Used by activation and reset-password flows.
  setPasswordAndActivate(
    email: string,
    hashedPassword: string
  ): Promise<UserRecord>;

  // Links Google OAuth identity to an existing email-based account.
  linkSub(
    email: string,
    sub: string,
    picture?: string | null
  ): Promise<UserRecord>;

  updateSubProfile(
    sub: string,
    email: string,
    picture?: string | null
  ): Promise<UserRecord>;

  deleteByEmail(email: string): Promise<UserRecord>;

  deleteBySub(sub: string): Promise<UserRecord>;
}