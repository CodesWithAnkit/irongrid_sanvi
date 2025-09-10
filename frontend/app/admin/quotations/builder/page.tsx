"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/layout/enhanced-admin-layout";
import AdminPageHeader from "@/components/ui/admin-page-header";
import { LiveQuotationBuilder } from "@/components/quotations/live-quotation-builder";
import { quotationService } from "@/lib/services/quotation.service";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface QuotationData {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyGST: string;
  quoteDate: string;
  quoteNo: string;
  preparedBy: string;
  customerName: string;
  customerContact: string;
  customerAddress: string;
  bankName: string;
  bankHolder: string;
  bankAccount: string;
  bankIFSC: string;
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  termsConditions: string;
  notes: string;
  subtotal: number;
  sgst: number;
  cgst: number;
  grandTotal: number;
}

export default function QuotationBuilderPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSaveQuotation = async (data: QuotationData) => {
    setIsLoading(true);
    try {
      // Transform the live builder data to match backend API format
      const quotationRequest = {
        // For now, use a default customer ID or create customer
        customerId: "default-customer-id", // TODO: Implement customer selection/creation
        items: data.items.map(item => ({
          productId: "product-placeholder", // TODO: Implement product mapping
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          customSpecifications: [
            {
              name: "description",
              value: item.description,
              unit: "item"
            }
          ]
        })),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        termsConditions: data.termsConditions,
        notes: data.notes
      };

      // Create quotation via API
      const quotation = await quotationService.createQuotation(quotationRequest);

      // Auto-open HTML PDF in a new tab (non-blocking)
      try {
        window.open(`/api/quotations/${quotation.id}/pdf?format=html`, "_blank");
      } catch {}

      // Redirect to view the created quotation
      router.push(`/admin/quotations/${quotation.id}`);
    } catch (error) {
      console.error("Failed to save quotation:", error);
      // TODO: Add proper error handling/toast
      alert("Failed to save quotation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/admin/quotations");
  };

  const headerActions = (
    <Link href="/admin/quotations">
      <Button variant="outline" className="flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" />
        Back to Quotations
      </Button>
    </Link>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title="Quotation Builder"
          subtitle="Sales Operations"
          description="Create professional quotations with live preview"
          actions={headerActions}
          compact
        />

        <div className="-mx-6 -mb-6"> {/* Remove padding to let builder handle its own spacing */}
          <LiveQuotationBuilder
            onSave={handleSaveQuotation}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
