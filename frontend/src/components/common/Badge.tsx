import React from "react";
import { UI_TOKENS } from "../../config/designTokens";

export interface BadgeProps {
  variant?: "neutral" | "success" | "warning" | "danger" | "info" | "purple";
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "neutral",
  children,
  icon,
  className = "",
}) => {
  return (
    <span
      className={`${UI_TOKENS.badge.base} ${UI_TOKENS.badge[variant]} ${className}`}
    >
      {icon && <span>{icon}</span>}
      {children}
    </span>
  );
};
