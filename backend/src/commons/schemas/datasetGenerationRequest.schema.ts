import { z } from 'zod';

export const datasetGenerationRequestSchema = z
  .object({
    chartType: z.enum(['bar', 'line', 'pie', 'scatter']).default('bar'),
    xField: z.string().min(1).max(255).optional(),
    yField: z.string().min(1).max(255).optional(),
  })
  .strict();

export type DatasetGenerationRequest = z.infer<
  typeof datasetGenerationRequestSchema
>;
