"use client";

import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  features?: string[];
  className?: string;
  iconColor?: string;
  children?: ReactNode;
}

export default function FeatureCard({
  icon: Icon,
  title,
  description,
  features = [],
  className = "",
  iconColor = "text-teal-600",
  children,
}: FeatureCardProps) {
  return (
    <div className={`text-center group hover:transform hover:scale-105 transition-all duration-300 ${className}`}>
      <div className="w-20 h-20 bg-gradient-to-r from-teal-100 to-teal-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-lg transition-shadow">
        <Icon className={`w-10 h-10 ${iconColor}`} />
      </div>
      <h3 className="text-2xl font-bold text-slate-800 mb-4">{title}</h3>
      <p className="text-slate-600 text-lg leading-relaxed mb-4">{description}</p>
      
      {features.length > 0 && (
        <ul className="text-left space-y-2 mb-4">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center text-slate-700">
              <span className="w-2 h-2 bg-teal-500 rounded-full mr-3 flex-shrink-0"></span>
              {feature}
            </li>
          ))}
        </ul>
      )}
      
      {children}
    </div>
  );
}