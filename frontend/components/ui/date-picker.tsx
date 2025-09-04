"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { FormField } from "./form-field";

export interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  loading?: boolean;
  value?: string | Date;
  onChange?: (date: string | undefined) => void;
  minDate?: string;
  maxDate?: string;
  showTime?: boolean;
  format?: 'date' | 'datetime-local' | 'time';
}

const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ 
    className, 
    label, 
    error, 
    helperText, 
    loading,
    value,
    onChange,
    minDate,
    maxDate,
    showTime = false,
    format = 'date',
    ...props 
  }, ref) => {
    const [internalValue, setInternalValue] = React.useState("");

    React.useEffect(() => {
      if (value) {
        const date = value instanceof Date ? value : new Date(value);
        if (!isNaN(date.getTime())) {
          if (format === 'date') {
            setInternalValue(date.toISOString().split('T')[0]);
          } else if (format === 'datetime-local') {
            setInternalValue(date.toISOString().slice(0, 16));
          } else if (format === 'time') {
            setInternalValue(date.toTimeString().slice(0, 5));
          }
        }
      } else {
        setInternalValue("");
      }
    }, [value, format]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInternalValue(newValue);
      onChange?.(newValue || undefined);
    };

    const inputType = showTime ? 'datetime-local' : format;

    return (
      <FormField label={label} error={error} helperText={helperText} required={props.required}>
        <div className="relative">
          <input
            ref={ref}
            type={inputType}
            className={cn(
              "w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-sanvi-primary-700)] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
              error && "border-red-300 focus:ring-red-500",
              loading && "pr-10",
              className
            )}
            value={internalValue}
            onChange={handleChange}
            min={minDate}
            max={maxDate}
            {...props}
          />
          {loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-[var(--color-sanvi-primary-700)] rounded-full"></div>
            </div>
          )}
        </div>
      </FormField>
    );
  }
);

DatePicker.displayName = "DatePicker";

export { DatePicker };