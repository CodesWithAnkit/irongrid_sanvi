"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { AdminLayout } from "@/components/layout/enhanced-admin-layout";
import AdminPageHeader from "@/components/ui/admin-page-header";
import { CustomerForm } from "@/components/forms/customer-form";
import { Card } from "@/components/ui/card";
import { useCustomer } from "@/features/customers/hooks";

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = parseInt(params.id as string);
  
  const { data: customer, isLoading, error } = useCustomer(customerId);

  const handleSuccess = () => {
    router.push("/admin/customers");
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <AdminPageHeader
            title="Edit Customer"
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
            title="Edit Customer"
            subtitle="Customer Management"
            description="Customer not found"
            compact
          />
          <div className="px-6">
            <Card className="p-8 text-center">
              <div className="text-red-600 mb-4">Failed to load customer details.</div>
              <button 
                onClick={() => router.back()}
                className="text-blue-600 hover:text-blue-800"
              >
                Go Back
              </button>
            </Card>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Transform customer data to form format
  const initialData = {
    companyName: customer.company || "",
    contactPerson: customer.name,
    email: customer.email,
    phone: customer.phone || "",
    address: customer.address || "",
    city: "",
    state: "",
    zipCode: "",
    country: "India",
    customerType: "wholesale" as const,
    businessCategory: "",
    taxId: "",
    creditLimit: 0,
    paymentTerms: "net30",
    preferredCommunication: "email" as const,
    newsletter: false,
    specialInstructions: "",
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title={`Edit ${customer.name}`}
          subtitle="Customer Management"
          description="Update customer information for Sanvi Machinery"
          compact
        />

        <div className="px-6">
          <Card className="p-6">
            <CustomerForm
              initialData={initialData}
              customerId={customerId}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}