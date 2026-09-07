import React from "react";
import { Badge } from "./Badge";

export interface PageHeaderProps {
  title: string;
  badgeCount?: number | string;
  badgeLabel?: string;
  actions?: React.ReactNode;
}

/**
 * Microsoft Power Automate Fluent 2 Page Header
 * Clean, lightweight, direct title with subtle pill counter and action buttons.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  badgeCount,
  badgeLabel,
  actions,
}) => {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {badgeCount !== undefined && (
          <Badge variant="neutral">
            {badgeCount} {badgeLabel || "Items"}
          </Badge>
        )}
      </div>
      {actions && <div className="flex items-center gap-2.5">{actions}</div>}
    </header>
  );
};
