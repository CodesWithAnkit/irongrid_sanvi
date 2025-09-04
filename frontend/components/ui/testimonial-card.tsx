"use client";

import { Star } from "lucide-react";

interface TestimonialCardProps {
  name: string;
  company: string;
  rating: number;
  text: string;
  avatar?: string;
  className?: string;
}

export default function TestimonialCard({
  name,
  company,
  rating,
  text,
  avatar,
  className = "",
}: TestimonialCardProps) {
  return (
    <div className={`bg-slate-50 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300 border border-slate-200 ${className}`}>
      <div className="flex items-center mb-6">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`w-6 h-6 ${
              i < rating ? "text-yellow-400 fill-current" : "text-slate-300"
            }`} 
          />
        ))}
      </div>
      <p className="text-slate-700 mb-6 text-lg leading-relaxed italic">
        "{text}"
      </p>
      <div className="flex items-center">
        {avatar ? (
          <img 
            src={avatar} 
            alt={name} 
            className="w-12 h-12 rounded-full mr-4 object-cover"
          />
        ) : (
          <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mr-4">
            <span className="text-teal-600 font-semibold text-lg">
              {name.charAt(0)}
            </span>
          </div>
        )}
        <div>
          <div className="font-bold text-slate-800 text-lg">{name}</div>
          <div className="text-teal-600 font-medium">{company}</div>
        </div>
      </div>
    </div>
  );
}