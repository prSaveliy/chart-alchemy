import 'fastify';
import '@fastify/jwt';

import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Multipart } from '@fastify/multipart';
import type { FastifyRedis } from '@fastify/redis';
import type { GoogleGenAI } from '@google/genai';
import type { OAuth2Client } from 'google-auth-library';

import type { PrismaClient } from '../../../generated/prisma/client.ts';
import type { UserPayload } from '../auth/userPayload.interface.ts';

declare module 'fastify' {
  interface FastifyInstance {
    config: {
      PORT: number;
      JWT_SECRET: string;
      DATABASE_URL: string;
      REDIS_URL: string;
      API_URL: string;
      CLIENT_API_URL: string;
      OAUTH_GOOGLE_CLIENT_ID: string;
      OAUTH_GOOGLE_CLIENT_SECRET: string;
      GEMINI_API_KEY: string;
      GEMINI_MODELS: string;
      GEMINI_DAILY_TOKEN_LIMIT: number;
      GEMINI_MAX_OUTPUT_TOKENS: number;
      GOOGLE_CLOUD_PROJECT: string;
      GOOGLE_CLOUD_LOCATION: string;
      GOOGLE_GENAI_USE_VERTEXAI: string;
      CORS_ORIGIN: string;
    };
    prisma: PrismaClient;
    auth: (request: FastifyRequest, reply: FastifyReply) => void;
    gemini: GoogleGenAI;
    googleAuthClient: OAuth2Client;
    redis: FastifyRedis;
  }

  interface FastifyRequest {
    parts: () => AsyncIterableIterator<Multipart>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: UserPayload;
    user: UserPayload;
  }
}
