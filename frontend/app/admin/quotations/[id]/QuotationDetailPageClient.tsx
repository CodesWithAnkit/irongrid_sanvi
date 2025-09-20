"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { AdminLayout } from "@/components/layout/enhanced-admin-layout";
import AdminPageHeader from "@/components/ui/admin-page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useQuotation, useDeleteQuotation, useUpdateQuotation, useEmailQuotation } from "@/features/quotations/hooks";

export default function QuotationDetailPageClient() {
  const router = useRouter();
  const params = useParams();
  const quotationId = params.id as string;
  
  const { data: quotation, isLoading, error } = useQuotation(quotationId);
  const deleteQuotation = useDeleteQuotation();
  const updateQuotation = useUpdateQuotation();
  const emailQuotation = useEmailQuotation();

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this quotation? This action cannot be undone.")) {
      try {
        await deleteQuotation.mutateAsync(quotationId);
        router.push("/admin/quotations");
      } catch (error) {
        console.error("Failed to delete quotation:", error);
      }
    }
  };

  const handleStatusUpdate = async (status: "DRAFT" | "SENT" | "REJECTED" | "APPROVED" | "EXPIRED") => {
    try {
      await updateQuotation.mutateAsync({ 
        id: quotationId, 
        data: { status  } 
      });
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleEmailQuotation = async () => {
    if (!quotation?.customer?.email) {
      alert("Customer email not found");
      return;
    }
    try {
      await emailQuotation.mutateAsync({ id: quotationId, data: { email: quotation.customer.email } });
      alert("Quotation sent successfully!");
    } catch (error) {
      console.error("Failed to send email:", error);
      alert("Failed to send quotation");
    }
  };

  const handleGeneratePdf = () => {
    const url = `/api/quotations/${quotationId}/pdf?format=html`;
    window.open(url, "_blank");
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <AdminPageHeader
            title="Quotation Details"
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
            title="Quotation Not Found"
            subtitle="Sales Operations"
            description="The requested quotation could not be found"
            compact
          />
          <div className="px-6">
            <Card className="p-8 text-center">
              <div className="text-red-600 mb-4">Quotation not found or failed to load.</div>
              <Link href="/admin/quotations">
                <Button>Back to Quotations</Button>
              </Link>
            </Card>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT": return "bg-gray-100 text-gray-800";
      case "SENT": return "bg-blue-100 text-blue-800";
      case "APPROVED": return "bg-green-100 text-green-800";
      case "REJECTED": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const headerActions = (
    <div className="flex gap-3">
      <Button 
        onClick={handleEmailQuotation}
        disabled={emailQuotation.isPending || !quotation.customer?.email}
        className="bg-white text-[var(--color-sanvi-primary-700)] hover:bg-gray-100"
      >
        {emailQuotation.isPending ? "Sending..." : "Email Quotation"}
      </Button>
      <Button 
        onClick={handleGeneratePdf}
        disabled={false}
        variant="outline"
        className="border-white text-white hover:bg-white hover:text-[var(--color-sanvi-primary-700)]"
      >
        Download PDF
      </Button>
      <Link href={`/admin/quotations/${quotationId}/edit`}>
        <Button variant="outline" className="border-white text-white hover:bg-white hover:text-[var(--color-sanvi-primary-700)]">
          Edit
        </Button>
      </Link>
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title={quotation.quotationNumber}
          subtitle="Quotation Details"
          description={`Total: ₹${parseFloat(quotation.totalAmount).toLocaleString()} • Valid until: ${new Date(quotation.validUntil).toLocaleDateString()}`}
          actions={headerActions}
          compact
        />

        <div className="px-6 space-y-6">
          {/* Additional sections omitted for brevity; copied from original page */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Status & Actions</h3>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(quotation.status)}`}>
                {quotation.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              {quotation.status === "DRAFT" && (
                <Button onClick={() => handleStatusUpdate("SENT")} disabled={updateQuotation.isPending}>Mark as Sent</Button>
              )}
              {quotation.status === "SENT" && (
                <>
                  <Button onClick={() => handleStatusUpdate("APPROVED")} disabled={updateQuotation.isPending} className="bg-green-600 hover:bg-green-700">Mark as Approved</Button>
                  <Button onClick={() => handleStatusUpdate("REJECTED")} disabled={updateQuotation.isPending} variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">Mark as Rejected</Button>
                </>
              )}
              <Button onClick={handleDelete} disabled={deleteQuotation.isPending} variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">{deleteQuotation.isPending ? "Deleting..." : "Delete Quotation"}</Button>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
