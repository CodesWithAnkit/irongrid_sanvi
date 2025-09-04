"use client";

import { Button } from "./button";

interface ProductCardProps {
  name: string;
  price: number;
  description: string;
  category?: string;
  image?: string;
  onGetQuote?: () => void;
  onViewDetails?: () => void;
  className?: string;
}

export default function ProductCard({
  name,
  price,
  description,
  category,
  image,
  onGetQuote,
  onViewDetails,
  className = "",
}: ProductCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className={`bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden hover:shadow-2xl transition-shadow duration-300 group ${className}`}>
      <div className="h-64 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center group-hover:from-teal-50 group-hover:to-teal-100 transition-colors duration-300">
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover" />
        ) : (
          <svg className="w-16 h-16 text-slate-400 group-hover:text-teal-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        )}
      </div>
      <div className="p-8">
        {category && (
          <div className="mb-2">
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-teal-100 text-teal-800">
              {category}
            </span>
          </div>
        )}
        <h3 className="text-xl font-bold text-slate-800 mb-4 line-clamp-2">{name}</h3>
        <p className="text-slate-600 mb-6 leading-relaxed line-clamp-2">{description}</p>
        <div className="flex items-center justify-between mb-6">
          <span className="text-3xl font-bold text-teal-600">{formatCurrency(price)}</span>
        </div>
        <div className="flex gap-2">
          {onViewDetails && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 border-teal-600 text-teal-600 hover:bg-teal-50"
              onClick={onViewDetails}
            >
              View Details
            </Button>
          )}
          {onGetQuote && (
            <Button 
              size="sm" 
              className="flex-1 bg-teal-600 hover:bg-teal-700"
              onClick={onGetQuote}
            >
              Get Quote
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}