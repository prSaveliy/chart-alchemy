import { FastifyReply, FastifyRequest } from 'fastify';
import { PassThrough } from 'node:stream';

import chartService from '../services/chart.service.js';

import validateRequest from '../utils/validateRequest.js';

import { chartInitRequestSchema } from '../commons/schemas/chartInitRequest.schema.js';
import { accountActivationSchema as chartTokenSchema } from '../commons/schemas/accountActivation.schema.js';
import { chartGenerationRequestSchema } from '../commons/schemas/chartGenerationRequest.schema.js';
import { chartRenameRequestSchema } from '../commons/schemas/chartRenameRequest.schema.js';
import { saveConfigRequestSchema } from '../commons/schemas/saveConfigRequestSchema.js';
import { tokenSchema } from '../commons/schemas/token.schema.js';

class ChartController {
  async init(request: FastifyRequest, reply: FastifyReply) {
    const { chartType } = validateRequest(
      request,
      chartInitRequestSchema,
      'Invalid request body',
    );
    const userId = request.user.id;
    return await chartService.init(request.server, chartType, userId);
  }

  async verifyToken(request: FastifyRequest, reply: FastifyReply) {
    const { token } = validateRequest(
      request,
      chartTokenSchema,
      'Invalid request body',
    );
    const userId = request.user.id;
    return await chartService.verifyToken(request.server, token, userId);
  }

  async generate(request: FastifyRequest, reply: FastifyReply) {
    const { prompt, token, memory, thinkingMode } = validateRequest(
      request,
      chartGenerationRequestSchema,
      'Invalid request body',
    );
    const userId = request.user.id;
    const useThinkingMode = thinkingMode === 'true';

    const stream = new PassThrough();
    reply.type('application/json').send(stream);
    stream.write(' ');

    const keepAlive = setInterval(() => {
      stream.write('\n');
    }, 15000);

    let aborted = false;
    request.raw.on('close', () => {
      if (stream.writableEnded) return;
      aborted = true;
      clearInterval(keepAlive);
      stream.destroy();
    });

    chartService
      .generate(request.server, prompt, token, userId, memory, useThinkingMode)
      .then(result => {
        if (aborted) return;
        clearInterval(keepAlive);
        stream.write(JSON.stringify(result));
        stream.end();
      })
      .catch(error => {
        if (aborted) return;
        clearInterval(keepAlive);
        const statusCode = error.statusCode || 500;
        if (statusCode >= 500) {
          request.log.error({ err: error }, 'streaming generate failed');
        }
        stream.write(
          JSON.stringify({
            isStreamingError: true,
            errorMessage:
              statusCode < 500 || statusCode === 502
                ? error.message
                : 'Internal server error',
            statusCode,
          }),
        );
        stream.end();
      });

    return reply;
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.id;
    return await chartService.listByUser(request.server, userId);
  }

  async getByToken(request: FastifyRequest, reply: FastifyReply) {
    const { token } = validateRequest(
      request,
      tokenSchema,
      'Invalid request body',
      'params',
    );
    const userId = request.user.id;

    return await chartService.getByToken(request.server, token, userId);
  }

  async rename(request: FastifyRequest, reply: FastifyReply) {
    const { name, token } = validateRequest(
      request,
      chartRenameRequestSchema,
      'Invalid request body',
    );
    const userId = request.user.id;
    return await chartService.rename(request.server, name, token, userId);
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { token } = validateRequest(
      request,
      tokenSchema,
      'Invalid request body',
      'params',
    );
    const userId = request.user.id;
    await chartService.delete(request.server, token, userId);
    return reply.code(204).send();
  }

  async saveConfig(request: FastifyRequest, reply: FastifyReply) {
    const { token, chartData, manualType } = validateRequest(
      request,
      saveConfigRequestSchema,
      'Invalid request body',
    );
    const userId = request.user.id;
    return await chartService.saveConfig(
      request.server,
      token,
      chartData,
      userId,
      manualType,
    );
  }
}

export default new ChartController();
