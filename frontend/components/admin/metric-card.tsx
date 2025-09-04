import { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  subtitle?: string;
  iconBgColor?: string;
  iconTextColor?: string;
  isLoading?: boolean;
}

export function MetricCard({ 
  title, 
  value, 
  icon, 
  trend, 
  subtitle, 
  iconBgColor = "bg-[var(--color-sanvi-primary-100)]",
  iconTextColor = "text-[var(--color-sanvi-primary-700)]",
  isLoading = false
}: MetricCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
        </div>
        <div className="mt-4">
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 ${iconBgColor} rounded-lg`}>
          <div className={`w-6 h-6 ${iconTextColor}`}>
            {icon}
          </div>
        </div>
      </div>
      <div className="mt-4">
        {trend ? (
          <div className="flex items-center">
            <svg className={`w-4 h-4 mr-1 ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={trend.isPositive ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} />
            </svg>
            <span className={`text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.value}
            </span>
          </div>
        ) : (
          <span className="text-sm text-gray-600">{subtitle}</span>
        )}
      </div>
    </div>
  );
}