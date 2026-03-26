import { FastifyReply, FastifyRequest } from 'fastify';
import geminiService from '../services/gemini.service.js';

import validateSchema from '../utils/validateSchema.js';

import { chartGenerationRequestSchema } from '../commons/schemas/chartGenerationRequest.schema.js';

class GeminiController {
  async generate(request: FastifyRequest, reply: FastifyReply) {
    const { prompt, name, token } = validateSchema(
      request,
      chartGenerationRequestSchema,
      'Invalid request body',
    );
    const userId = request.user.id;
    return await geminiService.generate(request.server, prompt, name, token, userId);
  }
}

export default new GeminiController();
