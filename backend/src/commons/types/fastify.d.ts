import 'fastify';

import { FastifyRequest, FastifyReply } from 'fastify';

import { PrismaClient } from '../../generated/prisma/client.ts';

declare module 'fastify' {
  interface FastifyInstance {
    config: {
      PORT: number;
      JWT_SECRET: string;
      DATABASE_URL: string;
      API_URL: string;
      CLIENT_API_URL: string;
    };
    prisma: PrismaClient;
    auth: (request: FastifyRequest, reply: FastifyReply) => void;
  }
}
