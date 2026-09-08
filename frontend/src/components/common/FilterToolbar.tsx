import React from "react";
import { Search, RotateCcw, ArrowUpDown } from "lucide-react";
import { Button } from "./Button";
import { UI_TOKENS } from "../../config/designTokens";

export interface FilterToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onFilterSubmit?: () => void;
  onReset?: () => void;
  filterInputs?: React.ReactNode;
  activeSortLabel?: string;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  searchPlaceholder?: string;
}

/**
 * Mandatory Golden List Page Standard: Tier 2 - Unified Enterprise Filter Toolbar
 * Top Row: Full search on left, select filters in middle, Filter & Reset buttons on right.
 * Bottom Subline: Active sort pill on left, Show per page dropdown on right.
 */
export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  searchValue,
  onSearchChange,
  onFilterSubmit,
  onReset,
  filterInputs,
  activeSortLabel = "Created At (DESC)",
  pageSize,
  onPageSizeChange,
  searchPlaceholder = "Search records by code, name, or keywords...",
}) => {
  return (
    <div className={UI_TOKENS.filter.container}>
      {/* Top Row: Search + Dynamic Filters + Actions */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1 flex items-center">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            className={`${UI_TOKENS.input.base} pl-9`}
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {filterInputs && <div className="flex flex-wrap items-center gap-2">{filterInputs}</div>}

        <div className="flex items-center gap-2 self-end md:self-auto">
          {onFilterSubmit && (
            <Button variant="primary" onClick={onFilterSubmit}>
              Filter
            </Button>
          )}
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              title="Reset Filters"
              className={UI_TOKENS.button.icon}
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Bottom Subline: Active Sort & Page Size */}
      <div className={UI_TOKENS.filter.subline}>
        <div className="flex items-center gap-1.5 font-medium">
          <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
          <span>Sorted by:</span>
          <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs border border-blue-100">
            {activeSortLabel}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span>Show per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className={`${UI_TOKENS.input.select} py-1 px-2 text-xs`}
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>
    </div>
  );
};
