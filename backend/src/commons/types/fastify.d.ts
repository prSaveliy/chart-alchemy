import 'fastify';
import '@fastify/jwt';

import { FastifyRequest, FastifyReply } from 'fastify';

import { PrismaClient } from '../../generated/prisma/client.ts';
import { GoogleGenAI } from '@google/genai';

import { UserDTO } from './user.js';

declare module 'fastify' {
  interface FastifyInstance {
    config: {
      PORT: number;
      JWT_SECRET: string;
      DATABASE_URL: string;
      API_URL: string;
      CLIENT_API_URL: string;
      OAUTH_GOOGLE_CLIENT_ID: string;
      OAUTH_GOOGLE_CLIENT_SECRET: string;
      GEMINI_API_KEY: string;
    };
    prisma: PrismaClient;
    auth: (request: FastifyRequest, reply: FastifyReply) => void;
    gemini: GoogleGenAI;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: UserDTO;
    user: UserDTO;
  }
}
