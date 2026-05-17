import type { ManualChartType } from "@/services/chartService";
import type { ChartConfig } from "@/commons/schemas/chartConfig.schema";

export interface PieEntry {
  name: string;
  value: string;
}

export interface RadarIndicator {
  name: string;
  max: string;
}

export interface ManualChartState {
  type: ManualChartType;
  categories: string;
  seriesName: string;
  seriesValues: string;
  smooth: boolean;
  pieEntries: PieEntry[];
  scatterPoints: string;
  radarIndicators: RadarIndicator[];
  radarSeriesName: string;
  radarValues: string;
}

export interface ManualChartProps {
  initialName?: string;
  initialData?: ChartConfig | null;
  initialType?: ManualChartType;
}

export interface ChartSummary {
  token: string;
  name: string;
  manualType: string | null;
  createdAt: string;
  updatedAt: string;
}

export type DatasetChartType = "bar" | "line" | "pie" | "scatter";

export type DatasetFieldType =
  | "number"
  | "string"
  | "boolean"
  | "date"
  | "mixed";

export interface DatasetField {
  name: string;
  type: DatasetFieldType;
}

export interface DatasetGenerationResult {
  chartData: ChartConfig;
  fields: DatasetField[];
  selectedType: DatasetChartType;
  selectedXField: string;
  selectedYField: string;
  truncated: boolean;
  datasetInfo: DatasetInfo;
}

export interface DatasetInfo {
  fileName: string;
  mimeType: string;
  fileSize: number;
}

export interface DatasetChartProps {
  initialName?: string;
  initialData?: ChartConfig | null;
  initialFields?: DatasetField[];
  initialType?: DatasetChartType | null;
  initialXField?: string | null;
  initialYField?: string | null;
  initialTruncated?: boolean;
  initialDatasetInfo?: DatasetInfo | null;
}
