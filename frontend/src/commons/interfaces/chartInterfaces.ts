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
