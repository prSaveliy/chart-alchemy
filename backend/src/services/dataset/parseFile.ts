import { FastifyInstance } from 'fastify';
import { Readable } from 'node:stream';

import { ParsedDataset } from '../../commons/types/dataset.js';

import { parseCsv } from './parsers/csv.js';
import { parseXlsx } from './parsers/xlsx.js';
import { inferFields } from './inferFields.js';

const MAX_ROWS = 5000;

const detectFormat = (
  filename: string,
  mimetype: string,
): 'csv' | 'xlsx' | null => {
  const lower = filename.toLowerCase();
  if (
    lower.endsWith('.xlsx') ||
    mimetype ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) {
    return 'xlsx';
  }

  if (
    lower.endsWith('.csv') ||
    mimetype === 'text/csv' ||
    mimetype === 'application/csv'
  ) {
    return 'csv';
  }

  return null;
};

const streamToBuffer = async (stream: Readable): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

export const parseFile = async (
  fastify: FastifyInstance,
  stream: Readable,
  filename: string,
  mimetype: string,
): Promise<ParsedDataset> => {
  const format = detectFormat(filename, mimetype);
  if (!format) {
    stream.resume();
    throw fastify.httpErrors.badRequest(
      'Unsupported file type. Use CSV or XLSX',
    );
  }

  let rows: Record<string, unknown>[];
  let truncated: boolean;
  if (format === 'csv') {
    try {
      const result = await parseCsv(stream, MAX_ROWS);
      rows = result.rows;
      truncated = result.truncated;
    } catch (err) {
      fastify.log.warn({ err }, 'CSV parse failed');
      throw fastify.httpErrors.badRequest('Invalid CSV file');
    }
  } else {
    const buffer = await streamToBuffer(stream);
    rows = await parseXlsx(fastify, buffer, MAX_ROWS + 1);
    truncated = rows.length > MAX_ROWS;
    if (truncated) rows = rows.slice(0, MAX_ROWS);
  }

  if (rows.length === 0) {
    throw fastify.httpErrors.badRequest('File contains no data rows');
  }

  const fields = inferFields(rows);

  return { fields, rows, truncated };
};
