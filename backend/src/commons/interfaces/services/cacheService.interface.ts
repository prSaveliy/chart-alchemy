export interface CacheService {
  get(key: string): Promise<string | null>;
  set(key: string, value: string | number, ttlSeconds?: number): Promise<void>;
  del?(key: string): Promise<void>;
  incrby(key: string, value: number): Promise<number>;
  decrby(key: string, value: number): Promise<number>;
  expire(key: string, seconds: number, flag?: 'NX' | 'XX' | 'GT' | 'LT'): Promise<number>;
}

