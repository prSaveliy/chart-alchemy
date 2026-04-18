import { z } from "zod";

import { echartsOptionSchema } from "./chartConfig.schema.js";

export const saveConfigRequestSchema = z.object({
  token: z.string(),
  chartData: echartsOptionSchema,
}).strict();