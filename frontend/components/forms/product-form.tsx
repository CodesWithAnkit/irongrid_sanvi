"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormSection, FormActions } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { productSchema, type ProductFormData, transformProductToAPI } from "@/lib/validations/product";
import { useCreateProduct, useUpdateProduct } from "@/features/products/hooks";

export type ProductFormProps = {
  initialData?: Partial<ProductFormData>;
  productId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function ProductForm({ 
  initialData, 
  productId,
  onSuccess, 
  onCancel
}: ProductFormProps) {
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "Industrial Drill Machine HD-2500",
      sku: "SM-DRL-2500-2024",
      category: "machinery",
      subcategory: "drilling",
      description: "Heavy-duty industrial drill machine with variable speed control and precision drilling capabilities. Suitable for metal, wood, and concrete applications.",
      specifications: "Motor: 2.5HP, Speed: 0-3000 RPM, Chuck Size: 13mm, Drilling Capacity: Steel 13mm, Wood 40mm, Concrete 16mm",
      dimensions: "45×25×35 cm",
      weight: 8.5,
      material: "Cast Iron Body, Steel Components",
      costPrice: 18000,
      sellingPrice: 25000,
      wholesalePrice: 22000,
      distributorPrice: 20000,
      stockQuantity: 45,
      minStockLevel: 10,
      maxStockLevel: 100,
      unit: "pieces",
      status: "active",
      availability: "in_stock",
      featured: true,
      manufacturer: "Sanvi Machinery Works",
      warranty: "2 years comprehensive warranty",
      tags: "heavy-duty, industrial, precision, drilling, variable-speed",
      ...initialData
    }
  });

  const { handleSubmit, formState: { errors }, watch, setValue } = form;
  const isLoading = createProduct.isPending || updateProduct.isPending;

  const onSubmit = async (data: ProductFormData) => {
    try {
      const apiData = transformProductToAPI(data);
      
      if (productId) {
        await updateProduct.mutateAsync({ id: productId, data: apiData });
      } else {
        await createProduct.mutateAsync(apiData);
      }
      
      onSuccess?.();
    } catch (error) {
      console.error("Failed to save product:", error);
    }
  };

  const categories = [
    { value: "machinery", label: "Machinery" },
    { value: "tools", label: "Tools & Equipment" },
    { value: "parts", label: "Spare Parts" },
    { value: "accessories", label: "Accessories" },
    { value: "consumables", label: "Consumables" }
  ];

  const units = [
    { value: "pieces", label: "Pieces" },
    { value: "kg", label: "Kilograms" },
    { value: "meters", label: "Meters" },
    { value: "liters", label: "Liters" },
    { value: "sets", label: "Sets" }
  ];

  const statusOptions = [
    { value: "active", label: "Active", description: "Product is available for sale" },
    { value: "inactive", label: "Inactive", description: "Product is temporarily unavailable" },
    { value: "discontinued", label: "Discontinued", description: "Product is no longer available" }
  ];

  return (
    <Form 
      title={productId ? "Edit Product" : "Add New Product"}
      description="Add or edit product details for Sanvi Machinery catalog"
      onSubmit={handleSubmit(onSubmit)}
    >
      <FormSection 
        title="Basic Information"
        description="Essential product details and identification"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Product Name"
            {...form.register("name")}
            error={errors.name?.message}
            placeholder="Enter product name"
          />
          <Input
            label="SKU (Stock Keeping Unit)"
            {...form.register("sku")}
            error={errors.sku?.message}
            placeholder="SM-001-2024"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Category"
            options={categories}
            {...form.register("category")}
            error={errors.category?.message}
            placeholder="Select category"
          />
          <Input
            label="Subcategory"
            {...form.register("subcategory")}
            error={errors.subcategory?.message}
            placeholder="Enter subcategory"
          />
        </div>
        
        <Textarea
          label="Product Description"
          {...form.register("description")}
          error={errors.description?.message}
          placeholder="Detailed product description..."
          rows={3}
        />
      </FormSection>

      <FormSection 
        title="Pricing Information"
        description="Cost and selling prices for different customer types"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Cost Price (₹)"
            type="number"
            {...form.register("costPrice", { valueAsNumber: true })}
            error={errors.costPrice?.message}
            placeholder="0"
            min="0"
            step="0.01"
          />
          <Input
            label="Retail Selling Price (₹)"
            type="number"
            {...form.register("sellingPrice", { valueAsNumber: true })}
            error={errors.sellingPrice?.message}
            placeholder="0"
            min="0"
            step="0.01"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Wholesale Price (₹)"
            type="number"
            {...form.register("wholesalePrice", { valueAsNumber: true })}
            error={errors.wholesalePrice?.message}
            placeholder="0"
            min="0"
            step="0.01"
          />
          <Input
            label="Distributor Price (₹)"
            type="number"
            {...form.register("distributorPrice", { valueAsNumber: true })}
            error={errors.distributorPrice?.message}
            placeholder="0"
            min="0"
            step="0.01"
          />
        </div>
      </FormSection>

      <FormSection 
        title="Inventory Management"
        description="Stock levels and inventory tracking"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Current Stock Quantity"
            type="number"
            {...form.register("stockQuantity", { valueAsNumber: true })}
            error={errors.stockQuantity?.message}
            placeholder="0"
            min="0"
          />
          <Select
            label="Unit of Measurement"
            options={units}
            {...form.register("unit")}
            error={errors.unit?.message}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Minimum Stock Level"
            type="number"
            {...form.register("minStockLevel", { valueAsNumber: true })}
            error={errors.minStockLevel?.message}
            placeholder="10"
            min="0"
          />
          <Input
            label="Maximum Stock Level"
            type="number"
            {...form.register("maxStockLevel", { valueAsNumber: true })}
            error={errors.maxStockLevel?.message}
            placeholder="1000"
            min="0"
          />
        </div>
      </FormSection>

      <FormSection 
        title="Product Status"
        description="Availability and visibility settings"
      >
        <RadioGroup
          name="status"
          label="Product Status"
          options={statusOptions}
          value={watch("status")}
          onChange={(value) => setValue("status", value as ProductFormData["status"])}
          error={errors.status?.message}
        />
        
        <Checkbox
          label="Featured Product"
          description="Display this product prominently on the website and catalogs"
          checked={watch("featured")}
          onChange={(e) => setValue("featured", e.target.checked)}
          error={errors.featured?.message}
        />
      </FormSection>

      <FormSection 
        title="Additional Information"
        description="Manufacturer details and product tags"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Manufacturer"
            {...form.register("manufacturer")}
            error={errors.manufacturer?.message}
            placeholder="Manufacturer name"
          />
          <Input
            label="Warranty Period"
            {...form.register("warranty")}
            error={errors.warranty?.message}
            placeholder="1 year, 2 years, etc."
          />
        </div>
        
        <Input
          label="Tags"
          {...form.register("tags")}
          error={errors.tags?.message}
          placeholder="heavy-duty, industrial, precision, etc. (comma-separated)"
          helperText="Add relevant tags to help customers find this product"
        />
      </FormSection>

      <FormActions>
        {onCancel && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button 
          type="submit" 
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : productId ? "Update Product" : "Create Product"}
        </Button>
      </FormActions>
    </Form>
  );
}