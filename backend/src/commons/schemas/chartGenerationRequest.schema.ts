import { z } from "zod";

import { chartConfigSchema } from "./chartConfig.schema.js";

export const chartGenerationRequestSchema = z.object({
  prompt: z.string().max(5000),
  token: z.string(),
  memory: chartConfigSchema.nullable(),
  thinkingMode: z.enum(['true', 'false']),
}).strict();