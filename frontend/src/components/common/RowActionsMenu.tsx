import React, { useState, useRef, useEffect } from "react";
import { MoreHorizontal } from "lucide-react";

export interface RowAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "danger" | "warning";
  disabled?: boolean;
  dividerBefore?: boolean;
}

export interface RowActionsMenuProps {
  /** Primary single-click actions (max 2, shown as icon buttons inline) */
  primaryActions?: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary";
  }[];
  /** Secondary actions placed inside the ⋮ dropdown */
  menuActions?: RowAction[];
}

/**
 * Enterprise Row Actions Pattern
 * — Up to 2 compact icon-only primary action buttons (View, Edit)
 * — Secondary/destructive actions inside a ⋮ More dropdown menu
 *
 * This replaces the old pattern of 4+ full-width text buttons per row.
 */
export const RowActionsMenu: React.FC<RowActionsMenuProps> = ({
  primaryActions = [],
  menuActions = [],
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="flex items-center justify-end gap-1" ref={containerRef}>
      {/* Primary inline icon buttons */}
      {primaryActions.map((action, i) => (
        <button
          key={i}
          title={action.label}
          aria-label={action.label}
          onClick={action.onClick}
          className={`
            inline-flex items-center justify-center w-7 h-7 rounded-md border text-xs
            font-medium transition-colors cursor-pointer shadow-2xs
            ${action.variant === "primary"
              ? "border-blue-200 text-[#0066FF] bg-[#EFF6FC] hover:bg-blue-100"
              : "border-slate-200 text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-900"
            }
          `}
        >
          {action.icon}
        </button>
      ))}

      {/* ⋮ More dropdown */}
      {menuActions.length > 0 && (
        <div className="relative">
          <button
            title="More actions"
            aria-label="More actions"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-slate-200 text-slate-500 bg-white hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer shadow-2xs"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          {open && (
            <div
              className="absolute right-0 top-8 z-50 w-44 bg-white border border-slate-200 rounded-md shadow-lg py-1 text-xs"
              role="menu"
            >
              {menuActions.map((action, i) => (
                <React.Fragment key={i}>
                  {action.dividerBefore && (
                    <div className="my-1 border-t border-slate-100" />
                  )}
                  <button
                    role="menuitem"
                    disabled={action.disabled}
                    onClick={() => {
                      setOpen(false);
                      action.onClick();
                    }}
                    className={`
                      w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors cursor-pointer
                      disabled:opacity-40 disabled:cursor-not-allowed
                      ${action.variant === "danger"
                        ? "text-rose-600 hover:bg-rose-50"
                        : action.variant === "warning"
                        ? "text-amber-700 hover:bg-amber-50"
                        : "text-slate-700 hover:bg-slate-50"
                      }
                    `}
                  >
                    {action.icon && (
                      <span className="shrink-0">{action.icon}</span>
                    )}
                    <span>{action.label}</span>
                  </button>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
