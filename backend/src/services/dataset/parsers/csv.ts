import { parse } from 'csv-parse/sync';

export const parseCsv = (buffer: Buffer): Record<string, unknown>[] => {
  return parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    cast: true,
    bom: true,
    to: 5001,
  }) as Record<string, unknown>[];
};
