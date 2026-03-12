import * as z from 'zod';

export const accountActivationSchema = z.object({
  token: z.string(),
}).strict();