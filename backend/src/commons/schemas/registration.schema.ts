import * as z from 'zod';

export const registrationSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
}).strict();