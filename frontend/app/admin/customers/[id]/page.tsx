"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { AdminLayout } from "@/components/layout/enhanced-admin-layout";
import AdminPageHeader from "@/components/ui/admin-page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCustomer, useDeleteCustomer } from "@/features/customers/hooks";

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = parseInt(params.id as string);
  
  const { data: customer, isLoading, error } = useCustomer(customerId);
  const deleteCustomer = useDeleteCustomer();

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this customer? This action cannot be undone.")) {
      try {
        await deleteCustomer.mutateAsync(customerId);
        router.push("/admin/customers");
      } catch (error) {
        console.error("Failed to delete customer:", error);
      }
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <AdminPageHeader
            title="Customer Details"
            subtitle="Customer Management"
            description="Loading customer information..."
            compact
          />
          <div className="px-6">
            <Card className="p-8 text-center">
              <div className="text-gray-500">Loading customer details...</div>
            </Card>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !customer) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <AdminPageHeader
            title="Customer Not Found"
            subtitle="Customer Management"
            description="The requested customer could not be found"
            compact
          />
          <div className="px-6">
            <Card className="p-8 text-center">
              <div className="text-red-600 mb-4">Customer not found or failed to load.</div>
              <Link href="/admin/customers">
                <Button>Back to Customers</Button>
              </Link>
            </Card>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const headerActions = (
    <div className="flex gap-3">
      <Link href={`/admin/customers/${customerId}/edit`}>
        <Button className="bg-white text-[var(--color-sanvi-primary-700)] hover:bg-gray-100">
          Edit Customer
        </Button>
      </Link>
      <Button 
        variant="outline"
        onClick={handleDelete}
        disabled={deleteCustomer.isPending}
        className="border-red-300 text-red-600 hover:bg-red-50"
      >
        {deleteCustomer.isPending ? "Deleting..." : "Delete"}
      </Button>
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title={customer.name}
          subtitle="Customer Details"
          description={`Customer ID: ${customer.id} • Created: ${new Date(customer.createdAt).toLocaleDateString()}`}
          actions={headerActions}
          compact
        />

        <div className="px-6 space-y-6">
          {/* Basic Information */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Customer Name</label>
                <p className="text-gray-900">{customer.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Company</label>
                <p className="text-gray-900">{customer.company || "—"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
                <p className="text-gray-900">{customer.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
                <p className="text-gray-900">{customer.phone || "—"}</p>
              </div>
            </div>
          </Card>

          {/* Address Information */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h3>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Address</label>
              <p className="text-gray-900">{customer.address || "No address provided"}</p>
            </div>
          </Card>

          {/* Account Information */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Customer ID</label>
                <p className="text-gray-900">{customer.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Account Created</label>
                <p className="text-gray-900">{new Date(customer.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Last Updated</label>
                <p className="text-gray-900">{new Date(customer.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <Link href={`/admin/quotations/new?customerId=${customer.id}`}>
                <Button>Create Quotation</Button>
              </Link>
              <Link href={`/admin/orders/new?customerId=${customer.id}`}>
                <Button variant="outline">Create Order</Button>
              </Link>
              <Button variant="outline">View Order History</Button>
              <Button variant="outline">Send Email</Button>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}