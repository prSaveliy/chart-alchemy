import { FastifyReply, FastifyRequest } from 'fastify';
import geminiService from '../services/gemini.service.js';

import validateSchema from '../utils/validateSchema.js';

import { promptSchema } from '../commons/schemas/prompt.schema.js';

class GeminiController {
  async generate(request: FastifyRequest, reply: FastifyReply) {
    const { prompt } = validateSchema(request, promptSchema, 'Invalid request body');
    return await geminiService.generate(request.server, prompt);
  }
}

export default new GeminiController();
