"use client";

import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { BulkActions, type BulkAction } from "@/components/ui/bulk-actions";

export type Column<T> = {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
};

export type DataTableProps<T> = {
  data: T[];
  columns: Column<T>[];
  keyField: keyof T;
  bulkActions?: BulkAction[];
  onRowClick?: (item: T) => void;
  loading?: boolean;
  emptyMessage?: string;
};

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  keyField,
  bulkActions = [],
  onRowClick,
  loading,
  emptyMessage = "No data found"
}: DataTableProps<T>) {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedIds(data.map(item => item[keyField].toString()));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectItem = (id: string, selected: boolean) => {
    if (selected) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  if (loading) {
    return (
      <div className="border border-gray-200 rounded-lg">
        <div className="p-8 text-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="border border-gray-200 rounded-lg">
        <div className="p-8 text-center">
          <div className="text-gray-500">{emptyMessage}</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {bulkActions.length > 0 && (
        <BulkActions
          selectedIds={selectedIds}
          totalCount={data.length}
          actions={bulkActions}
          onSelectAll={handleSelectAll}
          onClearSelection={clearSelection}
        />
      )}
      
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {bulkActions.length > 0 && (
                <th className="px-6 py-3 text-left">
                  <Checkbox
                    checked={selectedIds.length === data.length && data.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  style={{ width: column.width }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item) => {
              const id = item[keyField].toString();
              const isSelected = selectedIds.includes(id);
              
              return (
                <tr
                  key={id}
                  className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''} ${isSelected ? 'bg-blue-50' : ''}`}
                  onClick={() => onRowClick?.(item)}
                >
                  {bulkActions.length > 0 && (
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onChange={(e) => handleSelectItem(id, e.target.checked)}
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                      {column.render ? column.render(item) : item[column.key]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}