import { LineChart } from "lucide-react";

import type { ChartSummary } from "@/commons/interfaces/chartInterfaces";

export const ChartCard = ({
  chart,
  onClick,
}: {
  chart: ChartSummary;
  onClick: () => void;
}) => {
  const displayName = chart.name || "Untitled chart";
  const kind = chart.token.startsWith("ai-") ? "AI" : "Manual";
  const subtype = chart.manualType ? ` · ${chart.manualType}` : "";
  const updated = new Date(chart.updatedAt).toLocaleDateString();

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-start text-left rounded-2xl border border-gray-200 bg-white p-5 hover:border-gray-400 hover:shadow-sm transition-all cursor-pointer"
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 mb-4">
        <LineChart strokeWidth={1.5} className="w-5 h-5 text-gray-700" />
      </div>
      <h3 className="font-semibold text-gray-900 truncate w-full">
        {displayName}
      </h3>
      <p className="mt-1 text-xs text-gray-500">
        {kind}
        {subtype} · Updated {updated}
      </p>
    </button>
  );
};
