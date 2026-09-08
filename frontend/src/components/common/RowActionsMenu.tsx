import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
 * — Renders via createPortal with fixed coordinates to prevent clipping by table overflow
 */
export const RowActionsMenu: React.FC<RowActionsMenuProps> = ({
  primaryActions = [],
  menuActions = [],
}) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const toggleDropdown = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const menuWidth = 176; // 11rem / w-44
      const menuHeight = 90; // estimated height
      
      let top = rect.bottom + 4;
      // If menu goes below viewport, flip upward
      if (top + menuHeight > window.innerHeight && rect.top - menuHeight > 0) {
        top = rect.top - menuHeight - 4;
      }

      let left = rect.right - menuWidth;
      if (left < 10) left = 10;

      setDropdownPos({ top, left });
    }
    setOpen((prev) => !prev);
  };

  // Close dropdown on outside click or scroll
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [open]);

  return (
    <div className="flex items-center justify-end gap-1">
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

      {/* ⋮ More dropdown trigger */}
      {menuActions.length > 0 && (
        <>
          <button
            ref={triggerRef}
            title="More actions"
            aria-label="More actions"
            onClick={toggleDropdown}
            className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-slate-200 text-slate-500 bg-white hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer shadow-2xs"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          {open &&
            typeof document !== "undefined" &&
            createPortal(
              <div
                ref={dropdownRef}
                style={{ top: `${dropdownPos.top}px`, left: `${dropdownPos.left}px` }}
                className="fixed z-50 w-44 bg-white border border-slate-200 rounded-md shadow-lg py-1 text-xs animate-in fade-in duration-100"
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
              </div>,
              document.body
            )}
        </>
      )}
    </div>
  );
};
