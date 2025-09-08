"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminLayout } from "@/components/layout/enhanced-admin-layout";
import AdminPageHeader from "@/components/ui/admin-page-header";
import { QuotationBuilder } from "@/components/quotations/quotation-builder";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function QuotationWizardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const preSelectedCustomerId = searchParams.get("customerId");
  const preSelectedProductId = searchParams.get("productId");

  const handleSuccess = (quotationId: string) => {
    router.push(`/admin/quotations/${quotationId}`);
  };

  const handleCancel = () => {
    router.push("/admin/quotations");
  };

  const headerActions = (
    <Link href="/admin/quotations/new">
      <Button variant="outline" className="flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" />
        Back to Options
      </Button>
    </Link>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title="Quotation Wizard"
          subtitle="Sales Operations"
          description="Create quotations with step-by-step guidance"
          actions={headerActions}
          compact
        />

        <QuotationBuilder
          onComplete={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </AdminLayout>
  );
}
