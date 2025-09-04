"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { FormField } from "./form-field";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClear?: () => void;
  showClearButton?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type, 
    label, 
    error, 
    helperText, 
    loading,
    leftIcon,
    rightIcon,
    onClear,
    showClearButton,
    value,
    ...props 
  }, ref) => {
    const [internalValue, setInternalValue] = React.useState(value || "");
    
    React.useEffect(() => {
      setInternalValue(value || "");
    }, [value]);

    const handleClear = () => {
      setInternalValue("");
      onClear?.();
    };

    const showClear = showClearButton && internalValue && !props.disabled && !loading;

    return (
      <FormField label={label} error={error} helperText={helperText} required={props.required}>
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-sanvi-primary-700)] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
              error && "border-red-300 focus:ring-red-500",
              loading && "pr-10",
              leftIcon && "pl-10",
              (rightIcon || showClear) && "pr-10",
              className
            )}
            ref={ref}
            value={internalValue}
            onChange={(e) => {
              setInternalValue(e.target.value);
              props.onChange?.(e);
            }}
            {...props}
          />
          {loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-[var(--color-sanvi-primary-700)] rounded-full"></div>
            </div>
          )}
          {showClear && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {rightIcon && !loading && !showClear && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
      </FormField>
    );
  }
);

Input.displayName = "Input";

export { Input };