import fastifyPlugin from 'fastify-plugin';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';

import { GoogleGenAI } from '@google/genai';

const geminiPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const useVertex = fastify.config.GOOGLE_GENAI_USE_VERTEXAI === 'true';

  const client = new GoogleGenAI({
    vertexai: useVertex,
    project: fastify.config.GOOGLE_CLOUD_PROJECT,
    location: fastify.config.GOOGLE_CLOUD_LOCATION,
  });

  fastify.decorate('gemini', client);
};

export default fastifyPlugin(geminiPlugin);
