import { FastifyRequest, FastifyReply } from 'fastify';

import crypto from 'node:crypto';

import NodeCache from 'node-cache';

import validateRequest from '../utils/validateRequest.js';

import { chartGenerationRequestSchema } from '../commons/schemas/chartGenerationRequest.schema.js';

const hash = (prompt: string) =>
  crypto.createHash('sha256').update(prompt).digest('hex');

const memoizePrompt = (ttlSeconds = 3600) => {
  const cache = new NodeCache({ stdTTL: ttlSeconds, checkperiod: 120 });

  return {
    preHandler: async (request: FastifyRequest, reply: FastifyReply) => {
      const { prompt } = validateRequest(
        request,
        chartGenerationRequestSchema,
        'Invalid request body',
      );
      const key = hash(prompt);

      const chartData = cache.get(key);
      if (chartData) reply.send(chartData);

      (request as any)._cacheKey = key;
    },

    onSend: async (request: FastifyRequest, reply: FastifyReply, payload: any) => {
      const key = (request as any)._cacheKey;

      if (key && reply.statusCode === 200) {
        cache.set(key, JSON.parse(payload));
      }

      return payload;
    },
  };
};

export default memoizePrompt;
