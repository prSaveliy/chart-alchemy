import { FastifyRequest, FastifyReply } from 'fastify';

import { emailSchema } from '../commons/schemas/email.schema.js'; 
import validateRequest from '../utils/validateRequest.js';

const rateLimitByEmail = (max: number, timeWindow: number) => {
  if (process.env.NODE_ENV === 'test')
    return async (request: FastifyRequest, reply: FastifyReply) => {};

  const store = new Map();
  
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const { email } = validateRequest(request, emailSchema, 'Invalid request body');
    const now = Date.now();
    
    let timeStamps: number[] = store.get(email) || [];
    timeStamps = timeStamps.filter(ts => ts >= now - timeWindow);
    
    if (timeStamps.length >= max) {
      store.set(email, timeStamps);
      throw request.server.httpErrors.tooManyRequests(`Too many requests. Try again later`);
    }
    
    timeStamps.push(now);
    store.set(email, timeStamps);
  };
};

export default rateLimitByEmail;