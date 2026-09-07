import React from "react";
import { UI_TOKENS } from "../../config/designTokens";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success" | "icon";
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  children,
  icon,
  className = "",
  disabled,
  ...props
}) => {
  const variantClass = variant === "icon" ? UI_TOKENS.button.icon : `${UI_TOKENS.button.base} ${UI_TOKENS.button[variant]}`;

  return (
    <button
      className={`${variantClass} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="inline-flex mr-1.5">{icon}</span>}
      {children}
    </button>
  );
};
