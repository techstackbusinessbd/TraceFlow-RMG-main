import React from "react";
import { Badge } from "./Badge";
import { UI_TOKENS } from "../../config/designTokens";

export interface PageHeaderProps {
  title: string;
  badgeCount?: number | string;
  badgeLabel?: string;
  actions?: React.ReactNode;
}

/**
 * Mandatory Golden List Page Standard: Tier 1 - Sleek Header Row
 * Single-line clean layout, direct concise title, counter badge, action buttons on far right.
 * No redundant giant icons or verbose subtitle paragraphs.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  badgeCount,
  badgeLabel,
  actions,
}) => {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-200">
      <div className="flex items-center gap-3">
        <h1 className={UI_TOKENS.typography.sizes["2xl"]}>{title}</h1>
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
