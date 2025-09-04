"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/layout/enhanced-admin-layout";
import AdminPageHeader from "@/components/ui/admin-page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { SearchFilter } from "@/components/ui/search-filter";
import { useProducts, useDeleteProduct } from "@/features/products/hooks";
import { Product } from "@/features/products/types";

export default function ProductsPage() {
  const router = useRouter();
  const { data: products, isLoading, error } = useProducts();
  const deleteProduct = useDeleteProduct();

  // Search and filter state
  const [searchValue, setSearchValue] = React.useState("");
  const [filterValues, setFilterValues] = React.useState<Record<string, string>>({});

  // Filter products based on search and filters
  const filteredProducts = React.useMemo(() => {
    if (!products || !Array.isArray(products)) return [];
    
    return products.filter(product => {
      // Search filter
      const searchMatch = !searchValue ||
        product.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchValue.toLowerCase()) ||
        product.category.toLowerCase().includes(searchValue.toLowerCase());

      // Category filter
      const categoryMatch = !filterValues.category || product.category === filterValues.category;

      // Stock status filter
      const stockMatch = !filterValues.stockStatus ||
        (filterValues.stockStatus === "in_stock" && product.stockQuantity > 10) ||
        (filterValues.stockStatus === "low_stock" && product.stockQuantity > 0 && product.stockQuantity <= 10) ||
        (filterValues.stockStatus === "out_of_stock" && product.stockQuantity === 0);

      return searchMatch && categoryMatch && stockMatch;
    });
  }, [products, searchValue, filterValues]);

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct.mutateAsync(id);
      } catch (error) {
        console.error("Failed to delete product:", error);
      }
    }
  };

  const handleBulkDelete = async (selectedIds: string[]) => {
    if (confirm(`Are you sure you want to delete ${selectedIds.length} products? This action cannot be undone.`)) {
      try {
        await Promise.all(selectedIds.map(id => deleteProduct.mutateAsync(parseInt(id))));
      } catch (error) {
        console.error("Failed to delete products:", error);
      }
    }
  };

  const handleBulkExport = (selectedIds: string[]) => {
    const selectedProducts = Array.isArray(products) ? products.filter(product =>
      selectedIds.includes(product.id.toString())
    ) : [];

    if (selectedProducts) {
      const csvContent = [
        "ID,Name,SKU,Category,Price,Stock,Created",
        ...selectedProducts.map(product =>
          `${product.id},"${product.name}","${product.sku}","${product.category}",${product.price},${product.stockQuantity},"${new Date(product.createdAt).toLocaleDateString()}"`
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const columns: Column<Product>[] = [
    {
      key: "product",
      label: "Product",
      render: (product) => (
        <div className="flex items-center">
          <div className="w-10 h-10 bg-[var(--color-sanvi-primary-100)] rounded-lg flex items-center justify-center">
            <span className="text-[var(--color-sanvi-primary-700)] font-medium text-xs">
              {product.name.substring(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {product.name}
            </div>
            <div className="text-sm text-gray-500">
              SKU: {product.sku}
            </div>
          </div>
        </div>
      )
    },
    {
      key: "category",
      label: "Category",
      render: (product) => (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
          {product.category}
        </span>
      )
    },
    {
      key: "price",
      label: "Price",
      render: (product) => (
        <div className="text-sm text-gray-900">₹{product.price.toLocaleString()}</div>
      )
    },
    {
      key: "stock",
      label: "Stock",
      render: (product) => (
        <div>
          <div className="text-sm text-gray-900">{product.stockQuantity}</div>
          <div className={`text-xs ${product.stockQuantity > 10 ? 'text-green-600' : product.stockQuantity > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
            {product.stockQuantity > 10 ? 'In Stock' : product.stockQuantity > 0 ? 'Low Stock' : 'Out of Stock'}
          </div>
        </div>
      )
    },
    {
      key: "actions",
      label: "Actions",
      render: (product) => (
        <div className="text-sm font-medium space-x-2">
          <Link
            href={`/admin/products/${product.id}`}
            className="text-[var(--color-sanvi-primary-600)] hover:text-[var(--color-sanvi-primary-900)]"
          >
            View
          </Link>
          <Link
            href={`/admin/products/${product.id}/edit`}
            className="text-blue-600 hover:text-blue-900"
          >
            Edit
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(product.id);
            }}
            className="text-red-600 hover:text-red-900"
            disabled={deleteProduct.isPending}
          >
            Delete
          </button>
        </div>
      )
    }
  ];

  const bulkActions = [
    {
      id: "export",
      label: "Export Selected",
      onClick: handleBulkExport
    },
    {
      id: "delete",
      label: "Delete Selected",
      variant: "destructive" as const,
      onClick: handleBulkDelete
    }
  ];

  const filterOptions = [
    {
      key: "category",
      label: "Category",
      options: [
        { value: "machinery", label: "Machinery" },
        { value: "tools", label: "Tools & Equipment" },
        { value: "parts", label: "Spare Parts" },
        { value: "accessories", label: "Accessories" },
        { value: "consumables", label: "Consumables" }
      ]
    },
    {
      key: "stockStatus",
      label: "Stock Status",
      options: [
        { value: "in_stock", label: "In Stock" },
        { value: "low_stock", label: "Low Stock" },
        { value: "out_of_stock", label: "Out of Stock" }
      ]
    }
  ];

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setSearchValue("");
    setFilterValues({});
  };

  const headerActions = (
    <div className="flex gap-3">
      <Button
        variant="outline"
        onClick={() => handleBulkExport(filteredProducts.map(p => p.id.toString()))}
        className="border-white text-white hover:bg-white hover:text-[var(--color-sanvi-primary-700)]"
      >
        Export All ({filteredProducts.length})
      </Button>
      <Link href="/admin/products/new">
        <Button className="bg-white text-[var(--color-sanvi-primary-700)] hover:bg-gray-100">
          Add New Product
        </Button>
      </Link>
    </div>
  );

  return (
  <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title="Product Catalog"
          subtitle="Inventory Management"
          description="Manage your machinery, tools, and equipment catalog"
          actions={headerActions}
          compact
        />

        <div className="px-6">
          {error && (
            <Card className="p-8 text-center">
              <div className="text-red-600">Failed to load products. Please try again.</div>
            </Card>
          )}

          {!error && (
            <>
              <SearchFilter
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                filters={filterOptions}
                filterValues={filterValues}
                onFilterChange={handleFilterChange}
                onClearFilters={clearFilters}
                placeholder="Search products by name, SKU, or category..."
              />

              {Array.isArray(products) && products.length === 0 && !isLoading && (
                <Card className="p-8 text-center">
                  <div className="text-gray-500 mb-4">No products found</div>
                  <Link href="/admin/products/new">
                    <Button>Add Your First Product</Button>
                  </Link>
                </Card>
              )}

              <DataTable
                data={filteredProducts}
                columns={columns}
                keyField="id"
                bulkActions={bulkActions}
                onRowClick={(product) => router.push(`/admin/products/${product.id}`)}
                loading={isLoading}
                emptyMessage={
                  searchValue || Object.values(filterValues).some(v => v)
                    ? "No products match your search criteria"
                    : "No products found"
                }
              />
            </>
          )}
        </div>
      </div>
  </AdminLayout>
  );
}