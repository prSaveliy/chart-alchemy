import { parse } from 'csv-parse';
import { Readable } from 'node:stream';

export interface CsvParseResult {
  rows: Record<string, unknown>[];
  truncated: boolean;
}

export const parseCsv = async (
  stream: Readable,
  maxRows: number,
): Promise<CsvParseResult> => {
  const parser = stream.pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
      cast: true,
      bom: true,
    }),
  );

  const rows: Record<string, unknown>[] = [];
  let truncated = false;

  for await (const row of parser) {
    if (rows.length < maxRows) {
      rows.push(row as Record<string, unknown>);
    } else {
      truncated = true;
    }
  }

  return { rows, truncated };
};
