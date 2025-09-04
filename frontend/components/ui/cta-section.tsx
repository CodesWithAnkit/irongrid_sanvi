"use client";

import { ReactNode } from "react";
import { Button } from "./button";

interface CTAAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "outline" | "secondary";
  icon?: ReactNode;
}

interface CTASectionProps {
  title: string;
  description: string;
  actions?: CTAAction[];
  backgroundGradient?: string;
  className?: string;
}

export default function CTASection({
  title,
  description,
  actions = [],
  backgroundGradient = "from-teal-600 to-teal-800",
  className = "",
}: CTASectionProps) {
  return (
    <section className={`py-24 bg-gradient-to-r ${backgroundGradient} ${className}`}>
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
          {title}
        </h2>
        <p className="text-xl md:text-2xl text-teal-100 mb-12 max-w-4xl mx-auto leading-relaxed">
          {description}
        </p>
        {actions.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            {actions.map((action, index) => (
              <Button
                key={index}
                size="lg"
                variant={action.variant}
                className={
                  action.variant === "outline"
                    ? "border-2 border-white text-white hover:bg-white hover:text-teal-600 font-semibold text-lg px-10 py-4"
                    : "bg-white text-teal-600 hover:bg-slate-100 font-semibold text-lg px-10 py-4"
                }
                onClick={action.onClick}
              >
                {action.icon && <span className="mr-2">{action.icon}</span>}
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}