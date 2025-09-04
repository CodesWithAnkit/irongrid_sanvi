"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { MetricCard } from "./metric-card";
import { DashboardChart } from "./dashboard-chart";
import { RecentActivity } from "./recent-activity";
import { QuickActions } from "./quick-actions";


export interface BusinessMetrics {
  quotationMetrics: {
    totalQuotations: number;
    conversionRate: number;
    averageValue: number;
    responseTime: number;
    pendingQuotations: number;
    convertedQuotations: number;
  };
  customerMetrics: {
    totalCustomers: number;
    activeCustomers: number;
    newCustomers: number;
    customerLifetimeValue: number;
  };
  revenueMetrics: {
    totalRevenue: number;
    monthlyGrowth: number;
    forecastedRevenue: number;
    topProducts: Array<{
      id: string;
      name: string;
      revenue: number;
      growth: number;
    }>;
  };
  systemMetrics: {
    apiResponseTime: number;
    uptime: number;
    errorRate: number;
  };
}

export interface DashboardProps {
  refreshInterval?: number;
  className?: string;
}

// Mock API function - in real app this would be an actual API call
const fetchDashboardMetrics = async (): Promise<BusinessMetrics> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    quotationMetrics: {
      totalQuotations: 156,
      conversionRate: 28.8,
      averageValue: 125000,
      responseTime: 2.3,
      pendingQuotations: 23,
      convertedQuotations: 45,
    },
    customerMetrics: {
      totalCustomers: 89,
      activeCustomers: 67,
      newCustomers: 12,
      customerLifetimeValue: 450000,
    },
    revenueMetrics: {
      totalRevenue: 2850000,
      monthlyGrowth: 12.5,
      forecastedRevenue: 3200000,
      topProducts: [
        { id: '1', name: 'Industrial Lathe Machine', revenue: 850000, growth: 15.2 },
        { id: '2', name: 'CNC Milling Machine', revenue: 720000, growth: 8.7 },
        { id: '3', name: 'Hydraulic Press', revenue: 650000, growth: 22.1 },
      ],
    },
    systemMetrics: {
      apiResponseTime: 180,
      uptime: 99.8,
      errorRate: 0.2,
    },
  };
};

export function Dashboard({ refreshInterval = 30000, className }: DashboardProps) {
  const { data: metrics, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: fetchDashboardMetrics,
    refetchInterval: refreshInterval,
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-lg font-medium text-red-800">Failed to load dashboard data</h3>
            <p className="text-red-600 mt-1">Please try refreshing the page or contact support if the issue persists.</p>
            <button
              onClick={() => refetch()}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className || ''}`}>
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Quotations"
          value={metrics?.quotationMetrics.totalQuotations || 0}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          trend={{ value: "+12% from last month", isPositive: true }}
          isLoading={isLoading}
        />

        <MetricCard
          title="Pending Approval"
          value={metrics?.quotationMetrics.pendingQuotations || 0}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          subtitle="Requires immediate attention"
          iconBgColor="bg-[var(--color-sanvi-secondary-100)]"
          iconTextColor="text-[var(--color-sanvi-secondary-500)]"
          isLoading={isLoading}
        />

        <MetricCard
          title="Conversion Rate"
          value={formatPercentage(metrics?.quotationMetrics.conversionRate || 0)}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
          trend={{ value: "+5.2% improvement", isPositive: true }}
          iconBgColor="bg-green-100"
          iconTextColor="text-green-600"
          isLoading={isLoading}
        />

        <MetricCard
          title="Monthly Revenue"
          value={formatCurrency(metrics?.revenueMetrics.totalRevenue || 0)}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          }
          trend={{
            value: `+${formatPercentage(metrics?.revenueMetrics.monthlyGrowth || 0)} growth`,
            isPositive: true
          }}
          isLoading={isLoading}
        />
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardChart
          title="Revenue Trend"
          type="line"
          data={metrics}
          isLoading={isLoading}
        />

        <DashboardChart
          title="Quotation Status Distribution"
          type="doughnut"
          data={metrics}
          isLoading={isLoading}
        />
      </div>

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity isLoading={isLoading} />
        <QuickActions />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="API Response Time"
          value={`${metrics?.systemMetrics.apiResponseTime || 0}ms`}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
          trend={{ value: "Excellent performance", isPositive: true }}
          iconBgColor="bg-blue-100"
          iconTextColor="text-blue-600"
          isLoading={isLoading}
        />

        <MetricCard
          title="System Uptime"
          value={formatPercentage(metrics?.systemMetrics.uptime || 0)}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          trend={{ value: "System stable", isPositive: true }}
          iconBgColor="bg-green-100"
          iconTextColor="text-green-600"
          isLoading={isLoading}
        />

        <MetricCard
          title="Error Rate"
          value={formatPercentage(metrics?.systemMetrics.errorRate || 0)}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
          trend={{ value: "Within acceptable range", isPositive: true }}
          iconBgColor="bg-yellow-100"
          iconTextColor="text-yellow-600"
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}