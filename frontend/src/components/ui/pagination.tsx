import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  page: number;
  totalPages: number;
  disabled?: boolean;
  onPageChange: (newPage: number) => void;
  className?: string;
}

export const Pagination = ({
  page,
  totalPages,
  disabled = false,
  onPageChange,
  className,
}: PaginationProps) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = (): (number | "ellipsis-start" | "ellipsis-end")[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (page <= 4) {
      return [1, 2, 3, 4, 5, "ellipsis-end", totalPages];
    }

    if (page >= totalPages - 3) {
      return [
        1,
        "ellipsis-start",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      "ellipsis-start",
      page - 1,
      page,
      page + 1,
      "ellipsis-end",
      totalPages,
    ];
  };

  const pages = getPageNumbers();

  return (
    <nav
      role="navigation"
      aria-label="Pagination Navigation"
      className={cn("flex flex-col items-center gap-2 mt-8 select-none", className)}
    >
      <div className="inline-flex items-center gap-1 p-1 sm:p-1.5 rounded-xl border border-gray-200 bg-white shadow-xs">
        {/* Previous Button */}
        <button
          type="button"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Go to previous page"
          className="inline-flex items-center justify-center gap-1 h-9 px-2.5 sm:px-3 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {pages.map((item, index) => {
            if (item === "ellipsis-start" || item === "ellipsis-end") {
              return (
                <div
                  key={`ellipsis-${index}`}
                  className="w-8 h-9 flex items-center justify-center text-gray-400"
                  aria-hidden="true"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </div>
              );
            }

            const isActive = item === page;

            return (
              <button
                key={item}
                type="button"
                disabled={disabled}
                onClick={() => onPageChange(item)}
                aria-current={isActive ? "page" : undefined}
                aria-label={`Go to page ${item}`}
                className={cn(
                  "min-w-9 h-9 px-2 text-sm rounded-lg flex items-center justify-center cursor-pointer",
                  isActive
                    ? "bg-black text-white font-medium shadow-xs pointer-events-none"
                    : "text-gray-700 hover:bg-gray-100 hover:text-black font-normal",
                  disabled && "opacity-40 disabled:pointer-events-none",
                )}
              >
                {item}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Go to next page"
          className="inline-flex items-center justify-center gap-1 h-9 px-2.5 sm:px-3 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Screen Reader Status */}
      <span role="status" aria-live="polite" className="sr-only">
        Page {page} of {totalPages}
      </span>
    </nav>
  );
};
