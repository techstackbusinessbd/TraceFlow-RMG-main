import React from "react";
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { UI_TOKENS } from "../../config/designTokens";

export interface ColumnDef<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  width?: string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (field: string) => void;
}

/**
 * Mandatory Golden List Page Standard: Tier 3 - Enterprise DataTable Shell
 * 100% Fixed and immutable table shell, header with interactive column sorting, alternating row highlights, and footer pagination.
 * Dynamic typed ColumnDef<T>[] accepts domain-specific renderers and sortable headers.
 */
export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  totalRecords,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  isLoading = false,
  emptyMessage = "No records found matching criteria.",
  sortField,
  sortDirection = "asc",
  onSort,
}: DataTableProps<T>) {
  const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  return (
    <div className={UI_TOKENS.table.container}>
      <div className="overflow-x-auto">
        <table className={UI_TOKENS.table.table}>
          <thead className={UI_TOKENS.table.thead}>
            <tr>
              {columns.map((col) => {
                const isCurrentSort = sortField === col.key;
                const isSortable = col.sortable !== false && col.key !== "actions";

                return (
                  <th
                    key={col.key}
                    style={{ width: col.width }}
                    onClick={() => isSortable && onSort?.(col.key)}
                    className={`${UI_TOKENS.table.th} ${
                      col.align === "center"
                        ? "text-center"
                        : col.align === "right"
                        ? "text-right"
                        : "text-left"
                    } ${
                      isSortable
                        ? "cursor-pointer select-none hover:bg-slate-100/80 transition-colors group"
                        : ""
                    }`}
                  >
                    <div
                      className={`inline-flex items-center gap-1.5 ${
                        col.align === "center"
                          ? "justify-center w-full"
                          : col.align === "right"
                          ? "justify-end w-full"
                          : "justify-start"
                      }`}
                    >
                      <span className={isCurrentSort ? "text-[#0066FF] font-bold" : ""}>
                        {col.header}
                      </span>
                      {isSortable && (
                        <span className="inline-flex shrink-0">
                          {isCurrentSort ? (
                            sortDirection === "asc" ? (
                              <ArrowUp className="w-3 h-3 text-[#0066FF]" />
                            ) : (
                              <ArrowDown className="w-3 h-3 text-[#0066FF]" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className={UI_TOKENS.table.tbody}>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">
                  <div className="inline-flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading data records...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr key={row.id ? String(row.id) : index} className={`${UI_TOKENS.table.tr} ${UI_TOKENS.table.trAlt}`}>
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`${UI_TOKENS.table.td} ${
                        col.align === "center"
                          ? "text-center"
                          : col.align === "right"
                          ? "text-right"
                          : "text-left"
                      }`}
                    >
                      {col.render ? col.render(row, index) : String((row as Record<string, unknown>)[col.key] ?? "-")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mandatory Standard Enterprise Footer & Pagination */}
      <div className={UI_TOKENS.table.footer}>
        <div>
          Showing <span className="font-semibold text-slate-900">{startRecord}</span> to{" "}
          <span className="font-semibold text-slate-900">{endRecord}</span> of{" "}
          <span className="font-semibold text-slate-900">{totalRecords}</span> records
        </div>

        <div className="flex items-center gap-3">
          <span>
            Page <span className="font-semibold text-slate-900">{currentPage}</span> of{" "}
            <span className="font-semibold text-slate-900">{Math.max(1, totalPages)}</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages || totalPages === 0}
              onClick={() => onPageChange(currentPage + 1)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
