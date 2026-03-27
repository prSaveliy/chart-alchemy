import { FastifyReply, FastifyRequest } from 'fastify';

import chartService from '../services/chart.service.js';

import validateSchema from '../utils/validateSchema.js';

import { chartInitRequestSchema } from '../commons/schemas/chartInitRequest.schema.js';
import { accountActivationSchema as chartTokenSchema } from '../commons/schemas/accountActivation.schema.js';

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
}

export default new ChartController();
