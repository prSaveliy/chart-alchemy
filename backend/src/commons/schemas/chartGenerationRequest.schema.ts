import { z } from "zod";

import { chartConfigSchema } from "./chartConfig.schema.js";

export const chartGenerationRequestSchema = z.object({
  prompt: z.string(),
  name: z.string().max(255),
  token: z.string(),
  memory: chartConfigSchema.nullable(),
  thinkingMode: z.enum(['true', 'false']),
}).strict();