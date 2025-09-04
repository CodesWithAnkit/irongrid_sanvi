"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  description?: string;
  indeterminate?: boolean;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, helperText, description, indeterminate, ...props }, ref) => {
    const checkboxRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => checkboxRef.current!);

    React.useEffect(() => {
      if (checkboxRef.current) {
        checkboxRef.current.indeterminate = indeterminate || false;
      }
    }, [indeterminate]);

    return (
      <div className="space-y-2">
        <div className="flex items-start space-x-3">
          <input
            ref={checkboxRef}
            type="checkbox"
            className={cn(
              "mt-1 h-4 w-4 text-[var(--color-sanvi-primary-700)] border-gray-300 rounded transition-colors",
              "focus:ring-2 focus:ring-[var(--color-sanvi-primary-700)] focus:ring-offset-0",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-red-300 focus:ring-red-500",
              className
            )}
            {...props}
          />
          {label && (
            <div className="flex-1">
              <label 
                className="block text-sm font-medium text-gray-700 cursor-pointer"
                onClick={() => checkboxRef.current?.click()}
              >
                {label}
                {props.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {description && (
                <p className="text-sm text-gray-500 mt-1">{description}</p>
              )}
            </div>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };