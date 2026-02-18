import { ZodType } from 'zod';

import { FastifyRequest } from 'fastify';
import { AppError } from '../commons/types/error.js';

const validateSchema = <T extends Record<string, any>>(request: FastifyRequest, schema: ZodType<T>): T => {
  const parseResult = schema.safeParse(request.body);
  
  if (!parseResult.success) {
    const error = request.server.httpErrors.badRequest('Invalid request body') as AppError;
    error.details = parseResult.error;
    throw error;
  }
  
  return parseResult.data;
}

export default validateSchema;