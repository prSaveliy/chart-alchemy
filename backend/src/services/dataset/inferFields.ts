import type {
  DatasetField,
  DatasetFieldType,
} from '../../commons/interfaces/dataset/dataset.interface.js';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;

const detectValueType = (value: unknown): DatasetFieldType | null => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number' && !Number.isNaN(value)) return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (value instanceof Date) return 'date';
  if (typeof value === 'string' && ISO_DATE_RE.test(value) && Number.isFinite(Date.parse(value))) return 'date';
  return 'string';
};

export const inferFields = (
  rows: Record<string, unknown>[],
): DatasetField[] => {
  if (rows.length === 0) return [];

  const columnNames = Array.from(
    rows.reduce<Set<string>>((acc, row) => {
      Object.keys(row).forEach(key => acc.add(key));
      return acc;
    }, new Set<string>()),
  );

  return columnNames.map(name => {
    const seen = new Set<DatasetFieldType>();
    for (let i = 0; i < rows.length; i += 1) {
      const detected = detectValueType(rows[i][name]);
      if (detected) seen.add(detected);
    }

    let type: DatasetFieldType;
    if (seen.size === 0) type = 'string';
    else if (seen.size === 1) type = [...seen][0];
    else type = 'mixed';

    return { name, type };
  });
};
