import { FastifyReply, FastifyRequest } from 'fastify';
import { PassThrough } from 'node:stream';

import validateRequest from '../utils/validateRequest.js';

import { chartInitRequestSchema } from '../commons/schemas/chartInitRequest.schema.js';
import { accountActivationSchema as chartTokenSchema } from '../commons/schemas/accountActivation.schema.js';
import { chartGenerationRequestSchema } from '../commons/schemas/chartGenerationRequest.schema.js';
import { datasetGenerationRequestSchema } from '../commons/schemas/datasetGenerationRequest.schema.js';
import { chartRenameRequestSchema } from '../commons/schemas/chartRenameRequest.schema.js';
import { saveConfigRequestSchema } from '../commons/schemas/saveConfigRequestSchema.js';
import { tokenSchema } from '../commons/schemas/token.schema.js';

import { ChartService } from '../services/chart.service.js';
import { DatasetService } from '../services/dataset/index.js';

export class ChartController {
  constructor(
    private readonly chartService: ChartService,
    private readonly datasetService: DatasetService,
  ) {}

  async init(request: FastifyRequest) {
    const { chartType } = validateRequest(
      request,
      chartInitRequestSchema,
      'Invalid request body',
    );
    const userId = request.user.id;
    return await this.chartService.init(chartType, userId);
  }

  async verifyToken(request: FastifyRequest) {
    const { token } = validateRequest(
      request,
      chartTokenSchema,
      'Invalid request body',
    );
    const userId = request.user.id;
    return await this.chartService.verifyToken(token, userId);
  }

  async generate(request: FastifyRequest, reply: FastifyReply) {
    const { prompt, token, memory, thinkingMode } = validateRequest(
      request,
      chartGenerationRequestSchema,
      'Invalid request body',
    );
    const userId = request.user.id;
    const useThinkingMode = thinkingMode === 'true';

    await this.chartService.verifyToken(token, userId);

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

    this.chartService
      .generate(prompt, token, memory, useThinkingMode)
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

  async list(request: FastifyRequest) {
    const userId = request.user.id;
    return await this.chartService.listByUser(userId);
  }

  async getByToken(request: FastifyRequest) {
    const { token } = validateRequest(
      request,
      tokenSchema,
      'Invalid request body',
      'params',
    );
    const userId = request.user.id;

    return await this.chartService.getByToken(token, userId);
  }

  async rename(request: FastifyRequest) {
    const { name, token } = validateRequest(
      request,
      chartRenameRequestSchema,
      'Invalid request body',
    );
    const userId = request.user.id;
    return await this.chartService.rename(name, token, userId);
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { token } = validateRequest(
      request,
      tokenSchema,
      'Invalid request body',
      'params',
    );
    const userId = request.user.id;
    await this.chartService.delete(token, userId);
    return reply.code(204).send();
  }

  async saveConfig(request: FastifyRequest) {
    const { token, chartData, manualType } = validateRequest(
      request,
      saveConfigRequestSchema,
      'Invalid request body',
    );
    const userId = request.user.id;
    return await this.chartService.saveConfig(token, chartData, userId, manualType);
  }

  async generateFromDataset(request: FastifyRequest) {
    const startedAt = performance.now();
    const { token } = validateRequest(
      request,
      tokenSchema,
      'Invalid token',
      'params',
    );
    const userId = request.user.id;
    await this.chartService.verifyToken(token, userId);

    const fields: Record<string, string> = {};
    let fileBuffer: Buffer | null = null;
    let filename = '';
    let mimetype = '';

    for await (const part of request.parts()) {
      if (part.type === 'file') {
        fileBuffer = await part.toBuffer();
        filename = part.filename;
        mimetype = part.mimetype;
      } else {
        if (part.fieldname in fields) {
          throw request.server.httpErrors.badRequest(
            `Duplicate field: ${part.fieldname}`,
          );
        }
        if (typeof part.value !== 'string') {
          throw request.server.httpErrors.badRequest(
            `Field ${part.fieldname} must be a string`,
          );
        }
        fields[part.fieldname] = part.value;
      }
    }

    if (!fileBuffer) {
      throw request.server.httpErrors.badRequest('File is required');
    }

    request.body = fields;
    const { chartType, xField, yField } = validateRequest(
      request,
      datasetGenerationRequestSchema,
      'Invalid request body',
    );

    const result = await this.datasetService.generate(
      fileBuffer,
      filename,
      mimetype,
      chartType,
      token,
      xField,
      yField,
    );
    request.log.info(
      {
        token,
        chartType,
        backendDurationMs: Math.round(performance.now() - startedAt),
      },
      'dataset request completed',
    );

    return result;
  }
}
