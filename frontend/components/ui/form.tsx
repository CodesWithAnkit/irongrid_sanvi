"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  title?: string;
  description?: string;
}

const Form = React.forwardRef<HTMLFormElement, FormProps>(
  ({ className, title, description, children, ...props }, ref) => {
    return (
      <form
        ref={ref}
        className={cn("space-y-6", className)}
        {...props}
      >
        {(title || description) && (
          <div className="space-y-2">
            {title && (
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            )}
            {description && (
              <p className="text-sm text-gray-600">{description}</p>
            )}
          </div>
        )}
        {children}
      </form>
    );
  }
);

Form.displayName = "Form";

// Form Section Component
export interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

const FormSection = ({ title, description, children, className }: FormSectionProps) => {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3 className="text-base font-medium text-gray-900">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

// Form Actions Component
export interface FormActionsProps {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}

const FormActions = ({ children, className, align = "right" }: FormActionsProps) => {
  return (
    <div className={cn(
      "flex gap-3 pt-4 border-t border-gray-200",
      align === "left" && "justify-start",
      align === "center" && "justify-center", 
      align === "right" && "justify-end",
      className
    )}>
      {children}
    </div>
  );
};

export { Form, FormSection, FormActions };