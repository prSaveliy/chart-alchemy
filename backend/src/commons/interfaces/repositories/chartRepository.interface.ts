export interface ChartRecord {
  id: number;
  name: string;
  token: string;
  createdAt: Date;
  updatedAt: Date;
  config: unknown;
  manualType: string | null;
  datasetMeta: unknown;
  userId: number;
}

export interface ChartListItem {
  token: string;
  name: string;
  manualType: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChartRepository {
  create(token: string, userId: number): Promise<ChartRecord>;

  findByToken(token: string): Promise<ChartRecord | null>;

  updateName(token: string, name: string): Promise<ChartRecord>;

  // Used by both AI-generated and manually edited chart saves.
  updateConfig(
    token: string,
    config: unknown,
    manualType?: string
  ): Promise<ChartRecord>;

  listByUser(userId: number): Promise<ChartListItem[]>;

  deleteByToken(token: string): Promise<ChartRecord>;

  // Reassigns charts during account-merge flows.
  reassignUser(fromUserId: number, toUserId: number): Promise<number>;
}
