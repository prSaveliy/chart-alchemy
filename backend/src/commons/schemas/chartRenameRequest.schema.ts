import { z } from "zod";

export const chartRenameRequestSchema = z.object({
  name: z.string().max(255),
  token: z.string(),
}).strict();
