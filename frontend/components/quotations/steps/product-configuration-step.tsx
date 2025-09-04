"use client";

import * as React from "react";
import { UseFormReturn } from "react-hook-form";
import { Search, Plus, Minus, Package, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormSection, FormActions } from "@/components/ui/form";
import { type QuotationBuilderFormData } from "@/features/quotations/schemas";
import { type Product } from "@/features/products/types";
import { useProducts } from "@/features/products/hooks";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { cn } from "@/lib/cn";

export interface ProductConfigurationStepProps {
  form: UseFormReturn<QuotationBuilderFormData>;
  onNext: () => void;
  onPrevious: () => void;
  isValid: boolean;
}

interface QuotationItem {
  id: string;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  customSpecifications?: string;
  total: number;
}

export function ProductConfigurationStep({
  form,
  onNext,
  onPrevious,
  isValid,
}: ProductConfigurationStepProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("");
  const [showProductCatalog, setShowProductCatalog] = React.useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const { data: products = [], isLoading: isLoadingProducts } = useProducts();

  const { setValue, watch, formState: { errors } } = form;
  const items = watch("items") || [];

  // Get unique categories from products
  const categories = React.useMemo(() => {
    const uniqueCategories = [...new Set(products.map(p => p.category))];
    return uniqueCategories.map(category => ({
      value: category,
      label: category,
    }));
  }, [products]);

  // Filter products based on search and category
  const filteredProducts = React.useMemo(() => {
    let filtered = products;

    if (debouncedSearchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    return filtered;
  }, [products, debouncedSearchQuery, selectedCategory]);

  const addProduct = (product: Product) => {
    const newItem: QuotationItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: product.price,
      discount: 0,
      customSpecifications: "",
      total: product.price,
    };

    setValue("items", [...items, newItem]);
    setShowProductCatalog(false);
  };

  const removeItem = (itemId: string) => {
    setValue("items", items.filter(item => item.id !== itemId));
  };

  const updateItem = (itemId: string, field: keyof QuotationItem, value: any) => {
    const updatedItems = items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };

        // Recalculate total when quantity, unitPrice, or discount changes
        if (field === 'quantity' || field === 'unitPrice' || field === 'discount') {
          const discountAmount = (updatedItem.unitPrice * updatedItem.discount) / 100;
          const finalPrice = updatedItem.unitPrice - discountAmount;
          updatedItem.total = finalPrice * updatedItem.quantity;
        }

        return updatedItem;
      }
      return item;
    });

    setValue("items", updatedItems);
  };

  const duplicateItem = (itemId: string) => {
    const itemToDuplicate = items.find(item => item.id === itemId);
    if (itemToDuplicate) {
      const duplicatedItem: QuotationItem = {
        ...itemToDuplicate,
        id: `item-${Date.now()}-${Math.random()}`,
      };
      setValue("items", [...items, duplicatedItem]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Items */}
      {items.length > 0 && (
        <FormSection
          title="Selected Products"
          description="Configure quantities, pricing, and specifications"
        >
          <div className="space-y-4">
            {items.map((item, index) => (
              <Card key={item.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                    {/* Product Info */}
                    <div className="lg:col-span-4">
                      <div className="flex items-start gap-3">
                        <Package className="w-5 h-5 text-gray-500 mt-1" />
                        <div>
                          <h4 className="font-medium text-gray-900">{item.productName}</h4>
                          <p className="text-sm text-gray-600">Product ID: {item.productId}</p>
                        </div>
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="lg:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity
                      </label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateItem(item.id, "quantity", Math.max(1, item.quantity - 1))}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-20 text-center"
                          min="1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateItem(item.id, "quantity", item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Unit Price */}
                    <div className="lg:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit Price (₹)
                      </label>
                      <Input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                      />
                    </div>

                    {/* Discount */}
                    <div className="lg:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Discount (%)
                      </label>
                      <Input
                        type="number"
                        value={item.discount}
                        onChange={(e) => updateItem(item.id, "discount", Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>

                    {/* Total */}
                    <div className="lg:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total
                      </label>
                      <div className="text-lg font-semibold text-gray-900">
                        ₹{item.total.toLocaleString()}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="lg:col-span-1 flex flex-col gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => duplicateItem(item.id)}
                        title="Duplicate item"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        title="Remove item"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                    </div>

                    {/* Custom Specifications */}
                    <div className="lg:col-span-12">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Custom Specifications (Optional)
                      </label>
                      <Input
                        value={item.customSpecifications || ""}
                        onChange={(e) => updateItem(item.id, "customSpecifications", e.target.value)}
                        placeholder="Enter any custom specifications or requirements..."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Items Summary */}
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">
                    Total Items: {items.length}
                  </span>
                  <span className="font-medium text-gray-900">
                    Subtotal: ₹{items.reduce((sum, item) => sum + item.total, 0).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </FormSection>
      )}

      {/* Add Products Section */}
      <FormSection
        title="Add Products"
        description="Browse and add products to your quotation"
      >
        {!showProductCatalog ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {items.length === 0 ? "No products added yet" : "Add more products"}
            </h3>
            <p className="text-gray-600 mb-4">
              Browse our product catalog to add items to your quotation
            </p>
            <Button
              type="button"
              onClick={() => setShowProductCatalog(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Browse Products
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search products by name, SKU, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                options={[{ value: "", label: "All Categories" }, ...categories]}
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                placeholder="Filter by category"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowProductCatalog(false)}
              >
                Close Catalog
              </Button>
            </div>

            {/* Product Grid */}
            {isLoadingProducts ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-blue-300"
                    onClick={() => addProduct(product)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 line-clamp-2">
                              {product.name}
                            </h4>
                            <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            className="ml-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              addProduct(product);
                            }}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {product.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">{product.category}</span>
                          <span className="font-semibold text-blue-600">
                            ₹{product.price.toLocaleString()}
                          </span>
                        </div>
                        {product.stockQuantity !== undefined && (
                          <div className="text-xs text-gray-500">
                            Stock: {product.stockQuantity} units
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600">
                  {searchQuery || selectedCategory
                    ? "No products match your search criteria."
                    : "No products available."}
                </p>
              </div>
            )}
          </div>
        )}
      </FormSection>

      {/* Validation Error */}
      {errors.items && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{errors.items.message}</p>
        </div>
      )}

      {/* Navigation */}
      <FormActions>
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Customer
        </Button>
        <Button
          type="button"
          onClick={onNext}
          disabled={!isValid}
          className="flex items-center gap-2"
        >
          Continue to Pricing
          <ChevronRight className="w-4 h-4" />
        </Button>
      </FormActions>
    </div>
  );
}