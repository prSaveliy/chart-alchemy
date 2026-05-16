import fastifyPlugin from 'fastify-plugin';

import { FastifyInstance, FastifyPluginAsync } from 'fastify';

import { OAuth2Client } from 'google-auth-library';

const googleAuthPlugin: FastifyPluginAsync = async (
  fastify: FastifyInstance,
) => {
  fastify.decorate('googleAuthClient', new OAuth2Client());
};

export default fastifyPlugin(googleAuthPlugin);
