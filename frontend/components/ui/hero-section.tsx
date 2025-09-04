"use client";

import { ReactNode } from "react";
import { Button } from "./button";

interface HeroAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "outline" | "secondary";
  icon?: ReactNode;
}

interface HeroSectionProps {
  title: string;
  subtitle?: string;
  description: string;
  actions?: HeroAction[];
  backgroundGradient?: string;
  children?: ReactNode;
}

export default function HeroSection({
  title,
  subtitle,
  description,
  actions = [],
  backgroundGradient = "from-teal-600 via-teal-700 to-teal-800",
  children,
}: HeroSectionProps) {
  return (
    <section className={`relative bg-gradient-to-br ${backgroundGradient} text-white py-24`}>
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="container mx-auto px-4 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
              {title}
              {subtitle && (
                <span className="block text-teal-200 text-4xl md:text-6xl">
                  {subtitle}
                </span>
              )}
            </h1>
            <p className="text-xl md:text-2xl text-teal-100 mb-10 leading-relaxed">
              {description}
            </p>
            {actions.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-6">
                {actions.map((action, index) => (
                  <Button
                    key={index}
                    size="lg"
                    variant={action.variant || "default"}
                    className={
                      action.variant === "outline"
                        ? "border-2 border-white text-white hover:bg-white hover:text-teal-700 font-semibold text-lg px-8 py-4"
                        : "bg-white text-teal-700 hover:bg-slate-100 font-semibold text-lg px-8 py-4"
                    }
                    onClick={action.onClick}
                  >
                    {action.label}
                    {action.icon && <span className="ml-2">{action.icon}</span>}
                  </Button>
                ))}
              </div>
            )}
          </div>
          {children && (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-10 border border-white/20">
              {children}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}