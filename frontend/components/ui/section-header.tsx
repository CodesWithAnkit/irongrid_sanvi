"use client";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  centered?: boolean;
  className?: string;
}

export default function SectionHeader({
  title,
  subtitle,
  description,
  centered = true,
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={`mb-16 ${centered ? "text-center" : ""} ${className}`}>
      {subtitle && (
        <p className="text-teal-600 font-semibold text-lg mb-2 uppercase tracking-wide">
          {subtitle}
        </p>
      )}
      <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">
        {title}
      </h2>
      {description && (
        <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto">
          {description}
        </p>
      )}
    </div>
  );
}