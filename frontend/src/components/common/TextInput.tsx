import React from 'react';
import { UI_TOKENS } from '../../config/designTokens';

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  isError?: boolean;
  isDark?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      isError = false,
      isDark = false,
      leftIcon,
      rightIcon,
      className = '',
      ...props
    },
    ref
  ) => {
    let baseClass: string = isDark ? UI_TOKENS.input.darkBase : UI_TOKENS.input.base;

    if (isError) {
      baseClass = `${baseClass} ${isDark ? UI_TOKENS.input.errorDark : UI_TOKENS.input.error}`;
    }

    if (leftIcon) {
      baseClass = `${baseClass} pl-9`;
    }

    if (rightIcon) {
      baseClass = `${baseClass} pr-10`;
    }

    const inputElement = (
      <input
        ref={ref}
        className={`${baseClass} ${className}`}
        {...props}
      />
    );

    if (leftIcon || rightIcon) {
      return (
        <div className={UI_TOKENS.input.iconWrapper}>
          {leftIcon && <div className={UI_TOKENS.input.iconLeft}>{leftIcon}</div>}
          {inputElement}
          {rightIcon && <div className={UI_TOKENS.input.iconRight}>{rightIcon}</div>}
        </div>
      );
    }

    return inputElement;
  }
);

TextInput.displayName = 'TextInput';
