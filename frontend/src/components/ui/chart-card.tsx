import { LineChart, Trash2 } from "lucide-react";
import type { KeyboardEvent, MouseEvent } from "react";

import type { ChartSummary } from "@/commons/interfaces/chartInterfaces";

export const ChartCard = ({
  chart,
  onClick,
  onDelete,
  deleting = false,
}: {
  chart: ChartSummary;
  onClick: () => void;
  onDelete: () => void;
  deleting?: boolean;
}) => {
  const displayName = chart.name || "Untitled chart";
  const kind = chart.token.startsWith("ai-") ? "AI" : "Manual";
  const subtype = chart.manualType ? ` · ${chart.manualType}` : "";
  const updated = new Date(chart.updatedAt).toLocaleDateString();

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  };

  const handleDelete = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onDelete();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-label={`Open ${displayName}`}
      className="group relative flex flex-col items-start text-left rounded-2xl border border-gray-200 bg-white p-5 hover:border-gray-400 hover:shadow-sm transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
    >
      <button
        type="button"
        onClick={handleDelete}
        onKeyDown={event => event.stopPropagation()}
        disabled={deleting}
        aria-label={`Delete ${displayName}`}
        title="Delete"
        className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Trash2 strokeWidth={1.5} className="w-4 h-4" />
      </button>
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 mb-4">
        <LineChart strokeWidth={1.5} className="w-5 h-5 text-gray-700" />
      </div>
      <h3 className="font-semibold text-gray-900 truncate w-full pr-8">
        {displayName}
      </h3>
      <p className="mt-1 text-xs text-gray-500">
        {kind}
        {subtype} · Updated {updated}
      </p>
    </div>
  );
};
