"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface FormErrorProps {
  error?: string | string[];
  className?: string;
  showIcon?: boolean;
}

const FormError = React.forwardRef<HTMLDivElement, FormErrorProps>(
  ({ error, className, showIcon = true, ...props }, ref) => {
    if (!error) return null;

    const errors = Array.isArray(error) ? error : [error];

    return (
      <div ref={ref} className={cn("space-y-1", className)} {...props}>
        {errors.map((err, index) => (
          <div key={index} className="flex items-start space-x-2 text-sm text-red-600">
            {showIcon && (
              <svg 
                className="h-4 w-4 mt-0.5 flex-shrink-0" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            )}
            <span className="flex-1">{err}</span>
          </div>
        ))}
      </div>
    );
  }
);

FormError.displayName = "FormError";

export { FormError };