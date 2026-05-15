import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export const OptionToggle = ({
  active,
  onChange,
  Icon,
  label,
  tooltip,
}: {
  active: boolean;
  onChange: (next: boolean) => void;
  Icon: LucideIcon;
  label: string;
  tooltip: string;
}) => (
  <div className="relative group/toggle">
    <button
      type="button"
      onClick={() => onChange(!active)}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-1.5 h-7 px-2.5 rounded-full border text-xs font-medium transition-colors cursor-pointer select-none",
        active
          ? "border-black bg-black text-white"
          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-800",
      )}
    >
      <Icon strokeWidth={1.75} className="w-3.5 h-3.5" />
      {label}
    </button>
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 text-xs leading-relaxed opacity-0 pointer-events-none group-hover/toggle:opacity-100 transition-opacity duration-150 shadow-md z-50">
      {tooltip}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-200" />
    </div>
  </div>
);
