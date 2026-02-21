import { FastifyRequest, FastifyReply } from 'fastify';

const rateLimitByIp = (max: number, timeWindow: number) => {
  const store = new Map();
  
  return async (request: FastifyRequest, reply: FastifyReply) => { 
    const ip = request.ip;
    const now = Date.now();
    
    let timeStamps: number[] = store.get(ip) || [];
    timeStamps = timeStamps.filter(ts => ts >= now - timeWindow);
    
    if (timeStamps.length >= max) {
      store.set(ip, timeStamps);
      throw request.server.httpErrors.tooManyRequests(`Try again in ${timeStamps[0] + timeWindow - now}`);
    }
    
    timeStamps.push(now);
    store.set(ip, timeStamps);
  };
};

export default rateLimitByIp;