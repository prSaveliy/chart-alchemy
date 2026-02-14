import "fastify";

declare module "fastify" {
  interface FastifyInstance {
    config: {
      PORT: number;
      JWT_SECRET: string;
    };
    auth: any;
  }
}
