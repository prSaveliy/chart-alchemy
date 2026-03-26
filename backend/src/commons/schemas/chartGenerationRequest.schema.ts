import { z } from "zod";

export const chartGenerationRequestSchema = z.object({
  prompt: z.string(),
  name: z.string().max(255),
  token: z.string(),
}).strict();