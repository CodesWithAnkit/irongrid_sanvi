"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminLayout } from "@/components/layout/enhanced-admin-layout";
import AdminPageHeader from "@/components/ui/admin-page-header";
import { QuotationForm } from "@/components/forms/quotation-form";
import { Card } from "@/components/ui/card";

export default function NewQuotationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const preSelectedCustomerId = searchParams.get("customerId");
  const preSelectedProductId = searchParams.get("productId");

  const handleSuccess = () => {
    router.push("/admin/quotations");
  };

  const handleCancel = () => {
    router.back();
  };

  return (
  <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title="Create New Quotation"
          subtitle="Sales Operations"
          description="Generate a professional quotation for your customer"
          compact
        />

        <div className="px-6">
          <Card className="p-6">
            <QuotationForm
              preSelectedCustomerId={preSelectedCustomerId || undefined}
              preSelectedProductId={preSelectedProductId || undefined}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </Card>
        </div>
      </div>
  </AdminLayout>
  );
}