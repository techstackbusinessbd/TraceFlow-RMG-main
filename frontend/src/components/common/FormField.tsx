import React from 'react';
import { UI_TOKENS } from '../../config/designTokens';
import { AlertCircle } from 'lucide-react';

export interface FormFieldProps {
  label?: string;
  required?: boolean;
  helperText?: string;
  error?: string | string[];
  htmlFor?: string;
  systemAuto?: boolean;
  isDark?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  helperText,
  error,
  htmlFor,
  systemAuto = false,
  isDark = false,
  children,
  className = '',
}) => {
  const errorMessage = Array.isArray(error) ? error[0] : error;

  return (
    <div className={`${UI_TOKENS.form.group} ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label
            htmlFor={htmlFor}
            className={isDark ? UI_TOKENS.form.labelDark : UI_TOKENS.form.label}
          >
            <span>{label}</span>
            {required && <span className={UI_TOKENS.form.labelRequired}>*</span>}
          </label>

          {systemAuto && (
            <span className={UI_TOKENS.form.readonlyBadge}>
              System Auto
            </span>
          )}
        </div>
      )}

      {children}

      {/* Pure Server Validation Error Display with Token-Driven Typography */}
      {errorMessage && (
        <p className={isDark ? UI_TOKENS.form.errorMessageDark : UI_TOKENS.form.errorMessage}>
          <AlertCircle className={UI_TOKENS.form.errorIcon} />
          <span>{errorMessage}</span>
        </p>
      )}

      {/* Optional Helper Text (only shown when there is no error) */}
      {!errorMessage && helperText && (
        <p className={UI_TOKENS.form.helper}>
          {helperText}
        </p>
      )}
    </div>
  );
};
