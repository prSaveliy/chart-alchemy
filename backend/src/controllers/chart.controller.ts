import { FastifyReply, FastifyRequest } from 'fastify';

import chartService from '../services/chart.service.js';

import validateSchema from '../utils/validateSchema.js';

import { chartInitRequestSchema } from '../commons/schemas/chartInitRequest.schema.js';
import { accountActivationSchema as chartTokenSchema } from '../commons/schemas/accountActivation.schema.js';
import { chartGenerationRequestSchema } from '../commons/schemas/chartGenerationRequest.schema.js';

import { VerifyTokenRoute as GetChartByTokenRoute } from '../commons/types/routes.js';

class ChartController {
  async init(request: FastifyRequest, reply: FastifyReply) {
    const { chartType } = validateSchema(
      request,
      chartInitRequestSchema,
      'Invalid request body',
    );
    const userId = request.user.id;
    return await chartService.init(request.server, chartType, userId);
  }

  async verifyToken(request: FastifyRequest, reply: FastifyReply) {
    const { token } = validateSchema(
      request,
      chartTokenSchema,
      'Invalid request body',
    );
    const userId = request.user.id;
    return await chartService.verifyToken(request.server, token, userId);
  }

  async generate(request: FastifyRequest, reply: FastifyReply) {
    const { prompt, name, token, memory, thinkingMode } = validateSchema(
      request,
      chartGenerationRequestSchema,
      'Invalid request body',
    );
    const userId = request.user.id;
    const useThinkingMode = thinkingMode === 'true';
    return await chartService.generate(
      request.server,
      prompt,
      name,
      token,
      userId,
      memory,
      useThinkingMode,
    );
  }

  async getByToken(request: FastifyRequest<GetChartByTokenRoute>, reply: FastifyReply) {
    const { token } = request.params;
    const userId = request.user.id;

    return await chartService.getByToken(request.server, token, userId);
  }
}

export default new ChartController();
