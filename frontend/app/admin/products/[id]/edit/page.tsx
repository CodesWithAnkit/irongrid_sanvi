"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { AdminLayout } from "@/components/layout/enhanced-admin-layout";
import AdminPageHeader from "@/components/ui/admin-page-header";
import { ProductForm } from "@/components/forms/product-form";
import { Card } from "@/components/ui/card";
import { useProduct } from "@/features/products/hooks";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = parseInt(params.id as string);
  
  const { data: product, isLoading, error } = useProduct(productId);

  const handleSuccess = () => {
    router.push("/admin/products");
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <AdminPageHeader
            title="Edit Product"
            subtitle="Product Management"
            description="Loading product information..."
            compact
          />
          <div className="px-6">
            <Card className="p-8 text-center">
              <div className="text-gray-500">Loading product details...</div>
            </Card>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !product) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <AdminPageHeader
            title="Edit Product"
            subtitle="Product Management"
            description="Product not found"
            compact
          />
          <div className="px-6">
            <Card className="p-8 text-center">
              <div className="text-red-600 mb-4">Failed to load product details.</div>
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

  // Transform product data to form format
  const initialData = {
    name: product.name,
    sku: product.sku,
    category: product.category,
    subcategory: "",
    description: product.description || "",
    specifications: "",
    dimensions: "",
    weight: 0,
    material: "",
    costPrice: 0,
    sellingPrice: product.price,
    wholesalePrice: 0,
    distributorPrice: 0,
    stockQuantity: product.stockQuantity,
    minStockLevel: 10,
    maxStockLevel: 1000,
    unit: "pieces",
    status: "active" as const,
    availability: "in_stock" as const,
    featured: false,
    manufacturer: "",
    warranty: "",
    tags: "",
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title={`Edit ${product.name}`}
          subtitle="Product Management"
          description="Update product information for Sanvi Machinery catalog"
          compact
        />

        <div className="px-6">
          <Card className="p-6">
            <ProductForm
              initialData={initialData}
              productId={productId}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}