"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export type BulkAction = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  variant?: "default" | "outline" | "destructive";
  onClick: (selectedIds: string[]) => void;
};

export type BulkActionsProps = {
  selectedIds: string[];
  totalCount: number;
  actions: BulkAction[];
  onSelectAll: (selected: boolean) => void;
  onClearSelection: () => void;
};

export function BulkActions({
  selectedIds,
  totalCount,
  actions,
  onSelectAll,
  onClearSelection
}: BulkActionsProps) {
  const isAllSelected = selectedIds.length === totalCount && totalCount > 0;
  const isPartiallySelected = selectedIds.length > 0 && selectedIds.length < totalCount;

  if (selectedIds.length === 0) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Checkbox
            checked={isAllSelected}
            onChange={(e) => onSelectAll(e.target.checked)}
            label={`${selectedIds.length} of ${totalCount} selected`}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={onClearSelection}
          >
            Clear Selection
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant || "outline"}
              size="sm"
              onClick={() => action.onClick(selectedIds)}
            >
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}