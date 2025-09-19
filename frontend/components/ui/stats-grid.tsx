"use client";

interface Stat {
  value: string;
  label: string;
  description?: string;
}

interface StatsGridProps {
  stats: Stat[];
  columns?: 2 | 3 | 4;
  className?: string;
  variant?: 'link' | 'outline' | 'primary' | 'secondary' | 'ghost' | 'destructive' | undefined;
}

export default function StatsGrid({
  stats,
  columns = 4,
  className = "",
  variant = "outline",
}: StatsGridProps) {
  const gridCols = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  if (variant === "outline") {
    return (
      <div className={`grid ${gridCols[columns]} gap-8 text-center ${className}`}>
        {stats.map((stat, index) => (
          <div key={index}>
            <div className="text-4xl md:text-5xl font-bold mb-3">{stat.value}</div>
            <div className="text-teal-200 text-lg">{stat.label}</div>
            {stat.description && (
              <div className="text-teal-100 text-sm mt-1">{stat.description}</div>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (variant === "destructive") {
    return (
      <div className={`grid ${gridCols[columns]} gap-8 ${className}`}>
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-lg p-8 text-center border border-slate-200">
            <div className="text-4xl md:text-5xl font-bold text-teal-600 mb-3">
              {stat.value}
            </div>
            <div className="text-slate-800 text-lg font-semibold">{stat.label}</div>
            {stat.description && (
              <div className="text-slate-600 text-sm mt-2">{stat.description}</div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid ${gridCols[columns]} gap-8 text-center ${className}`}>
      {stats.map((stat, index) => (
        <div key={index}>
          <div className="text-4xl md:text-5xl font-bold text-slate-800 mb-3">
            {stat.value}
          </div>
          <div className="text-slate-600 text-lg">{stat.label}</div>
          {stat.description && (
            <div className="text-slate-500 text-sm mt-1">{stat.description}</div>
          )}
        </div>
      ))}
    </div>
  );
}