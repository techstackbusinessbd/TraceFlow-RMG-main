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
    primary: "border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100",
    secondary: "border-slate-200 text-slate-700 bg-white hover:bg-slate-50",
    danger: "border-red-200 text-red-700 bg-red-50 hover:bg-red-100",
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
