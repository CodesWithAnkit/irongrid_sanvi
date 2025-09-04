"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { FormField } from "./form-field";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  loading?: boolean;
  autoResize?: boolean;
  maxLength?: number;
  showCharCount?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className, 
    label, 
    error, 
    helperText, 
    loading,
    autoResize = false,
    maxLength,
    showCharCount = false,
    value,
    onChange,
    ...props 
  }, ref) => {
    const [charCount, setCharCount] = React.useState(0);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    React.useImperativeHandle(ref, () => textareaRef.current!);

    React.useEffect(() => {
      if (value) {
        setCharCount(value.toString().length);
      }
    }, [value]);

    React.useEffect(() => {
      if (autoResize && textareaRef.current) {
        const textarea = textareaRef.current;
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    }, [value, autoResize]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      
      if (maxLength && newValue.length > maxLength) {
        return;
      }

      setCharCount(newValue.length);
      
      if (autoResize) {
        const textarea = e.target;
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      }

      onChange?.(e);
    };

    const helperTextWithCount = React.useMemo(() => {
      if (showCharCount && maxLength) {
        const countText = `${charCount}/${maxLength}`;
        return helperText ? `${helperText} • ${countText}` : countText;
      }
      return helperText;
    }, [helperText, showCharCount, charCount, maxLength]);

    return (
      <FormField label={label} error={error} helperText={helperTextWithCount} required={props.required}>
        <div className="relative">
          <textarea
            ref={textareaRef}
            className={cn(
              "w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-sanvi-primary-700)] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
              autoResize ? "resize-none" : "resize-vertical",
              "min-h-[80px]",
              error && "border-red-300 focus:ring-red-500",
              loading && "pr-10",
              className
            )}
            value={value}
            onChange={handleChange}
            maxLength={maxLength}
            {...props}
          />
          {loading && (
            <div className="absolute right-3 top-3">
              <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-[var(--color-sanvi-primary-700)] rounded-full"></div>
            </div>
          )}
        </div>
      </FormField>
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };