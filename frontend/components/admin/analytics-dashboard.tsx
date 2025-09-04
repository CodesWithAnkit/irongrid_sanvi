"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { analyticsService, type AnalyticsQuery } from "../../lib/services/analytics";
import { MetricCard } from "./metric-card";
import { DashboardChart } from "./dashboard-chart";
import { RecentActivity } from "./recent-activity";
import { QuickActions } from "./quick-actions";

export interface AnalyticsDashboardProps {
  refreshInterval?: number;
  className?: string;
  dateRange?: AnalyticsQuery;
}

export function AnalyticsDashboard({ 
  refreshInterval = 30000, 
  className,
  dateRange = { dateRange: 'LAST_30_DAYS' }
}: AnalyticsDashboardProps) {
  const { data: metrics, isLoading, error, refetch } = useQuery({
    queryKey: ['analytics-dashboard', dateRange],
    queryFn: () => analyticsService.getDashboardMetrics(dateRange),
    refetchInterval: refreshInterval,
    staleTime: 10000,
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

  const formatNumber = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-lg font-medium text-red-800">Failed to load analytics data</h3>
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
      {/* Key Business Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Quotations"
          value={formatNumber(metrics?.quotationMetrics.totalQuotations || 0)}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          trend={{ 
            value: `${formatPercentage(metrics?.quotationMetrics.conversionRate || 0)} conversion rate`, 
            isPositive: (metrics?.quotationMetrics.conversionRate || 0) > 20 
          }}
          isLoading={isLoading}
        />

        <MetricCard
          title="Active Customers"
          value={formatNumber(metrics?.customerMetrics.activeCustomers || 0)}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          subtitle={`${formatNumber(metrics?.customerMetrics.newCustomers || 0)} new this period`}
          iconBgColor="bg-blue-100"
          iconTextColor="text-blue-600"
          isLoading={isLoading}
        />

        <MetricCard
          title="Total Revenue"
          value={formatCurrency(metrics?.revenueMetrics.totalRevenue || 0)}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          }
          trend={{
            value: `${formatPercentage(metrics?.revenueMetrics.monthlyGrowth || 0)} growth`,
            isPositive: (metrics?.revenueMetrics.monthlyGrowth || 0) > 0
          }}
          iconBgColor="bg-green-100"
          iconTextColor="text-green-600"
          isLoading={isLoading}
        />

        <MetricCard
          title="Avg. Response Time"
          value={`${metrics?.quotationMetrics.responseTime || 0}h`}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          trend={{ 
            value: "Within target", 
            isPositive: (metrics?.quotationMetrics.responseTime || 0) <= 24 
          }}
          iconBgColor="bg-purple-100"
          iconTextColor="text-purple-600"
          isLoading={isLoading}
        />
      </div>

      {/* Revenue and Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
          <div className="h-64">
            {isLoading ? (
              <div className="animate-pulse h-full bg-gray-200 rounded"></div>
            ) : (
              <DashboardChart
                title=""
                type="line"
                data={{
                  revenueByMonth: metrics?.revenueMetrics.revenueByMonth || [],
                  forecastedRevenue: metrics?.revenueMetrics.forecastedRevenue || 0,
                }}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quotation Status</h3>
          <div className="h-64">
            {isLoading ? (
              <div className="animate-pulse h-full bg-gray-200 rounded"></div>
            ) : (
              <DashboardChart
                title=""
                type="doughnut"
                data={{
                  statusBreakdown: metrics?.quotationMetrics.statusBreakdown || {},
                }}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </div>

      {/* Top Customers and Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Customers</h3>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {metrics?.customerMetrics.topCustomers.slice(0, 5).map((customer, index) => (
                <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className="font-medium text-gray-900">{customer.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{formatCurrency(customer.totalValue)}</div>
                    <div className="text-sm text-gray-500">{customer.quotationCount} quotations</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {metrics?.revenueMetrics.topProducts.slice(0, 5).map((product, index) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className="font-medium text-gray-900">{product.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{formatCurrency(product.revenue)}</div>
                    <div className="text-sm text-gray-500">{product.quantity} units</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* System Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="System Uptime"
          value={formatPercentage(metrics?.performanceMetrics.systemUptime || 0)}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          trend={{ value: "Excellent", isPositive: true }}
          iconBgColor="bg-green-100"
          iconTextColor="text-green-600"
          isLoading={isLoading}
        />

        <MetricCard
          title="API Response"
          value={`${metrics?.performanceMetrics.apiResponseTime || 0}ms`}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
          trend={{ 
            value: "Fast", 
            isPositive: (metrics?.performanceMetrics.apiResponseTime || 0) < 200 
          }}
          iconBgColor="bg-blue-100"
          iconTextColor="text-blue-600"
          isLoading={isLoading}
        />

        <MetricCard
          title="Email Delivery"
          value={formatPercentage(metrics?.performanceMetrics.emailDeliveryRate || 0)}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
          trend={{ value: "Reliable", isPositive: true }}
          iconBgColor="bg-yellow-100"
          iconTextColor="text-yellow-600"
          isLoading={isLoading}
        />

        <MetricCard
          title="Avg. Quote Time"
          value={`${metrics?.performanceMetrics.averageQuotationTime || 0}h`}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          trend={{ 
            value: "Efficient", 
            isPositive: (metrics?.performanceMetrics.averageQuotationTime || 0) <= 4 
          }}
          iconBgColor="bg-purple-100"
          iconTextColor="text-purple-600"
          isLoading={isLoading}
        />
      </div>

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity isLoading={isLoading} />
        <QuickActions />
      </div>
    </div>
  );
}