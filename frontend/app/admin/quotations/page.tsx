"use client";

import * as React from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/layout/enhanced-admin-layout";
import AdminPageHeader from "@/components/ui/admin-page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useQuotations, useDeleteQuotation } from "@/features/quotations/hooks";
import { Quotation } from "@/features/quotations/types";

export default function QuotationsPage() {
  const { data: quotations, isLoading, error } = useQuotations();
  const deleteQuotation = useDeleteQuotation();

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this quotation?")) {
      try {
        await deleteQuotation.mutateAsync(id);
      } catch (error) {
        console.error("Failed to delete quotation:", error);
      }
    }
  };

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
    <div className="flex gap-2">
      <Link href="/admin/quotations/builder">
        <Button className="bg-[var(--color-sanvi-primary-600)] hover:bg-[var(--color-sanvi-primary-700)] text-white">
          Quick Builder
        </Button>
      </Link>
      <Link href="/admin/quotations/new">
        <Button variant="outline" className="text-[var(--color-sanvi-primary-700)] hover:bg-gray-100">
          Create New
        </Button>
      </Link>
    </div>
  );

  return (
  <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title="Quotation Management"
          subtitle="Sales Operations"
          description="Create and manage quotations for your customers"
          actions={headerActions}
          compact
        />

        <div className="px-6">
          {isLoading && (
            <Card className="p-8 text-center">
              <div className="text-gray-500">Loading quotations...</div>
            </Card>
          )}

          {error && (
            <Card className="p-8 text-center">
              <div className="text-red-600">Failed to load quotations. Please try again.</div>
            </Card>
          )}

          {quotations && quotations.length === 0 && (
            <Card className="p-8 text-center">
              <div className="text-gray-500 mb-4">No quotations found</div>
              <Link href="/admin/quotations/new">
                <Button>Create Your First Quotation</Button>
              </Link>
            </Card>
          )}

          {quotations && quotations.length > 0 && (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quotation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valid Until
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {quotations.map((quotation: Quotation) => (
                      <tr key={quotation.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-[var(--color-sanvi-primary-100)] rounded-lg flex items-center justify-center">
                              <span className="text-[var(--color-sanvi-primary-700)] font-medium text-xs">
                                QT
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {quotation.quotationNumber}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {quotation.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {quotation.customer?.name || "—"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {quotation.customer?.email || "—"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{parseFloat(quotation.total).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(quotation.status)}`}>
                            {quotation.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(quotation.validUntil).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <Link 
                            href={`/admin/quotations/${quotation.id}`}
                            className="text-[var(--color-sanvi-primary-600)] hover:text-[var(--color-sanvi-primary-900)]"
                          >
                            View
                          </Link>
                          <Link 
                            href={`/admin/quotations/${quotation.id}/edit`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(quotation.id)}
                            className="text-red-600 hover:text-red-900"
                            disabled={deleteQuotation.isPending}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>
  </AdminLayout>
  );
}