import { z } from "zod";

import { echartsOptionSchema } from "./chartConfig.schema.js";

export const manualTypeSchema = z.enum([
  "bar",
  "line",
  "area",
  "pie",
  "scatter",
  "radar",
]);

export const saveConfigRequestSchema = z.object({
  token: z.string(),
  chartData: echartsOptionSchema,
  manualType: manualTypeSchema.optional(),
}).strict();