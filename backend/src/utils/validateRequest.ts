import { ZodType } from 'zod';

import { FastifyRequest } from 'fastify';
import { AppError } from '../commons/types/error.js';

type RequestSource = 'body' | 'params' | 'query';

const validateRequest = <T extends Record<string, unknown>>(
  request: FastifyRequest,
  schema: ZodType<T>,
  errorMessage: string,
  source: RequestSource = 'body',
): T => {
  const parseResult = schema.safeParse(request[source]);

  if (!parseResult.success) {
    const error = request.server.httpErrors.badRequest(
      errorMessage,
    ) as AppError;
    error.details = parseResult.error;
    throw error;
  }

  return parseResult.data;
};

export default validateRequest;