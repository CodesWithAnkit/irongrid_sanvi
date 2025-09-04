"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/layout/enhanced-admin-layout";
import AdminPageHeader from "@/components/ui/admin-page-header";
import { CustomerForm } from "@/components/forms/customer-form";
import { Card } from "@/components/ui/card";

export default function NewCustomerPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/admin/customers");
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title="Add New Customer"
          subtitle="Customer Management"
          description="Create a new customer record for Sanvi Machinery"
          compact
        />

        <div className="px-6">
          <Card className="p-6">
            <CustomerForm
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}