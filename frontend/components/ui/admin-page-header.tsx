"use client";

import { ReactNode } from "react";

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  backgroundGradient?: string;
  actions?: ReactNode;
  className?: string;
  compact?: boolean;
}

export default function AdminPageHeader({
  title,
  subtitle,
  description,
  backgroundGradient = "from-[var(--color-sanvi-primary-700)] to-[var(--color-sanvi-primary-900)]",
  actions,
  className = "",
  compact = false,
}: AdminPageHeaderProps) {
  return (
    <section className={`relative bg-gradient-to-r ${backgroundGradient} text-white ${compact ? 'py-8' : 'py-12'} ${className}`}>
      <div className="px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              {subtitle && (
                <p className="text-teal-200 font-semibold text-sm mb-2 uppercase tracking-wide">
                  {subtitle}
                </p>
              )}
              <h1 className={`font-bold mb-2 ${compact ? 'text-2xl lg:text-3xl' : 'text-3xl lg:text-4xl'}`}>
                {title}
              </h1>
              {description && (
                <p className={`text-teal-100 ${compact ? 'text-base' : 'text-lg'}`}>
                  {description}
                </p>
              )}
            </div>
            {actions && (
              <div className="mt-4 lg:mt-0 lg:ml-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  {actions}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}