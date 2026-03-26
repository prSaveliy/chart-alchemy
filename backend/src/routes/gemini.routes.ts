import { FastifyInstance } from "fastify";

import geminiController from "../controllers/gemini.controller.js";

import rateLimitByIp from '../hooks/rateLimitByIp.js';

const geminiRoutes = (fastify: FastifyInstance) => {
  fastify.post("/generate", {
    // onRequest: rateLimitByIp(5, 60 * 1000),
    preHandler: [
      fastify.auth,
    ],
  }, geminiController.generate);
};

export default geminiRoutes;
