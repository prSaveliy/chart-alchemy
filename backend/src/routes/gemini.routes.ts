import { FastifyInstance } from "fastify";

import geminiController from "../controllers/gemini.controller.js";

import rateLimitByIp from '../hooks/rateLimitByIp.js';

const geminiRoutes = (fastify: FastifyInstance) => {
  fastify.post("/generate", {
    // onRequest: [fastify.auth, rateLimitByIp(5, 60 * 1000)],
    onRequest: fastify.auth,
  }, geminiController.generate);
};

export default geminiRoutes;
