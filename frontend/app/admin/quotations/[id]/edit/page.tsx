"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { AdminLayout } from "@/components/layout/enhanced-admin-layout";
import AdminPageHeader from "@/components/ui/admin-page-header";
import { QuotationForm } from "@/components/forms/quotation-form";
import { Card } from "@/components/ui/card";
import { useQuotation } from "@/features/quotations/hooks";

export default function EditQuotationPage() {
  const router = useRouter();
  const params = useParams();
  const quotationId = parseInt(params.id as string);
  
  const { data: quotation, isLoading, error } = useQuotation(quotationId);

  const handleSuccess = () => {
    router.push(`/admin/quotations/${quotationId}`);
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <AdminPageHeader
            title="Edit Quotation"
            subtitle="Sales Operations"
            description="Loading quotation information..."
            compact
          />
          <div className="px-6">
            <Card className="p-8 text-center">
              <div className="text-gray-500">Loading quotation details...</div>
            </Card>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !quotation) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <AdminPageHeader
            title="Edit Quotation"
            subtitle="Sales Operations"
            description="Quotation not found"
            compact
          />
          <div className="px-6">
            <Card className="p-8 text-center">
              <div className="text-red-600 mb-4">Failed to load quotation details.</div>
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

  // Transform quotation data to form format
  const initialData = {
    customerId: quotation.customerId.toString(),
    customerName: quotation.customer?.name || "",
    customerEmail: quotation.customer?.email || "",
    customerPhone: quotation.customer?.phone || "",
    quotationNumber: quotation.quotationNumber,
    date: new Date(quotation.createdAt).toISOString().split('T')[0],
    validUntil: quotation.validUntil,
    currency: "INR",
    items: quotation.items?.map(item => ({
      id: item.id?.toString() || Date.now().toString(),
      productId: item.productId.toString(),
      productName: `Product ${item.productId}`, // You might want to fetch product names
      quantity: item.quantity,
      unitPrice: parseFloat(item.unitPrice.toString()),
      discount: parseFloat(item.discount.toString()),
      total: parseFloat(item.total)
    })) || [],
    subtotal: parseFloat(quotation.subtotal),
    taxRate: 18, // Default tax rate, you might want to store this
    taxAmount: parseFloat(quotation.taxTotal),
    shippingCost: 0, // Default shipping cost
    totalDiscount: parseFloat(quotation.discountTotal),
    grandTotal: parseFloat(quotation.total),
    paymentTerms: "net30", // Default payment terms
    deliveryTerms: "FOB Origin", // Default delivery terms
    notes: "",
    termsAccepted: true,
    status: quotation.status.toLowerCase() as "draft" | "sent" | "accepted" | "rejected"
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title={`Edit ${quotation.quotationNumber}`}
          subtitle="Sales Operations"
          description="Update quotation information and items"
          compact
        />

        <div className="px-6">
          <Card className="p-6">
            <QuotationForm
              initialData={initialData}
              quotationId={quotationId}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}