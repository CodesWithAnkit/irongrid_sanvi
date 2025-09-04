"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface AutoSaveIndicatorProps {
  status: "idle" | "saving" | "saved" | "error";
  className?: string;
  showText?: boolean;
  lastSaved?: Date;
}

const AutoSaveIndicator = React.forwardRef<HTMLDivElement, AutoSaveIndicatorProps>(
  ({ status, className, showText = true, lastSaved, ...props }, ref) => {
    const getStatusContent = () => {
      switch (status) {
        case "saving":
          return {
            icon: (
              <div className="animate-spin h-3 w-3 border border-gray-400 border-t-transparent rounded-full"></div>
            ),
            text: "Saving...",
            color: "text-gray-600",
          };
        case "saved":
          return {
            icon: (
              <svg className="h-3 w-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ),
            text: lastSaved ? `Saved ${formatLastSaved(lastSaved)}` : "Saved",
            color: "text-green-600",
          };
        case "error":
          return {
            icon: (
              <svg className="h-3 w-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ),
            text: "Save failed",
            color: "text-red-600",
          };
        default:
          return null;
      }
    };

    const formatLastSaved = (date: Date): string => {
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) {
        return "just now";
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      } else {
        return date.toLocaleDateString();
      }
    };

    const statusContent = getStatusContent();

    if (!statusContent || status === "idle") {
      return null;
    }

    return (
      <div 
        ref={ref}
        className={cn(
          "flex items-center space-x-1 text-xs",
          statusContent.color,
          className
        )}
        {...props}
      >
        {statusContent.icon}
        {showText && <span>{statusContent.text}</span>}
      </div>
    );
  }
);

AutoSaveIndicator.displayName = "AutoSaveIndicator";

export { AutoSaveIndicator };