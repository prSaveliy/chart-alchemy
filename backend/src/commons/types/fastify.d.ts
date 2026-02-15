import 'fastify';

import { PrismaClient } from '../../generated/prisma/client.ts';

declare module 'fastify' {
  interface FastifyInstance {
    config: {
      PORT: number;
      JWT_SECRET: string;
      DATABASE_URL: string;
    };
    prisma: PrismaClient;
    auth: any;
  }
}
