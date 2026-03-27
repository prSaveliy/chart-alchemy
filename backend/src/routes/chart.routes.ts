import { FastifyInstance } from "fastify";

import chartController from "../controllers/chart.controller.js";

import rateLimitByIp from "../hooks/rateLimitByIp.js";

const chartRoutes = (fastify: FastifyInstance) => {
  fastify.post("/init", {
    // onRequest: rateLimitByIp(5, 60 * 1000),
    preHandler: [
      fastify.auth,
    ],
  }, chartController.init);
  fastify.post("/verify-token", {
    // onRequest: rateLimitByIp(30, 60 * 1000),
    preHandler: [
      fastify.auth,
    ],
  }, chartController.verifyToken);
};

export default chartRoutes;