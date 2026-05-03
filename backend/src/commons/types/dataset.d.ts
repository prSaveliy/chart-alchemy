import { ChartConfig } from '../schemas/chartConfig.schema.js';

export type DatasetChartType = 'bar' | 'line' | 'pie' | 'scatter';

export type DatasetFieldType =
  | 'number'
  | 'string'
  | 'boolean'
  | 'date'
  | 'mixed';

export interface DatasetField {
  name: string;
  type: DatasetFieldType;
}

export interface ParsedDataset {
  fields: DatasetField[];
  rows: Record<string, unknown>[];
  truncated: boolean;
}

export interface DatasetGenerationResult {
  chartData: ChartConfig;
  fields: DatasetField[];
  selectedType: DatasetChartType;
  selectedXField: string;
  selectedYField: string;
  truncated: boolean;
}
