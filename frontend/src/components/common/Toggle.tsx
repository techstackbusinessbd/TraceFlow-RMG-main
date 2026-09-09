import React from "react";
import { UI_TOKENS } from "../../config/designTokens";

interface ToggleProps {
  checked?: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  activeText?: string;
  inactiveText?: string;
  id?: string;
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked = false,
  onChange,
  disabled = false,
  label,
  description,
  activeText = "Active",
  inactiveText = "Inactive",
  id,
  className = "",
}) => {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`${UI_TOKENS.toggle.base} ${
          checked ? UI_TOKENS.toggle.active : UI_TOKENS.toggle.inactive
        }`}
      >
        <span
          className={`${UI_TOKENS.toggle.thumb} ${
            checked ? UI_TOKENS.toggle.thumbActive : UI_TOKENS.toggle.thumbInactive
          }`}
        />
      </button>

      {(label || activeText) && (
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-900">
              {label ? label : checked ? activeText : inactiveText}
            </span>
          </div>
          {description && (
            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{description}</p>
          )}
        </div>
      )}
    </div>
  );
};
