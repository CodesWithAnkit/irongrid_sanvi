"use client";

import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  backgroundGradient?: string;
  actions?: ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  subtitle,
  description,
  backgroundGradient = "from-teal-600 to-teal-800",
  actions,
  className = "",
}: PageHeaderProps) {
  return (
    <section className={`relative bg-gradient-to-r ${backgroundGradient} text-white py-20 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {subtitle && (
            <p className="text-teal-200 font-semibold text-lg mb-4 uppercase tracking-wide">
              {subtitle}
            </p>
          )}
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            {title}
          </h1>
          {description && (
            <p className="text-xl md:text-2xl mb-8 text-teal-100">
              {description}
            </p>
          )}
          {actions && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {actions}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

