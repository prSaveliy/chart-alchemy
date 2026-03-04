import * as z from 'zod';

export const googleRedirectSchema = z.object({
  code: z.string(),
  state: z.string(),
}).strict();