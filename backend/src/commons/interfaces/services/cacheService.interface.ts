export interface CacheService {
  get(key: string): Promise<string | null>;
  set(key: string, value: string | number, ttlSeconds?: number): Promise<void>;
  del?(key: string): Promise<void>;
}
