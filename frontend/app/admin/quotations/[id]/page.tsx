"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { AdminLayout } from "@/components/layout/enhanced-admin-layout";
import AdminPageHeader from "@/components/ui/admin-page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useQuotation, useDeleteQuotation, useUpdateQuotation, useEmailQuotation, useGenerateQuotationPdf } from "@/features/quotations/hooks";

export default function QuotationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const quotationId = parseInt(params.id as string);
  
  const { data: quotation, isLoading, error } = useQuotation(quotationId);
  const deleteQuotation = useDeleteQuotation();
  const updateQuotation = useUpdateQuotation();
  const emailQuotation = useEmailQuotation();
  const generatePdf = useGenerateQuotationPdf();

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

  const handleStatusUpdate = async (status: "SENT" | "ACCEPTED" | "REJECTED") => {
    try {
      await updateQuotation.mutateAsync({ 
        id: quotationId, 
        data: { status } 
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
      await emailQuotation.mutateAsync({
        id: quotationId,
        data: { email: quotation.customer.email }
      });
      alert("Quotation sent successfully!");
    } catch (error) {
      console.error("Failed to send email:", error);
      alert("Failed to send quotation");
    }
  };

  const handleGeneratePdf = async () => {
    try {
      await generatePdf.mutateAsync({ id: quotationId, format: "pdf" });
    } catch (error) {
      console.error("Failed to generate PDF:", error);
    }
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
      case "ACCEPTED": return "bg-green-100 text-green-800";
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
        disabled={generatePdf.isPending}
        variant="outline"
        className="border-white text-white hover:bg-white hover:text-[var(--color-sanvi-primary-700)]"
      >
        {generatePdf.isPending ? "Generating..." : "Download PDF"}
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
          description={`Total: ₹${parseFloat(quotation.total).toLocaleString()} • Valid until: ${new Date(quotation.validUntil).toLocaleDateString()}`}
          actions={headerActions}
          compact
        />

        <div className="px-6 space-y-6">
          {/* Status and Quick Actions */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Status & Actions</h3>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(quotation.status)}`}>
                {quotation.status}
              </span>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {quotation.status === "DRAFT" && (
                <Button 
                  onClick={() => handleStatusUpdate("SENT")}
                  disabled={updateQuotation.isPending}
                >
                  Mark as Sent
                </Button>
              )}
              {quotation.status === "SENT" && (
                <>
                  <Button 
                    onClick={() => handleStatusUpdate("ACCEPTED")}
                    disabled={updateQuotation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Mark as Accepted
                  </Button>
                  <Button 
                    onClick={() => handleStatusUpdate("REJECTED")}
                    disabled={updateQuotation.isPending}
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    Mark as Rejected
                  </Button>
                </>
              )}
              <Button 
                onClick={handleDelete}
                disabled={deleteQuotation.isPending}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                {deleteQuotation.isPending ? "Deleting..." : "Delete Quotation"}
              </Button>
            </div>
          </Card>

          {/* Customer Information */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
            {quotation.customer ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Customer Name</label>
                  <p className="text-gray-900">{quotation.customer.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Company</label>
                  <p className="text-gray-900">{quotation.customer.company || "—"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                  <p className="text-gray-900">{quotation.customer.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
                  <p className="text-gray-900">{quotation.customer.phone || "—"}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Customer information not available</p>
            )}
          </Card>

          {/* Quotation Items */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Items</h3>
            {quotation.items && quotation.items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {quotation.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2 text-sm text-gray-900">Product ID: {item.productId}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{item.quantity}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">₹{parseFloat(item.unitPrice.toString()).toLocaleString()}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{item.discount}%</td>
                        <td className="px-4 py-2 text-sm text-gray-900">₹{parseFloat(item.total).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No items found</p>
            )}
          </Card>

          {/* Pricing Summary */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing Summary</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>₹{parseFloat(quotation.subtotal).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Discount:</span>
                <span>-₹{parseFloat(quotation.discountTotal).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax:</span>
                <span>₹{parseFloat(quotation.taxTotal).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold border-t pt-2">
                <span>Total Amount:</span>
                <span>₹{parseFloat(quotation.total).toLocaleString()}</span>
              </div>
            </div>
          </Card>

          {/* Quotation Information */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quotation Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Quotation ID</label>
                <p className="text-gray-900">{quotation.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Created Date</label>
                <p className="text-gray-900">{new Date(quotation.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Valid Until</label>
                <p className="text-gray-900">{new Date(quotation.validUntil).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Last Updated</label>
                <p className="text-gray-900">{new Date(quotation.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <Link href={`/admin/orders/new?quotationId=${quotation.id}`}>
                <Button>Convert to Order</Button>
              </Link>
              <Button variant="outline">Duplicate Quotation</Button>
              <Button variant="outline">Print Quotation</Button>
              <Link href={`/admin/customers/${quotation.customerId}`}>
                <Button variant="outline">View Customer</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}