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
};

export default chartRoutes;