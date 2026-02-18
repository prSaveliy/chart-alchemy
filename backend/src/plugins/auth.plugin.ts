import fastifyPlugin from 'fastify-plugin';
import {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyReply,
  FastifyRequest,
} from 'fastify';
import jwt from '@fastify/jwt';

const authPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.register(jwt, {
    secret: fastify.config.JWT_SECRET,
  } as any);

  fastify.decorate(
    'auth',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch {
        throw fastify.httpErrors.unauthorized('Invalid token');
      }
    },
  );
};

export default fastifyPlugin(authPlugin);
