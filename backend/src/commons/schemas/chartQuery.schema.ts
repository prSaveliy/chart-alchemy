import { z } from 'zod';
import {
  DEFAULT_CHARTS_PER_PAGE,
  MAX_CHARTS_PER_PAGE,
  MAX_PAGE_NUMBER,
  MAX_SEARCH_QUERY_LENGTH,
} from '../constants/pagination.constants.js';

export const chartListQuerySchema = z.object({
  page: z.preprocess(
    val => (Array.isArray(val) ? val[0] : val),
    z.coerce.number().int().min(1).max(MAX_PAGE_NUMBER).default(1),
  ),
  limit: z.preprocess(
    val => (Array.isArray(val) ? val[0] : val),
    z.coerce
      .number()
      .int()
      .min(1)
      .max(MAX_CHARTS_PER_PAGE)
      .default(DEFAULT_CHARTS_PER_PAGE),
  ),
  q: z.preprocess(
    val => (Array.isArray(val) ? val[0] : val),
    z.string().trim().max(MAX_SEARCH_QUERY_LENGTH).optional(),
  ),
});

export type ChartListQuery = z.infer<typeof chartListQuerySchema>;
