"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface FormFieldProps {
  children: React.ReactNode;
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
  labelClassName?: string;
  errorClassName?: string;
  helperClassName?: string;
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ 
    children, 
    label, 
    error, 
    helperText, 
    required, 
    className,
    labelClassName,
    errorClassName,
    helperClassName,
    ...props 
  }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        {label && (
          <label className={cn(
            "block text-sm font-medium text-gray-700",
            labelClassName
          )}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        {children}
        {error && (
          <p className={cn("text-sm text-red-600", errorClassName)}>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className={cn("text-sm text-gray-500", helperClassName)}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";

export { FormField };