"use client";

import * as React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import type { BusinessMetrics } from './dashboard';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

export interface DashboardChartProps {
  title: string;
  type: 'line' | 'doughnut' | 'bar';
  data?: BusinessMetrics;
  isLoading?: boolean;
  className?: string;
}

export function DashboardChart({ title, type, data, isLoading = false, className }: DashboardChartProps) {
  const getChartData = () => {
    if (!data) return null;

    switch (type) {
      case 'line':
        return {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [
            {
              label: 'Revenue (₹)',
              data: [2200000, 2400000, 2100000, 2600000, 2800000, 2850000],
              borderColor: 'rgb(37, 99, 235)',
              backgroundColor: 'rgba(37, 99, 235, 0.1)',
              tension: 0.4,
            },
            {
              label: 'Forecast (₹)',
              data: [null, null, null, null, null, 2850000, 3000000, 3200000],
              borderColor: 'rgb(249, 115, 22)',
              backgroundColor: 'rgba(249, 115, 22, 0.1)',
              borderDash: [5, 5],
              tension: 0.4,
            },
          ],
        };

      case 'doughnut':
        return {
          labels: ['Sent', 'Draft', 'Approved', 'Expired'],
          datasets: [
            {
              data: [
                data.quotationMetrics.totalQuotations * 0.4, // Sent
                data.quotationMetrics.pendingQuotations, // Draft
                data.quotationMetrics.convertedQuotations, // Approved
                data.quotationMetrics.totalQuotations * 0.1, // Expired
              ],
              backgroundColor: [
                'rgb(59, 130, 246)', // Blue for Sent
                'rgb(251, 191, 36)', // Yellow for Draft
                'rgb(34, 197, 94)', // Green for Approved
                'rgb(239, 68, 68)', // Red for Expired
              ],
              borderWidth: 2,
              borderColor: '#ffffff',
            },
          ],
        };

      case 'bar':
        return {
          labels: data.revenueMetrics.topProducts.map(p => p.name.substring(0, 15) + '...'),
          datasets: [
            {
              label: 'Revenue (₹)',
              data: data.revenueMetrics.topProducts.map(p => p.revenue),
              backgroundColor: 'rgba(37, 99, 235, 0.8)',
              borderColor: 'rgb(37, 99, 235)',
              borderWidth: 1,
            },
          ],
        };

      default:
        return null;
    }
  };

  const getChartOptions = () => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: false,
        },
      },
    };

    switch (type) {
      case 'line':
        return {
          ...baseOptions,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value: any) {
                  return '₹' + (value / 1000000).toFixed(1) + 'M';
                },
              },
            },
          },
        };

      case 'doughnut':
        return {
          ...baseOptions,
          plugins: {
            ...baseOptions.plugins,
            tooltip: {
              callbacks: {
                label: function(context: any) {
                  const label = context.label || '';
                  const value = context.parsed;
                  const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${label}: ${value} (${percentage}%)`;
                },
              },
            },
          },
        };

      case 'bar':
        return {
          ...baseOptions,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value: any) {
                  return '₹' + (value / 1000000).toFixed(1) + 'M';
                },
              },
            },
          },
        };

      default:
        return baseOptions;
    }
  };

  const renderChart = () => {
    const chartData = getChartData();
    const options = getChartOptions();

    if (!chartData) return null;

    switch (type) {
      case 'line':
        return <Line data={chartData} options={options} />;
      case 'doughnut':
        return <Doughnut data={chartData} options={options} />;
      case 'bar':
        return <Bar data={chartData} options={options} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className || ''}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className || ''}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center gap-2">
          <button className="text-sm text-gray-500 hover:text-gray-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          <button className="text-sm text-gray-500 hover:text-gray-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>
      <div className="h-64">
        {renderChart()}
      </div>
    </div>
  );
}