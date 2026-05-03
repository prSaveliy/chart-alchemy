import { FastifyInstance } from 'fastify';

import { ParsedDataset } from '../../commons/types/dataset.js';

import { parseCsv } from './parsers/csv.js';
import { parseXlsx } from './parsers/xlsx.js';
import { inferFields } from './inferFields.js';

const MAX_ROWS = 5000;

const XLSX_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

const detectFormat = (
  buffer: Buffer,
  filename: string,
  mimetype: string,
): 'csv' | 'xlsx' | null => {
  if (buffer.length >= 4 && buffer.subarray(0, 4).equals(XLSX_MAGIC)) return 'xlsx';

  const lower = filename.toLowerCase();
  if (
    lower.endsWith('.csv') ||
    mimetype === 'text/csv' ||
    mimetype === 'application/csv'
  ) {
    return 'csv';
  }

  return null;
};

export const parseFile = async (
  fastify: FastifyInstance,
  buffer: Buffer,
  filename: string,
  mimetype: string,
): Promise<ParsedDataset> => {
  const format = detectFormat(buffer, filename, mimetype);
  if (!format) {
    throw fastify.httpErrors.badRequest('Unsupported file type. Use CSV or XLSX');
  }

  let rows: Record<string, unknown>[];
  if (format === 'csv') {
    try {
      rows = parseCsv(buffer);
    } catch (err) {
      fastify.log.warn({ err }, 'CSV parse failed');
      throw fastify.httpErrors.badRequest('Invalid CSV file');
    }
  } else {
    rows = await parseXlsx(fastify, buffer, MAX_ROWS + 1);
  }

  if (rows.length === 0) {
    throw fastify.httpErrors.badRequest('File contains no data rows');
  }

  const truncated = rows.length > MAX_ROWS;
  if (truncated) rows = rows.slice(0, MAX_ROWS);

  const fields = inferFields(rows);

  return { fields, rows, truncated };
};
