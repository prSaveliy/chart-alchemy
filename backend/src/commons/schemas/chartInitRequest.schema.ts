import { z } from "zod";

export const chartInitRequestSchema = z.object({
  chartType: z.enum(["ai", "dataset", "manual"]),
}).strict();