import * as z from 'zod';

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
}).strict();