"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { FormField } from "./form-field";

export interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  loading?: boolean;
  value?: number | string;
  onChange?: (value: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  prefix?: string;
  suffix?: string;
  allowNegative?: boolean;
  allowDecimal?: boolean;
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ 
    className, 
    label, 
    error, 
    helperText, 
    loading,
    value,
    onChange,
    min,
    max,
    step = 1,
    precision = 2,
    prefix,
    suffix,
    allowNegative = true,
    allowDecimal = true,
    ...props 
  }, ref) => {
    const [displayValue, setDisplayValue] = React.useState("");
    const [focused, setFocused] = React.useState(false);

    React.useEffect(() => {
      if (value !== undefined && value !== null) {
        setDisplayValue(value.toString());
      } else {
        setDisplayValue("");
      }
    }, [value]);

    const formatNumber = (num: number): string => {
      if (!allowDecimal) {
        return Math.round(num).toString();
      }
      return num.toFixed(precision).replace(/\.?0+$/, "");
    };

    const parseNumber = (str: string): number | undefined => {
      if (!str || str === "-") return undefined;
      
      const num = parseFloat(str);
      if (isNaN(num)) return undefined;
      
      if (!allowNegative && num < 0) return undefined;
      if (min !== undefined && num < min) return min;
      if (max !== undefined && num > max) return max;
      
      return num;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value;
      
      // Remove prefix/suffix for processing
      if (prefix) inputValue = inputValue.replace(prefix, "");
      if (suffix) inputValue = inputValue.replace(suffix, "");
      
      // Allow empty, minus sign, and valid numbers
      const regex = allowDecimal 
        ? allowNegative ? /^-?\d*\.?\d*$/ : /^\d*\.?\d*$/
        : allowNegative ? /^-?\d*$/ : /^\d*$/;
      
      if (regex.test(inputValue) || inputValue === "") {
        setDisplayValue(inputValue);
        const numValue = parseNumber(inputValue);
        onChange?.(numValue);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      const numValue = parseNumber(displayValue);
      if (numValue !== undefined) {
        setDisplayValue(formatNumber(numValue));
      }
      props.onBlur?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(true);
      props.onFocus?.(e);
    };

    const increment = () => {
      const current = parseNumber(displayValue) || 0;
      const newValue = current + step;
      const finalValue = max !== undefined ? Math.min(newValue, max) : newValue;
      setDisplayValue(finalValue.toString());
      onChange?.(finalValue);
    };

    const decrement = () => {
      const current = parseNumber(displayValue) || 0;
      const newValue = current - step;
      const finalValue = min !== undefined ? Math.max(newValue, min) : newValue;
      setDisplayValue(finalValue.toString());
      onChange?.(finalValue);
    };

    const displayValueWithPrefixSuffix = focused 
      ? displayValue 
      : `${prefix || ""}${displayValue}${suffix || ""}`;

    return (
      <FormField label={label} error={error} helperText={helperText} required={props.required}>
        <div className="relative">
          <input
            ref={ref}
            type="text"
            inputMode="numeric"
            className={cn(
              "w-full border border-gray-300 rounded-md px-3 py-2 pr-16 focus:outline-none focus:ring-2 focus:ring-[var(--color-sanvi-primary-700)] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
              error && "border-red-300 focus:ring-red-500",
              className
            )}
            value={displayValueWithPrefixSuffix}
            onChange={handleInputChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            {...props}
          />
          {loading && (
            <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-[var(--color-sanvi-primary-700)] rounded-full"></div>
            </div>
          )}
          <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex flex-col">
            <button
              type="button"
              onClick={increment}
              disabled={props.disabled || loading || (max !== undefined && (parseNumber(displayValue) || 0) >= max)}
              className="px-2 py-0.5 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={decrement}
              disabled={props.disabled || loading || (min !== undefined && (parseNumber(displayValue) || 0) <= min)}
              className="px-2 py-0.5 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </FormField>
    );
  }
);

NumberInput.displayName = "NumberInput";

export { NumberInput };