export type ChartKind = "ai" | "manual" | "dataset";

const VALID_KINDS: ChartKind[] = ["ai", "manual", "dataset"];

export const parseChartKind = (token: string): ChartKind | null => {
  const prefix = token.split("-")[0];
  return (VALID_KINDS as string[]).includes(prefix)
    ? (prefix as ChartKind)
    : null;
};
