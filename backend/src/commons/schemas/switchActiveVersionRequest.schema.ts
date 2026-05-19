import { z } from "zod";

export const switchActiveVersionRequestSchema = z.object({
  versionId: z.number().int().positive(),
  token: z.string(),
}).strict();
