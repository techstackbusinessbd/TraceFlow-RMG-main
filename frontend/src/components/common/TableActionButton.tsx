import React from "react";
import { UI_TOKENS } from "../../config/designTokens";

export interface TableActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const TableActionButton: React.FC<TableActionButtonProps> = ({
  variant = "secondary",
  icon,
  children,
  className = "",
  ...props
}) => {
  const variantStyles = {
    primary: UI_TOKENS.button.tableActionPrimary,
    secondary: UI_TOKENS.button.tableActionSecondary,
    danger: UI_TOKENS.button.tableActionDanger,
  };

  return (
    <button
      className={`${UI_TOKENS.button.tableAction} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
};
