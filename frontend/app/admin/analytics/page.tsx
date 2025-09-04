"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "../../../components/admin/page-header";
import { AnalyticsDashboard } from "../../../components/admin/analytics-dashboard";
import { DateRangeSelector } from "../../../components/admin/date-range-selector";
import { analyticsService, type AnalyticsQuery } from "../../../lib/services/analytics";

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = React.useState<AnalyticsQuery>({
    dateRange: 'LAST_30_DAYS'
  });

  // Fetch additional analytics data
  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['sales-performance', dateRange],
    queryFn: () => analyticsService.getSalesPerformance(dateRange),
    staleTime: 10000,
  });

  const { data: clvData, isLoading: clvLoading } = useQuery({
    queryKey: ['customer-lifetime-value', dateRange],
    queryFn: () => analyticsService.getCustomerLifetimeValue(dateRange),
    staleTime: 10000,
  });

  const { data: productData, isLoading: productLoading } = useQuery({
    queryKey: ['product-performance', dateRange],
    queryFn: () => analyticsService.getProductPerformance(dateRange),
    staleTime: 10000,
  });

  const { data: forecastData, isLoading: forecastLoading } = useQuery({
    queryKey: ['revenue-forecasting', dateRange],
    queryFn: () => analyticsService.getRevenueForecasting(dateRange),
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Business Analytics"
        description="Comprehensive insights into your business performance, sales metrics, and growth trends."
      />

      {/* Date Range Selector */}
      <DateRangeSelector
        value={dateRange}
        onChange={setDateRange}
      />

      {/* Main Analytics Dashboard */}
      <AnalyticsDashboard
        dateRange={dateRange}
        refreshInterval={60000} // Refresh every minute
      />

      {/* Sales Performance Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Sales Performance</h2>
        
        {salesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(salesData?.totalSales || 0)}
              </div>
              <div className="text-sm text-gray-600">Total Sales</div>
              <div className={`text-sm ${(salesData?.salesGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(salesData?.salesGrowth || 0)} growth
              </div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(salesData?.averageDealSize || 0)}
              </div>
              <div className="text-sm text-gray-600">Average Deal Size</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {salesData?.salesByUser.length || 0}
              </div>
              <div className="text-sm text-gray-600">Active Sales Reps</div>
            </div>
          </div>
        )}

        {/* Sales by User Table */}
        {!salesLoading && salesData?.salesByUser && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sales Rep
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Sales
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quotations
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conversion Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salesData.salesByUser.map((user) => (
                  <tr key={user.userId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.userName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(user.totalSales)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.quotationCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPercentage(user.conversionRate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Lifetime Value Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Customer Lifetime Value</h2>
        
        {clvLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center p-4 bg-indigo-50 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">
                  {formatCurrency(clvData?.averageClv || 0)}
                </div>
                <div className="text-sm text-gray-600">Average CLV</div>
                <div className={`text-sm ${(clvData?.clvGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(clvData?.clvGrowth || 0)} growth
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Top Value Customers</h4>
                {clvData?.topValueCustomers.slice(0, 3).map((customer, index) => (
                  <div key={customer.customerId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium">{customer.customerName}</span>
                    <span className="text-sm text-gray-600">{formatCurrency(customer.clv)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Product Performance Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Product Performance</h2>
        
        {productLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity Sold
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quotations
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {productData?.topPerformingProducts.slice(0, 10).map((product) => (
                  <tr key={product.productId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.productName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(product.revenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.quantitySold}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.quotationCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Revenue Forecasting Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Revenue Forecasting</h2>
        
        {forecastLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(forecastData?.scenarios.optimistic || 0)}
              </div>
              <div className="text-sm text-gray-600">Optimistic Scenario</div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(forecastData?.scenarios.realistic || 0)}
              </div>
              <div className="text-sm text-gray-600">Realistic Scenario</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(forecastData?.scenarios.pessimistic || 0)}
              </div>
              <div className="text-sm text-gray-600">Conservative Scenario</div>
            </div>
          </div>
        )}

        {forecastData?.trendAnalysis && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Trend Analysis</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Trend: </span>
                <span className={`font-medium ${
                  forecastData.trendAnalysis.trend === 'increasing' ? 'text-green-600' :
                  forecastData.trendAnalysis.trend === 'decreasing' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {forecastData.trendAnalysis.trend}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Growth Rate: </span>
                <span className="font-medium">{formatPercentage(forecastData.trendAnalysis.growthRate)}</span>
              </div>
              <div>
                <span className="text-gray-600">Seasonality: </span>
                <span className="font-medium">{forecastData.trendAnalysis.seasonality ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}