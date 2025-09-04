"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { AdminLayout } from "@/components/layout/enhanced-admin-layout";
import AdminPageHeader from "@/components/ui/admin-page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useProduct, useDeleteProduct } from "@/features/products/hooks";

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = parseInt(params.id as string);
  
  const { data: product, isLoading, error } = useProduct(productId);
  const deleteProduct = useDeleteProduct();

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      try {
        await deleteProduct.mutateAsync(productId);
        router.push("/admin/products");
      } catch (error) {
        console.error("Failed to delete product:", error);
      }
    }
  };

  if (isLoading) {
    return (
  <AdminLayout>
        <div className="space-y-6">
          <AdminPageHeader
            title="Product Details"
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
            title="Product Not Found"
            subtitle="Product Management"
            description="The requested product could not be found"
            compact
          />
          <div className="px-6">
            <Card className="p-8 text-center">
              <div className="text-red-600 mb-4">Product not found or failed to load.</div>
              <Link href="/admin/products">
                <Button>Back to Products</Button>
              </Link>
            </Card>
          </div>
        </div>
  </AdminLayout>
    );
  }

  const headerActions = (
    <div className="flex gap-3">
      <Link href={`/admin/products/${productId}/edit`}>
        <Button className="bg-white text-[var(--color-sanvi-primary-700)] hover:bg-gray-100">
          Edit Product
        </Button>
      </Link>
      <Button 
        variant="outline"
        onClick={handleDelete}
        disabled={deleteProduct.isPending}
        className="border-red-300 text-red-600 hover:bg-red-50"
      >
        {deleteProduct.isPending ? "Deleting..." : "Delete"}
      </Button>
    </div>
  );

  const stockStatus = product.stockQuantity > 10 ? 'In Stock' : product.stockQuantity > 0 ? 'Low Stock' : 'Out of Stock';
  const stockColor = product.stockQuantity > 10 ? 'text-green-600' : product.stockQuantity > 0 ? 'text-yellow-600' : 'text-red-600';

  return (
  <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title={product.name}
          subtitle="Product Details"
          description={`SKU: ${product.sku} • Created: ${new Date(product.createdAt).toLocaleDateString()}`}
          actions={headerActions}
          compact
        />

        <div className="px-6 space-y-6">
          {/* Basic Information */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Product Name</label>
                <p className="text-gray-900">{product.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">SKU</label>
                <p className="text-gray-900">{product.sku}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Category</label>
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                  {product.category}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Price</label>
                <p className="text-gray-900 text-lg font-semibold">₹{product.price.toLocaleString()}</p>
              </div>
            </div>
            {product.description && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-500 mb-1">Description</label>
                <p className="text-gray-900">{product.description}</p>
              </div>
            )}
          </Card>

          {/* Inventory Information */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Current Stock</label>
                <p className="text-gray-900 text-2xl font-bold">{product.stockQuantity}</p>
                <p className={`text-sm font-medium ${stockColor}`}>{stockStatus}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Product ID</label>
                <p className="text-gray-900">{product.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Last Updated</label>
                <p className="text-gray-900">{new Date(product.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <Link href={`/admin/quotations/new?productId=${product.id}`}>
                <Button>Add to Quotation</Button>
              </Link>
              <Button variant="outline">Update Stock</Button>
              <Button variant="outline">View Sales History</Button>
              <Button variant="outline">Duplicate Product</Button>
            </div>
          </Card>

          {/* Stock Alert */}
          {product.stockQuantity <= 10 && (
            <Card className="p-6 bg-yellow-50 border-yellow-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    {product.stockQuantity === 0 ? 'Out of Stock' : 'Low Stock Alert'}
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    {product.stockQuantity === 0 
                      ? 'This product is currently out of stock. Consider restocking soon.'
                      : `Only ${product.stockQuantity} units remaining. Consider restocking soon.`
                    }
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
  </AdminLayout>
  );
}