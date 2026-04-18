import type { EChartsOption } from "@/commons/schemas/chartConfig.schema";
import type { ManualChartType } from "@/services/chartService";
import type { ManualChartState } from "@/commons/interfaces/chartInterfaces";

export const DEFAULT_MANUAL_CHART_STATE: ManualChartState = {
  type: "bar",
  categories: "Jan,Feb,Mar,Apr,May,Jun",
  seriesName: "Series 1",
  seriesValues: "42,65,51,88,73,59",
  smooth: false,
  pieEntries: [
    { name: "Category A", value: "40" },
    { name: "Category B", value: "30" },
    { name: "Category C", value: "20" },
    { name: "Category D", value: "10" },
  ],
  scatterPoints: "10,20\n30,50\n60,40\n80,90\n20,70",
  radarIndicators: [
    { name: "Speed", max: "100" },
    { name: "Power", max: "100" },
    { name: "Defense", max: "100" },
    { name: "Tech", max: "100" },
    { name: "Vision", max: "100" },
  ],
  radarSeriesName: "Stats",
  radarValues: "80,60,70,90,50",
};

export const parseManualChartState = (
  option: EChartsOption | undefined,
  type: ManualChartType | undefined,
): ManualChartState => {
  if (!option || !type) return DEFAULT_MANUAL_CHART_STATE;

  const out: ManualChartState = { ...DEFAULT_MANUAL_CHART_STATE, type };
  const series = (option.series?.[0] ?? {}) as Record<string, unknown>;

  if (type === "bar" || type === "line" || type === "area") {
    const xAxis = Array.isArray(option.xAxis) ? option.xAxis[0] : option.xAxis;
    if (Array.isArray(xAxis?.data)) {
      out.categories = xAxis.data.map(String).join(",");
    }
    if (typeof series.name === "string") out.seriesName = series.name;
    if (Array.isArray(series.data)) {
      out.seriesValues = (series.data as unknown[]).map(String).join(",");
    }
    if (typeof series.smooth === "boolean") out.smooth = series.smooth;
    return out;
  }

  if (type === "pie") {
    if (Array.isArray(series.data)) {
      out.pieEntries = (series.data as Array<Record<string, unknown>>).map(
        (d) => ({
          name: String(d?.name ?? ""),
          value: String(d?.value ?? 0),
        }),
      );
    }
    return out;
  }

  if (type === "scatter") {
    if (Array.isArray(series.data)) {
      out.scatterPoints = (series.data as unknown[])
        .filter(
          (p): p is [number, number] => Array.isArray(p) && p.length === 2,
        )
        .map(([x, y]) => `${x},${y}`)
        .join("\n");
    }
    return out;
  }

  if (type === "radar") {
    const indicators = option.radar?.indicator;
    if (Array.isArray(indicators)) {
      out.radarIndicators = indicators.map((i) => ({
        name: String(i?.name ?? ""),
        max: String(i?.max ?? 100),
      }));
    }
    const radarItem = (
      series.data as Array<Record<string, unknown>> | undefined
    )?.[0];
    if (radarItem && typeof radarItem.name === "string") {
      out.radarSeriesName = radarItem.name;
    }
    if (radarItem && Array.isArray(radarItem.value)) {
      out.radarValues = (radarItem.value as unknown[]).map(String).join(",");
    }
    return out;
  }

  return out;
};
