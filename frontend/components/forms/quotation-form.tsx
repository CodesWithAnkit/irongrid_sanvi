"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormSection, FormActions } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { quotationSchema, type QuotationFormData, transformQuotationToAPI } from "@/lib/validations/quotation";
import { useCreateQuotation, useUpdateQuotation } from "@/features/quotations/hooks";
import { useCustomers } from "@/features/customers/hooks";
import { useProducts } from "@/features/products/hooks";

export type QuotationFormProps = {
    initialData?: Partial<QuotationFormData>;
    quotationId?: number;
    onSuccess?: () => void;
    onCancel?: () => void;
    preSelectedCustomerId?: string;
    preSelectedProductId?: string;
};

export function QuotationForm({
    initialData,
    quotationId,
    onSuccess,
    onCancel,
    preSelectedCustomerId,
    preSelectedProductId
}: QuotationFormProps) {
    const createQuotation = useCreateQuotation();
    const updateQuotation = useUpdateQuotation();
    const { data: customers = [] } = useCustomers();
    const { data: products = [] } = useProducts();

    const form = useForm<QuotationFormData>({
        resolver: zodResolver(quotationSchema),
        defaultValues: {
            customerId: preSelectedCustomerId || "1",
            customerName: "ABC Manufacturing Pvt Ltd",
            customerEmail: "rajesh.kumar@abcmfg.com",
            customerPhone: "+91 98765 43210",
            quotationNumber: `QT-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            currency: "INR",
            items: [
                {
                    id: "1",
                    productId: preSelectedProductId || "1",
                    productName: "Industrial Drill Machine HD-2500",
                    quantity: 2,
                    unitPrice: 25000,
                    discount: 5,
                    total: 47500
                },
                {
                    id: "2",
                    productId: "2",
                    productName: "Welding Equipment Set WS-300",
                    quantity: 1,
                    unitPrice: 45000,
                    discount: 0,
                    total: 45000
                }
            ],
            subtotal: 92500,
            taxRate: 18,
            taxAmount: 16650,
            shippingCost: 2000,
            totalDiscount: 2500,
            grandTotal: 108650,
            paymentTerms: "net30",
            deliveryTerms: "FOB Origin",
            notes: "Delivery within 15 days. Installation and training included. 2-year comprehensive warranty on all items.",
            termsAccepted: true,
            status: "DRAFT",
            ...initialData
        }
    });

    const { handleSubmit, formState: { errors }, watch, setValue } = form;
    const isLoading = createQuotation.isPending || updateQuotation.isPending;

    // Watch for changes to recalculate totals
    const items = watch("items");
    const taxRate = watch("taxRate");
    const shippingCost = watch("shippingCost");

    React.useEffect(() => {
        const subtotal = items.reduce((sum, item) => sum + item.total, 0);
        const taxAmount = (subtotal * taxRate) / 100;
        const totalDiscount = items.reduce((sum, item) => {
            const discountAmount = (item.unitPrice * item.quantity * item.discount) / 100;
            return sum + discountAmount;
        }, 0);
        const grandTotal = subtotal + taxAmount + shippingCost - totalDiscount;

        setValue("subtotal", subtotal);
        setValue("taxAmount", taxAmount);
        setValue("totalDiscount", totalDiscount);
        setValue("grandTotal", grandTotal);
    }, [items, taxRate, shippingCost, setValue]);

    const onSubmit = async (data: QuotationFormData) => {
        try {
            const apiData = transformQuotationToAPI(data);

            if (quotationId) {
                await updateQuotation.mutateAsync({ id: quotationId, data: { status: data.status } });
            } else {
                await createQuotation.mutateAsync(apiData);
            }

            onSuccess?.();
        } catch (error) {
            console.error("Failed to save quotation:", error);
        }
    };

    const handleCustomerChange = (customerId: string) => {
        const customer = customers.find(c => c.id.toString() === customerId);
        if (customer) {
            setValue("customerId", customerId);
            setValue("customerName", customer.name);
            setValue("customerEmail", customer.email);
            setValue("customerPhone", customer.phone || "");
        }
    };

    const addItem = () => {
        const newItem = {
            id: Date.now().toString(),
            productId: "1",
            productName: "New Product",
            quantity: 1,
            unitPrice: 0,
            discount: 0,
            total: 0
        };
        setValue("items", [...items, newItem]);
    };

    const removeItem = (itemId: string) => {
        setValue("items", items.filter(item => item.id !== itemId));
    };

    const updateItem = (itemId: string, field: string, value: any) => {
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

    const customerOptions = customers.map(customer => ({
        value: customer.id.toString(),
        label: `${customer.name} (${customer.email})`
    }));

    const productOptions = Array.isArray(products) ? products?.map(product => ({
        value: product.id,
        label: `${product.name} - ₹${product.price}`
      })) : [];    

    const paymentTermsOptions = [
        { value: "net15", label: "Net 15 Days" },
        { value: "net30", label: "Net 30 Days" },
        { value: "net45", label: "Net 45 Days" },
        { value: "advance", label: "Advance Payment" },
        { value: "cod", label: "Cash on Delivery" }
    ];

    const deliveryTermsOptions = [
        { value: "FOB Origin", label: "FOB Origin" },
        { value: "FOB Destination", label: "FOB Destination" },
        { value: "CIF", label: "Cost, Insurance & Freight" },
        { value: "Ex Works", label: "Ex Works" }
    ];

    return (
        <Form
            title={quotationId ? "Edit Quotation" : "Create New Quotation"}
            description="Generate a detailed quotation for Sanvi Machinery products"
            onSubmit={handleSubmit(onSubmit)}
        >
            <FormSection
                title="Customer Information"
                description="Select customer and verify contact details"
            >
                <Select
                    label="Select Customer"
                    options={customerOptions}
                    value={watch("customerId")}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    error={errors.customerId?.message}
                    placeholder="Choose a customer"
                />

                {watch("customerId") && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                            <p className="text-sm text-gray-900">{watch("customerName")}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <p className="text-sm text-gray-900">{watch("customerEmail")}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Phone</label>
                            <p className="text-sm text-gray-900">{watch("customerPhone")}</p>
                        </div>
                    </div>
                )}
            </FormSection>

            <FormSection
                title="Quotation Details"
                description="Basic quotation information and validity"
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                        label="Quotation Number"
                        {...form.register("quotationNumber")}
                        error={errors.quotationNumber?.message}
                        placeholder="QT-001"
                    />
                    <Input
                        label="Date"
                        type="date"
                        {...form.register("date")}
                        error={errors.date?.message}
                    />
                    <Input
                        label="Valid Until"
                        type="date"
                        {...form.register("validUntil")}
                        error={errors.validUntil?.message}
                    />
                </div>
            </FormSection>

            <FormSection
                title="Products & Services"
                description="Add items to the quotation"
            >
                {/* Items List */}
                {items.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <h4 className="text-sm font-medium text-gray-900">Quotation Items</h4>
                            <Button type="button" onClick={addItem} variant="outline" size="sm">
                                Add Item
                            </Button>
                        </div>
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Discount %</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {items.map((item, index) => (
                                        <tr key={item.id}>
                                            <td className="px-4 py-2">
                                                <select
                                                    value={item.productId}
                                                    onChange={(e) => {
                                                        const product = products.find(p => p.id.toString() === e.target.value);
                                                        if (product) {
                                                            updateItem(item.id, "productId", e.target.value);
                                                            updateItem(item.id, "productName", product.name);
                                                            updateItem(item.id, "unitPrice", product.price);
                                                        }
                                                    }}
                                                    className="w-full text-sm border-gray-300 rounded"
                                                >
                                                    {productOptions.map(option => (
                                                        <option key={option.value} value={option.value}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-4 py-2">
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))}
                                                    className="w-20 text-sm border-gray-300 rounded"
                                                    min="1"
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <input
                                                    type="number"
                                                    value={item.unitPrice}
                                                    onChange={(e) => updateItem(item.id, "unitPrice", Number(e.target.value))}
                                                    className="w-24 text-sm border-gray-300 rounded"
                                                    min="0"
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <input
                                                    type="number"
                                                    value={item.discount}
                                                    onChange={(e) => updateItem(item.id, "discount", Number(e.target.value))}
                                                    className="w-20 text-sm border-gray-300 rounded"
                                                    min="0"
                                                    max="100"
                                                />
                                            </td>
                                            <td className="px-4 py-2 text-sm text-gray-900">₹{item.total.toLocaleString()}</td>
                                            <td className="px-4 py-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => removeItem(item.id)}
                                                >
                                                    Remove
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </FormSection>

            <FormSection
                title="Pricing & Totals"
                description="Tax, shipping, and final calculations"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Tax Rate (%)"
                        type="number"
                        {...form.register("taxRate", { valueAsNumber: true })}
                        error={errors.taxRate?.message}
                        min="0"
                        max="100"
                        step="0.1"
                    />
                    <Input
                        label="Shipping Cost (₹)"
                        type="number"
                        {...form.register("shippingCost", { valueAsNumber: true })}
                        error={errors.shippingCost?.message}
                        min="0"
                        step="0.01"
                    />
                </div>

                {/* Totals Summary */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>₹{watch("subtotal").toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span>Total Discount:</span>
                        <span>-₹{watch("totalDiscount").toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span>Tax ({watch("taxRate")}%):</span>
                        <span>₹{watch("taxAmount").toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span>Shipping:</span>
                        <span>₹{watch("shippingCost").toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold border-t pt-2">
                        <span>Grand Total:</span>
                        <span>₹{watch("grandTotal").toLocaleString()}</span>
                    </div>
                </div>
            </FormSection>

            <FormSection
                title="Terms & Conditions"
                description="Payment and delivery terms"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                        label="Payment Terms"
                        options={paymentTermsOptions}
                        {...form.register("paymentTerms")}
                        error={errors.paymentTerms?.message}
                    />
                    <Select
                        label="Delivery Terms"
                        options={deliveryTermsOptions}
                        {...form.register("deliveryTerms")}
                        error={errors.deliveryTerms?.message}
                    />
                </div>

                <Textarea
                    label="Additional Notes"
                    {...form.register("notes")}
                    error={errors.notes?.message}
                    placeholder="Any special instructions, terms, or conditions..."
                    rows={3}
                />

                <Checkbox
                    label="I accept the terms and conditions"
                    description="Confirm that all information is accurate and terms are acceptable"
                    checked={watch("termsAccepted")}
                    onChange={(e) => setValue("termsAccepted", e.target.checked)}
                    error={errors.termsAccepted?.message}
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
                    type="button"
                    variant="outline"
                    onClick={() => setValue("status", "DRAFT")}
                    disabled={isLoading}
                >
                    Save as Draft
                </Button>
                <Button
                    type="submit"
                    disabled={isLoading}
                >
                    {isLoading ? "Creating..." : quotationId ? "Update Quotation" : "Create Quotation"}
                </Button>
            </FormActions>
        </Form>
    );
}