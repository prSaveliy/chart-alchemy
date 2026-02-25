import { FastifyRequest, FastifyReply } from 'fastify';

import { emailSchema } from '../commons/schemas/email.schema.js'; 
import validateSchema from '../utils/validateSchema.js';

const rateLimitByEmail = (max: number, timeWindow: number) => {
  const store = new Map();
  
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const { email } = validateSchema(request, emailSchema);
    const now = Date.now();
    
    let timeStamps: number[] = store.get(email) || [];
    timeStamps = timeStamps.filter(ts => ts >= now - timeWindow);
    
    if (timeStamps.length >= max) {
      store.set(email, timeStamps);
      throw request.server.httpErrors.tooManyRequests(`Try again in ${timeStamps[0] + timeWindow - now}`);
    }
    
    timeStamps.push(now);
    store.set(email, timeStamps);
  };
};

export default rateLimitByEmail;