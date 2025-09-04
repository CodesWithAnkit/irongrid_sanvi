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
import { customerSchema, type CustomerFormData, transformCustomerToAPI } from "@/lib/validations/customer";
import { useCreateCustomer, useUpdateCustomer } from "@/features/customers/hooks";

export type CustomerFormProps = {
    initialData?: Partial<CustomerFormData>;
    customerId?: number;
    onSuccess?: () => void;
    onCancel?: () => void;
};

export function CustomerForm({
    initialData,
    customerId,
    onSuccess,
    onCancel
}: CustomerFormProps) {
    const createCustomer = useCreateCustomer();
    const updateCustomer = useUpdateCustomer();

    const form = useForm<CustomerFormData>({
        resolver: zodResolver(customerSchema),
        defaultValues: {
            companyName: "ABC Manufacturing Pvt Ltd",
            contactPerson: "Rajesh Kumar",
            email: "rajesh.kumar@abcmfg.com",
            phone: "+91 98765 43210",
            address: "Plot No. 45, Industrial Area, Sector 8",
            city: "Gurgaon",
            state: "Haryana",
            zipCode: "122001",
            country: "India",
            customerType: "wholesale",
            businessCategory: "manufacturing",
            taxId: "27AABCA1234M1Z5",
            creditLimit: 500000,
            paymentTerms: "net30",
            preferredCommunication: "email",
            newsletter: true,
            specialInstructions: "Preferred delivery time: 9 AM - 5 PM. Contact security at gate for large deliveries.",
            ...initialData
        }
    });

    const { handleSubmit, formState: { errors }, watch, setValue } = form;
    const isLoading = createCustomer.isPending || updateCustomer.isPending;

    const onSubmit = async (data: CustomerFormData) => {
        try {
            const apiData = transformCustomerToAPI(data);

            if (customerId) {
                await updateCustomer.mutateAsync({ id: customerId, data: apiData });
            } else {
                await createCustomer.mutateAsync(apiData);
            }

            onSuccess?.();
        } catch (error) {
            console.error("Failed to save customer:", error);
        }
    };

    const customerTypeOptions = [
        { value: "wholesale", label: "Wholesale Client", description: "Bulk orders with wholesale pricing" },
        { value: "distributor", label: "Distributor", description: "Authorized reseller with special terms" },
        { value: "retail", label: "Retail Customer", description: "Individual or small business customer" }
    ];

    const businessCategories = [
        { value: "manufacturing", label: "Manufacturing" },
        { value: "construction", label: "Construction" },
        { value: "agriculture", label: "Agriculture" },
        { value: "automotive", label: "Automotive" },
        { value: "textile", label: "Textile" },
        { value: "other", label: "Other" }
    ];

    const paymentTermsOptions = [
        { value: "net15", label: "Net 15 Days" },
        { value: "net30", label: "Net 30 Days" },
        { value: "net45", label: "Net 45 Days" },
        { value: "net60", label: "Net 60 Days" },
        { value: "cod", label: "Cash on Delivery" },
        { value: "advance", label: "Advance Payment" }
    ];

    return (
        <Form
            title={customerId ? "Edit Customer" : "Add New Customer"}
            description="Enter the customer details for Sanvi Machinery business management"
            onSubmit={handleSubmit(onSubmit)}
        >
            <FormSection
                title="Basic Information"
                description="Primary contact and company details"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Company Name"
                        {...form.register("companyName")}
                        error={errors.companyName?.message}
                        placeholder="Enter company name"
                    />
                    <Input
                        label="Contact Person"
                        {...form.register("contactPerson")}
                        error={errors.contactPerson?.message}
                        placeholder="Primary contact name"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Email Address"
                        type="email"
                        {...form.register("email")}
                        error={errors.email?.message}
                        placeholder="contact@company.com"
                    />
                    <Input
                        label="Phone Number"
                        type="tel"
                        {...form.register("phone")}
                        error={errors.phone?.message}
                        placeholder="+91 98765 43210"
                    />
                </div>
            </FormSection>

            <FormSection
                title="Address Information"
                description="Business address and location details"
            >
                <Textarea
                    label="Street Address"
                    {...form.register("address")}
                    error={errors.address?.message}
                    placeholder="Enter complete address"
                    rows={2}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                        label="City"
                        {...form.register("city")}
                        error={errors.city?.message}
                        placeholder="City name"
                    />
                    <Input
                        label="State"
                        {...form.register("state")}
                        error={errors.state?.message}
                        placeholder="State/Province"
                    />
                    <Input
                        label="ZIP/Postal Code"
                        {...form.register("zipCode")}
                        error={errors.zipCode?.message}
                        placeholder="400001"
                    />
                </div>

                <Input
                    label="Country"
                    {...form.register("country")}
                    error={errors.country?.message}
                    placeholder="Country"
                />
            </FormSection>

            <FormSection
                title="Business Details"
                description="Customer type and business classification"
            >
                <RadioGroup
                    name="customerType"
                    label="Customer Type"
                    options={customerTypeOptions}
                    value={watch("customerType")}
                    onChange={(value) => setValue("customerType", value as CustomerFormData["customerType"])}
                    error={errors.customerType?.message}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                        label="Business Category"
                        options={businessCategories}
                        {...form.register("businessCategory")}
                        error={errors.businessCategory?.message}
                        placeholder="Select category"
                    />
                    <Input
                        label="Tax ID / GST Number"
                        {...form.register("taxId")}
                        error={errors.taxId?.message}
                        placeholder="GST123456789"
                    />
                </div>
            </FormSection>

            <FormSection
                title="Credit & Payment Terms"
                description="Financial arrangements and credit limits"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Credit Limit (₹)"
                        type="number"
                        {...form.register("creditLimit", { valueAsNumber: true })}
                        error={errors.creditLimit?.message}
                        placeholder="0"
                        min="0"
                    />
                    <Select
                        label="Payment Terms"
                        options={paymentTermsOptions}
                        {...form.register("paymentTerms")}
                        error={errors.paymentTerms?.message}
                    />
                </div>
            </FormSection>

            <FormSection
                title="Communication Preferences"
                description="How would you like to communicate with this customer"
            >
                <RadioGroup
                    name="preferredCommunication"
                    label="Preferred Communication Method"
                    options={[
                        { value: "email", label: "Email", description: "Send updates via email" },
                        { value: "phone", label: "Phone", description: "Contact via phone calls" },
                        { value: "both", label: "Both", description: "Use both email and phone" }
                    ]}
                    value={watch("preferredCommunication")}
                    onChange={(value) => setValue("preferredCommunication", value as CustomerFormData["preferredCommunication"])}
                    orientation="horizontal"
                    error={errors.preferredCommunication?.message}
                />

                <Checkbox
                    label="Subscribe to Newsletter"
                    description="Send product updates and company news"
                    checked={watch("newsletter")}
                    onChange={(e) => setValue("newsletter", e.target.checked)}
                    error={errors.newsletter?.message}
                />

                <Textarea
                    label="Special Instructions"
                    {...form.register("specialInstructions")}
                    error={errors.specialInstructions?.message}
                    placeholder="Any special handling instructions or notes..."
                    helperText="Optional notes about this customer's preferences or requirements"
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
                    {isLoading ? "Saving..." : customerId ? "Update Customer" : "Create Customer"}
                </Button>
            </FormActions>
        </Form>
    );
}