import { CacheService } from '../commons/interfaces/services/cacheService.interface.js';

import { FastifyRedis } from '@fastify/redis';

export class RedisService implements CacheService {
  constructor(private readonly redis: FastifyRedis) {}

  async get(key: string): Promise<string | null> {
    return await this.redis.get(key);
  }

  async set(
    key: string,
    value: string | number,
    ttlSeconds?: number,
  ): Promise<void> {
    if (ttlSeconds !== undefined && ttlSeconds > 0) {
      await this.redis.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.redis.set(key, value);
    }
  }

  async incrby(key: string, value: number): Promise<number> {
    return await this.redis.incrby(key, value);
  }

  async decrby(key: string, value: number): Promise<number> {
    return await this.redis.decrby(key, value);
  }

  async expire(
    key: string,
    seconds: number,
    flag?: 'NX' | 'XX' | 'GT' | 'LT',
  ): Promise<number> {
    if (flag) {
      return await (this.redis as any).expire(key, seconds, flag);
    }
    return await this.redis.expire(key, seconds);
  }
}
