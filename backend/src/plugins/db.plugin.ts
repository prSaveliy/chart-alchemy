import fastifyPlugin from 'fastify-plugin';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

import { FastifyInstance, FastifyPluginAsync } from 'fastify';

const dbPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const adapter = new PrismaPg({
    connectionString: fastify.config.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  });
  const prisma = new PrismaClient({ adapter });

  await prisma.$connect();

  fastify.decorate('prisma', prisma);

  fastify.addHook('onClose', async () => {
    await prisma.$disconnect();
  });
};

export default fastifyPlugin(dbPlugin);
