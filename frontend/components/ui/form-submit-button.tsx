"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { Button } from "./button";

export interface FormSubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  showSuccess?: boolean;
  showError?: boolean;
  successDuration?: number;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const FormSubmitButton = React.forwardRef<HTMLButtonElement, FormSubmitButtonProps>(
  ({ 
    children,
    loading = false,
    loadingText = "Submitting...",
    successText = "Success!",
    errorText = "Error occurred",
    showSuccess = false,
    showError = false,
    successDuration = 2000,
    variant = "primary",
    size = "md",
    disabled,
    className,
    ...props 
  }, ref) => {
    const [showSuccessState, setShowSuccessState] = React.useState(false);
    const [showErrorState, setShowErrorState] = React.useState(false);

    React.useEffect(() => {
      if (showSuccess) {
        setShowSuccessState(true);
        const timer = setTimeout(() => {
          setShowSuccessState(false);
        }, successDuration);
        return () => clearTimeout(timer);
      }
    }, [showSuccess, successDuration]);

    React.useEffect(() => {
      if (showError) {
        setShowErrorState(true);
        const timer = setTimeout(() => {
          setShowErrorState(false);
        }, 3000); // Error state lasts 3 seconds
        return () => clearTimeout(timer);
      }
    }, [showError]);

    const getButtonContent = () => {
      if (loading) {
        return (
          <div className="flex items-center space-x-2">
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
            <span>{loadingText}</span>
          </div>
        );
      }

      if (showSuccessState) {
        return (
          <div className="flex items-center space-x-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{successText}</span>
          </div>
        );
      }

      if (showErrorState) {
        return (
          <div className="flex items-center space-x-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>{errorText}</span>
          </div>
        );
      }

      return children;
    };

    const getButtonVariant = () => {
      if (showSuccessState) return "primary";
      if (showErrorState) return "secondary";
      return variant;
    };

    return (
      <Button
        ref={ref}
        type="submit"
        variant={getButtonVariant()}
        size={size}
        disabled={disabled || loading || showSuccessState}
        className={cn(
          "transition-all duration-200",
          showSuccessState && "bg-green-600 hover:bg-green-700 border-green-600",
          showErrorState && "bg-red-600 hover:bg-red-700 border-red-600 text-white",
          className
        )}
        {...props}
      >
        {getButtonContent()}
      </Button>
    );
  }
);

FormSubmitButton.displayName = "FormSubmitButton";

export { FormSubmitButton };