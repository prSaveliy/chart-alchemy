import { z } from "zod";

import { chartConfigSchema } from "./chartConfig.schema.js";

export const chartGenerationRequestSchema = z.object({
  prompt: z.string(),
  token: z.string(),
  memory: chartConfigSchema.nullable(),
  thinkingMode: z.enum(['true', 'false']),
}).strict();