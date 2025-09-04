"use client";

import * as React from "react";
import { AnalyticsQuery } from "../../lib/services/analytics";

interface DateRangeSelectorProps {
  value: AnalyticsQuery;
  onChange: (query: AnalyticsQuery) => void;
  className?: string;
}

const dateRangeOptions = [
  { value: 'LAST_7_DAYS', label: 'Last 7 Days' },
  { value: 'LAST_30_DAYS', label: 'Last 30 Days' },
  { value: 'LAST_90_DAYS', label: 'Last 90 Days' },
  { value: 'LAST_YEAR', label: 'Last Year' },
  { value: 'CUSTOM', label: 'Custom Range' },
];

export function DateRangeSelector({ value, onChange, className }: DateRangeSelectorProps) {
  const [showCustom, setShowCustom] = React.useState(value.dateRange === 'CUSTOM');

  const handleDateRangeChange = (dateRange: string) => {
    const isCustom = dateRange === 'CUSTOM';
    setShowCustom(isCustom);
    
    if (isCustom) {
      onChange({
        ...value,
        dateRange: dateRange as keyof typeof dateRangeOptions,
      });
    } else {
      onChange({
        dateRange: dateRange as keyof typeof dateRangeOptions,
        startDate: undefined,
        endDate: undefined,
      });
    }
  };

  const handleCustomDateChange = (field: 'startDate' | 'endDate', date: string) => {
    onChange({
      ...value,
      [field]: date,
    });
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className || ''}`}>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <label className="text-sm font-medium text-gray-700">Date Range:</label>
        </div>

        <select
          value={value.dateRange || 'LAST_30_DAYS'}
          onChange={(e) => handleDateRangeChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {dateRangeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {showCustom && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={value.startDate || ''}
              onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Start Date"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={value.endDate || ''}
              onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="End Date"
            />
          </div>
        )}

        <button
          onClick={() => onChange(value)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>
    </div>
  );
}