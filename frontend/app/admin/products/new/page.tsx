"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/layout/enhanced-admin-layout";
import AdminPageHeader from "@/components/ui/admin-page-header";
import { ProductForm } from "@/components/forms/product-form";
import { Card } from "@/components/ui/card";

export default function NewProductPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/admin/products");
  };

  const handleCancel = () => {
    router.back();
  };

  return (
  <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title="Add New Product"
          subtitle="Product Catalog"
          description="Create a new product for Sanvi Machinery inventory"
          compact
        />

        <div className="px-6">
          <Card className="p-6">
            <ProductForm
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </Card>
        </div>
      </div>
  </AdminLayout>
  );
}