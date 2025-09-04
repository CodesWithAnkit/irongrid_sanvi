"use client";

import * as React from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/layout/enhanced-admin-layout";
import AdminPageHeader from "@/components/ui/admin-page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCustomers } from "@/features/customers/hooks";
import { useQuotations } from "@/features/quotations/hooks";

export default function DashboardPage() {
  const { data: customers } = useCustomers();
  const { data: quotations } = useQuotations();

  // Calculate dashboard metrics
  const metrics = React.useMemo(() => {
    const totalCustomers = customers?.length || 0;
    const totalQuotations = quotations?.length || 0;
    
    const quotationsByStatus = quotations?.reduce((acc, quotation) => {
      acc[quotation.status] = (acc[quotation.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const totalQuotationValue = quotations?.reduce((sum, quotation) => {
      return sum + parseFloat(quotation.total);
    }, 0) || 0;

    const recentCustomers = customers?.slice(0, 5) || [];
    const recentQuotations = quotations?.slice(0, 5) || [];

    return {
      totalCustomers,
      totalQuotations,
      quotationsByStatus,
      totalQuotationValue,
      recentCustomers,
      recentQuotations
    };
  }, [customers, quotations]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT": return "bg-gray-100 text-gray-800";
      case "SENT": return "bg-blue-100 text-blue-800";
      case "ACCEPTED": return "bg-green-100 text-green-800";
      case "REJECTED": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const headerActions = (
    <div className="flex gap-3">
      <Link href="/admin/quotations/new">
        <Button className="bg-white text-[var(--color-sanvi-primary-700)] hover:bg-gray-100">
          Create Quotation
        </Button>
      </Link>
      <Link href="/admin/customers/new">
        <Button variant="outline" className="border-white text-white hover:bg-white hover:text-[var(--color-sanvi-primary-700)]">
          Add Customer
        </Button>
      </Link>
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title="Business Dashboard"
          subtitle="Overview"
          description="Monitor your business performance and key metrics"
          actions={headerActions}
          compact
        />

        <div className="px-6 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Customers</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalCustomers}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <Link href="/admin/customers" className="text-sm text-blue-600 hover:text-blue-800">
                  View all customers →
                </Link>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Quotations</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalQuotations}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <Link href="/admin/quotations" className="text-sm text-green-600 hover:text-green-800">
                  View all quotations →
                </Link>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Quotation Value</p>
                  <p className="text-2xl font-bold text-gray-900">₹{metrics.totalQuotationValue.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-gray-500">Total value of all quotations</span>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Accepted Quotations</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.quotationsByStatus.ACCEPTED || 0}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-gray-500">Successfully closed deals</span>
              </div>
            </Card>
          </div>

          {/* Quotation Status Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quotation Status</h3>
              <div className="space-y-3">
                {Object.entries(metrics.quotationsByStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
                        {status}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                ))}
                {Object.keys(metrics.quotationsByStatus).length === 0 && (
                  <p className="text-gray-500 text-sm">No quotations yet</p>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link href="/admin/quotations/new">
                  <Button className="w-full justify-start">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create New Quotation
                  </Button>
                </Link>
                <Link href="/admin/customers/new">
                  <Button variant="outline" className="w-full justify-start">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Add New Customer
                  </Button>
                </Link>
                <Link href="/admin/products/new">
                  <Button variant="outline" className="w-full justify-start">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    Add New Product
                  </Button>
                </Link>
              </div>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Customers</h3>
                <Link href="/admin/customers" className="text-sm text-blue-600 hover:text-blue-800">
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {metrics.recentCustomers.map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[var(--color-sanvi-primary-100)] rounded-full flex items-center justify-center">
                        <span className="text-[var(--color-sanvi-primary-700)] font-medium text-xs">
                          {customer.name[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                        <p className="text-xs text-gray-500">{customer.email}</p>
                      </div>
                    </div>
                    <Link 
                      href={`/admin/customers/${customer.id}`}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      View
                    </Link>
                  </div>
                ))}
                {metrics.recentCustomers.length === 0 && (
                  <p className="text-gray-500 text-sm">No customers yet</p>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Quotations</h3>
                <Link href="/admin/quotations" className="text-sm text-blue-600 hover:text-blue-800">
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {metrics.recentQuotations.map((quotation) => (
                  <div key={quotation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="text-green-700 font-medium text-xs">Q</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{quotation.quotationNumber}</p>
                        <p className="text-xs text-gray-500">₹{parseFloat(quotation.total).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(quotation.status)}`}>
                        {quotation.status}
                      </span>
                      <Link 
                        href={`/admin/quotations/${quotation.id}`}
                        className="block text-xs text-blue-600 hover:text-blue-800 mt-1"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))}
                {metrics.recentQuotations.length === 0 && (
                  <p className="text-gray-500 text-sm">No quotations yet</p>
                )}
              </div>
            </Card>
          </div>

          {/* System Status */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Customers API</p>
                  <p className="text-xs text-gray-500">Operational</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Quotations API</p>
                  <p className="text-xs text-gray-500">Operational</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Products API</p>
                  <p className="text-xs text-gray-500">Scaffold Only</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}