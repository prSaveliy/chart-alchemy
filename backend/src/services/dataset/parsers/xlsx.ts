import ExcelJS from 'exceljs';
import { FastifyInstance } from 'fastify';

const normalizeCell = (value: unknown): unknown => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string') return value;
  if (value instanceof Date) return value;
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if ('richText' in obj && Array.isArray(obj.richText)) {
      return (obj.richText as Array<{ text?: string }>).map(rt => rt.text ?? '').join('');
    }
    if ('result' in obj) return normalizeCell(obj.result);
    if ('error' in obj) return null;
    if ('hyperlink' in obj) return (obj.text as string | undefined) ?? (obj.hyperlink as string);
  }
  return null;
};

export const parseXlsx = async (
  fastify: FastifyInstance,
  buffer: Buffer,
  maxRows: number,
): Promise<Record<string, unknown>[]> => {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer as any);
  } catch (err) {
    fastify.log.warn({ err }, 'XLSX parse failed');
    throw fastify.httpErrors.badRequest('Invalid XLSX file');
  }

  if (workbook.worksheets.length === 0) {
    throw fastify.httpErrors.badRequest('XLSX file has no sheets');
  }

  const sheet = workbook.worksheets[0];
  const headers: Array<string | undefined> = [];
  const rows: Record<string, unknown>[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const raw = String(cell.value ?? '').trim();
        headers[colNumber] = raw || `Column${colNumber}`;
      });
      return;
    }
    if (rows.length >= maxRows) return;
    const obj: Record<string, unknown> = {};
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const header = headers[colNumber];
      if (header !== undefined) obj[header] = normalizeCell(cell.value);
    });
    rows.push(obj);
  });

  return rows;
};
