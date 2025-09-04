"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export type FilterOption = {
  key: string;
  label: string;
  options: Array<{ value: string; label: string }>;
};

export type SearchFilterProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters?: FilterOption[];
  filterValues?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  onClearFilters?: () => void;
  placeholder?: string;
};

export function SearchFilter({
  searchValue,
  onSearchChange,
  filters = [],
  filterValues = {},
  onFilterChange,
  onClearFilters,
  placeholder = "Search..."
}: SearchFilterProps) {
  const hasActiveFilters = Object.values(filterValues).some(value => value !== "");

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1">
          <Input
            placeholder={placeholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Filters */}
        {filters.map((filter) => (
          <div key={filter.key} className="min-w-[200px]">
            <Select
              placeholder={filter.label}
              options={[
                { value: "", label: `All ${filter.label}` },
                ...filter.options
              ]}
              value={filterValues[filter.key] || ""}
              onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
            />
          </div>
        ))}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={onClearFilters}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(filterValues).map(([key, value]) => {
            if (!value) return null;
            
            const filter = filters.find(f => f.key === key);
            const option = filter?.options.find(o => o.value === value);
            
            return (
              <span
                key={key}
                className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
              >
                {filter?.label}: {option?.label || value}
                <button
                  onClick={() => onFilterChange?.(key, "")}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}