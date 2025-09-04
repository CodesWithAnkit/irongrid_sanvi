"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  error?: string;
  helperText?: string;
  className?: string;
  orientation?: "vertical" | "horizontal";
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ 
    name, 
    options, 
    value, 
    onChange, 
    label, 
    error, 
    helperText, 
    className,
    orientation = "vertical"
  }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-2", className)}>
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <div className={cn(
          "space-y-3",
          orientation === "horizontal" && "flex space-x-6 space-y-0"
        )}>
          {options.map((option) => (
            <div key={option.value} className="flex items-start space-x-3">
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={(e) => onChange?.(e.target.value)}
                disabled={option.disabled}
                className={cn(
                  "mt-1 h-4 w-4 text-[var(--color-sanvi-primary-700)] border-gray-300",
                  "focus:ring-2 focus:ring-[var(--color-sanvi-primary-700)]",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  error && "border-red-300 focus:ring-red-500"
                )}
              />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">
                  {option.label}
                </label>
                {option.description && (
                  <p className="text-sm text-gray-500 mt-1">{option.description}</p>
                )}
              </div>
            </div>
          ))}
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

RadioGroup.displayName = "RadioGroup";

export { RadioGroup };