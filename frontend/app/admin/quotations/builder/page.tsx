"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/layout/enhanced-admin-layout";
import AdminPageHeader from "@/components/ui/admin-page-header";
import { LiveQuotationBuilder } from "@/components/quotations/live-quotation-builder";
import { quotationService } from "@/lib/services/quotation.service";
import { customerService } from "@/lib/services/customer.service";
import { productService } from "@/lib/services/product.service";
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
  customerId?: string;
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
  const [customers, setCustomers] = React.useState<any[]>([]);
  const [products, setProducts] = React.useState<any[]>([]);
  const [initialData, setInitialData] = React.useState<Partial<QuotationData>>({});

  // Load data on component mount
  React.useEffect(() => {
    const loadData = async () => {
      try {
        // Load customers and products
        const [customersResponse, productsResponse] = await Promise.all([
          customerService.getCustomers({ limit: 100 }),
          productService.getProducts({ limit: 100 })
        ]);

        setCustomers(customersResponse.data);
        setProducts(productsResponse.data);

        // Set initial data with real customer and product info
        const defaultCustomer = customersResponse.data.find(c => c.id === "cmfjeun5o0000od2x5uv8f4o9") || customersResponse.data[0];
        
        if (defaultCustomer) {
          setInitialData({
            customerId: defaultCustomer.id,
            customerName: defaultCustomer.companyName,
            customerContact: defaultCustomer.contactPerson,
            customerAddress: `${defaultCustomer.address.street}, ${defaultCustomer.address.city}, ${defaultCustomer.address.state} ${defaultCustomer.address.postalCode}`,
            // Map products to items
            items: productsResponse.data.slice(0, 6).map(product => ({
              id: product.id,
              description: product.name,
              quantity: 1,
              unitPrice: Number(product.basePrice),
              total: Number(product.basePrice)
            }))
          });
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };

    loadData();
  }, []);

  const handleSaveQuotation = async (data: QuotationData) => {
    setIsLoading(true);
    console.log('Saving quotation:', data);
    try {
      // Use the customer ID from the data or fallback to default
      const customerId = (data as any).customerId || "cmfjeun5o0000od2x5uv8f4o9";

      // Map items to existing products
      const resolvedItems = [] as Array<{ productId: string; quantity: number; unitPrice: number; discount: number; customSpecifications?: Record<string, any>; deliveryTimeline?: string; }>; 
      
      for (let idx = 0; idx < data.items.length; idx++) {
        const it = data.items[idx];
        const name = it.description?.trim() || `Item ${idx + 1}`;

        // Try to find matching product by ID first, then by name
        let productId = it.id;
        // console.log('prodddd', productId, products)
        // if (!productId || !products.find(p => p.id === productId)) {
        //   // Find by name if ID doesn't match
        //   const matchingProduct = products.find(p => 
        //     p.name.toUpperCase().includes(name.toUpperCase()) || 
        //     name.toUpperCase().includes(p.name.toUpperCase())
        //   );
        //   productId = matchingProduct?.id || products[0]?.id || "cmfjeun660001od2xl94oskdx";
        // }

        // Convert to the correct object format expected by backend (Joi validation)
        const customSpecifications = {
          description: name,
          unit: "item"
        };
        
        resolvedItems.push({
          productId,
          quantity: Math.max(1, it.quantity || 1),
          unitPrice: Math.max(0, it.unitPrice || 0),
          discount: 0.01, // Backend requires positive number, use minimal discount
          customSpecifications,
        });
      }

      // 3) Build backend-compliant payload
      const quotationRequest: any = {
        customerId,
        items: resolvedItems,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        termsConditions: data.termsConditions,
        notes: data.notes,
      };

      // Create quotation via API
      const quotation = await quotationService.createQuotation(quotationRequest as any);

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
            initialData={initialData}
            onSave={handleSaveQuotation}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
