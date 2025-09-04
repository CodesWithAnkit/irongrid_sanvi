"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface FormSuccessProps {
  message?: string;
  className?: string;
  showIcon?: boolean;
  onDismiss?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
}

const FormSuccess = React.forwardRef<HTMLDivElement, FormSuccessProps>(
  ({ 
    message, 
    className, 
    showIcon = true, 
    onDismiss,
    autoHide = false,
    autoHideDelay = 5000,
    ...props 
  }, ref) => {
    const [visible, setVisible] = React.useState(true);

    React.useEffect(() => {
      if (autoHide && message) {
        const timer = setTimeout(() => {
          setVisible(false);
          onDismiss?.();
        }, autoHideDelay);

        return () => clearTimeout(timer);
      }
    }, [message, autoHide, autoHideDelay, onDismiss]);

    if (!message || !visible) return null;

    return (
      <div 
        ref={ref} 
        className={cn(
          "flex items-start space-x-2 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-800",
          className
        )} 
        {...props}
      >
        {showIcon && (
          <svg 
            className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        )}
        <span className="flex-1">{message}</span>
        {onDismiss && (
          <button
            type="button"
            onClick={() => {
              setVisible(false);
              onDismiss();
            }}
            className="text-green-600 hover:text-green-800 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  }
);

FormSuccess.displayName = "FormSuccess";

export { FormSuccess };