import { FastifyRequest, FastifyReply } from 'fastify';

import { emailSchema } from '../commons/schemas/email.schema.js';
import validateRequest from '../utils/validateRequest.js';

const rateLimitByEmail = (max: number, timeWindow: number) => {
  if (process.env.NODE_ENV === 'test')
    return async (request: FastifyRequest, reply: FastifyReply) => {};

  return async (request: FastifyRequest, reply: FastifyReply) => {
    const cache = request.server.redis;

    const { email } = validateRequest(
      request,
      emailSchema,
      'Invalid request body',
    );
    const route = request.routeOptions.url;
    const key = `ratelimit:${route}:${email}`;
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

export default rateLimitByEmail;
