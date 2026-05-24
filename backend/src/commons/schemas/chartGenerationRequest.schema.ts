import { z } from "zod";

export const chartGenerationRequestSchema = z.object({
  prompt: z.string().max(5000),
  token: z.string(),
  memory: z.boolean(),
  thinkingMode: z.boolean(),
}).strict();