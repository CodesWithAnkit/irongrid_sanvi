"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "link";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
};

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-[var(--color-sanvi-primary-700)] text-white hover:bg-[var(--color-sanvi-primary-900)]",
  secondary:
    "bg-[var(--color-sanvi-secondary-500)] text-white hover:bg-[var(--color-sanvi-secondary-600)]",
  outline:
    "border border-[var(--border-color)] text-[var(--color-sanvi-neutral-900)] hover:bg-[var(--color-sanvi-neutral-100)]",
  ghost:
    "text-[var(--color-sanvi-neutral-900)] hover:bg-[var(--color-sanvi-neutral-100)]",
  link:
    "text-[var(--color-sanvi-primary-700)] underline-offset-4 hover:underline bg-transparent p-0 h-auto",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "h-10 w-10 p-0",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", isLoading = false, children, disabled, ...props },
    ref
  ) => {
    const classes = cn(
      "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-sanvi)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
      variant !== "link" && "gap-2",
      variant !== "link" && "shadow-sm",
      variantClasses[variant],
      sizeClasses[size],
      className
    );

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading && (
          <svg
            className={cn("animate-spin", size === "sm" ? "h-4 w-4" : size === "lg" ? "h-5 w-5" : "h-4 w-4")}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export default Button;
