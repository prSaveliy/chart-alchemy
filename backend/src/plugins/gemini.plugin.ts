import fastifyPlugin from 'fastify-plugin';
import {
  FastifyInstance,
  FastifyPluginAsync,
} from 'fastify';
import { GoogleGenAI } from "@google/genai";

const geminiPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const ai = new GoogleGenAI({ apiKey: fastify.config.GEMINI_API_KEY });

  fastify.decorate('gemini', ai);
};

export default fastifyPlugin(geminiPlugin);