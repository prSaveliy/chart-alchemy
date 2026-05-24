import { FastifyRequest, FastifyReply } from 'fastify';
import { emailSchema } from '../commons/schemas/email.schema.js';
import validateRequest from '../utils/validateRequest.js';

export type RateLimitIdentifierType = 'ip' | 'email' | 'userId';

/**
 * Factory function to retrieve the rate-limiting identifier from the request
 * based on the requested strategy.
 */
const getIdentifier = (
  request: FastifyRequest,
  type: RateLimitIdentifierType,
): string | number => {
  switch (type) {
    case 'ip':
      return request.ip;
    case 'email': {
      const { email } = validateRequest(
        request,
        emailSchema,
        'Invalid request body',
      );
      return email;
    }
    case 'userId': {
      const userId = request.user?.id;
      if (!userId) {
        throw request.server.httpErrors.unauthorized('Authentication required');
      }
      return userId;
    }
  }
};

/**
 * Unified Fastify rate-limiting hook generator.
 * Scopes key dynamically by route, identifier type, and identifier value.
 */
const rateLimit = (
  type: RateLimitIdentifierType,
  max: number,
  timeWindow: number,
) => {
  if (process.env.NODE_ENV === 'test')
    return async (request: FastifyRequest, reply: FastifyReply) => {};

  return async (request: FastifyRequest, reply: FastifyReply) => {
    const cache = request.server.redis;
    const identifier = getIdentifier(request, type);
    const route = request.routeOptions.url;
    
    const key = `ratelimit:${route}:${type}:${identifier}`;
    const now = Date.now();

    const timeStampsJson = await cache.get(key);
    let timeStamps: number[] = timeStampsJson ? JSON.parse(timeStampsJson) : [];
    timeStamps = timeStamps.filter(ts => ts >= now - timeWindow);

    if (timeStamps.length >= max) {
      throw request.server.httpErrors.tooManyRequests(
        `Too many requests. Try again later`,
      );
    }

    timeStamps.push(now);
    const ttlSeconds = Math.ceil(timeWindow / 1000);
    await cache.set(key, JSON.stringify(timeStamps), 'EX', ttlSeconds);
  };
};

export default rateLimit;
