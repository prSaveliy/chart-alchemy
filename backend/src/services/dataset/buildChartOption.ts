import type { EChartsOption } from '../../commons/schemas/chartConfig.schema.js';
import type {
  DatasetChartType,
  DatasetField,
  ParsedDataset,
} from '../../commons/interfaces/dataset/dataset.interface.js';

export interface ResolvedFields {
  xField: string;
  yField: string;
}

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const num = Number(value);
    if (Number.isFinite(num)) return num;
  }
  return null;
};

const toCategory = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
};

const pickCategoryField = (fields: DatasetField[]): DatasetField | null =>
  fields.find(f => f.type !== 'number') ?? null;

const pickNumericFields = (fields: DatasetField[]): DatasetField[] =>
  fields.filter(f => f.type === 'number');

const resolveFields = (
  dataset: ParsedDataset,
  chartType: DatasetChartType,
  xField: string | undefined,
  yField: string | undefined,
): ResolvedFields => {
  const fieldNames = new Set(dataset.fields.map(f => f.name));
  const numeric = pickNumericFields(dataset.fields);
  const category = pickCategoryField(dataset.fields);

  let resolvedX = xField && fieldNames.has(xField) ? xField : undefined;
  let resolvedY = yField && fieldNames.has(yField) ? yField : undefined;

  if (!resolvedX) {
    if (chartType === 'scatter') resolvedX = numeric[0]?.name;
    else resolvedX = category?.name ?? dataset.fields[0]?.name;
  }
  if (!resolvedY) {
    if (chartType === 'scatter') resolvedY = numeric[1]?.name ?? numeric[0]?.name;
    else resolvedY = numeric[0]?.name ?? dataset.fields[1]?.name;
  }

  if (resolvedX !== undefined && resolvedX === resolvedY) {
    resolvedY =
      numeric.find(f => f.name !== resolvedX)?.name ??
      dataset.fields.find(f => f.name !== resolvedX)?.name;
  }

  return {
    xField: resolvedX ?? dataset.fields[0]?.name ?? '',
    yField: resolvedY ?? dataset.fields[0]?.name ?? '',
  };
};

const buildBarOrLine = (
  type: 'bar' | 'line',
  dataset: ParsedDataset,
  fields: ResolvedFields,
): EChartsOption => {
  const categories = dataset.rows.map(r => toCategory(r[fields.xField]));
  const values = dataset.rows.map(r => toNumber(r[fields.yField]) ?? 0);

  return {
    tooltip: { trigger: 'axis' },
    legend: { show: false },
    xAxis: {
      type: 'category',
      data: categories,
      name: fields.xField,
      axisLabel: categories.length > 50
        ? { show: false }
        : { interval: 0, rotate: 30, overflow: 'truncate', width: 80 },
    },
    yAxis: { type: 'value', name: fields.yField },
    series: [{ type, name: fields.yField, data: values }],
  };
};

const buildScatter = (
  dataset: ParsedDataset,
  fields: ResolvedFields,
): EChartsOption => {
  const points = dataset.rows
    .map(r => [toNumber(r[fields.xField]), toNumber(r[fields.yField])])
    .filter((p): p is [number, number] => p[0] !== null && p[1] !== null);

  return {
    tooltip: { trigger: 'item' },
    xAxis: { type: 'value', name: fields.xField },
    yAxis: { type: 'value', name: fields.yField },
    series: [{ type: 'scatter', data: points, symbolSize: 10 }],
  };
};

const buildPie = (
  dataset: ParsedDataset,
  fields: ResolvedFields,
): EChartsOption => {
  const data = dataset.rows
    .map(r => ({
      name: toCategory(r[fields.xField]),
      value: toNumber(r[fields.yField]) ?? 0,
    }))
    .filter(d => d.name.trim() !== '');

  return {
    tooltip: { trigger: 'item' },
    series: [{ type: 'pie', name: fields.yField, radius: '60%', data }],
  };
};

export const buildChartOption = (
  dataset: ParsedDataset,
  chartType: DatasetChartType,
  xField: string | undefined,
  yField: string | undefined,
): { option: EChartsOption; resolved: ResolvedFields } => {
  const resolved = resolveFields(dataset, chartType, xField, yField);

  let option: EChartsOption;
  if (chartType === 'bar' || chartType === 'line') {
    option = buildBarOrLine(chartType, dataset, resolved);
  } else if (chartType === 'scatter') {
    option = buildScatter(dataset, resolved);
  } else {
    option = buildPie(dataset, resolved);
  }

  return { option, resolved };
};
