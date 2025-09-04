"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { FormField } from "./form-field";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  loading?: boolean;
  searchable?: boolean;
  onSearch?: (query: string) => void;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ 
    className, 
    label, 
    error, 
    helperText, 
    options, 
    placeholder, 
    loading,
    searchable,
    onSearch,
    ...props 
  }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [filteredOptions, setFilteredOptions] = React.useState(options);

    React.useEffect(() => {
      if (searchable && searchQuery) {
        const filtered = options.filter(option =>
          option.label.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredOptions(filtered);
        onSearch?.(searchQuery);
      } else {
        setFilteredOptions(options);
      }
    }, [searchQuery, options, searchable, onSearch]);

    if (searchable) {
      // Custom searchable select implementation would go here
      // For now, falling back to standard select
    }

    return (
      <FormField label={label} error={error} helperText={helperText} required={props.required}>
        <div className="relative">
          <select
            className={cn(
              "w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-sanvi-primary-700)] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed bg-white transition-colors",
              error && "border-red-300 focus:ring-red-500",
              loading && "pr-10",
              className
            )}
            ref={ref}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {filteredOptions.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
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

Select.displayName = "Select";

export { Select };