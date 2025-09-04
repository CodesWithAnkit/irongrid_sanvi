"use client";

import * as React from "react";
import { UseFormReturn } from "react-hook-form";
import { Calculator, FileText, ChevronLeft, ChevronRight, Percent, Truck, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormSection, FormActions } from "@/components/ui/form";
import { type QuotationBuilderFormData } from "@/features/quotations/schemas";
import { type TermsTemplate } from "@/features/quotations/types";
import { cn } from "@/lib/cn";

export interface PricingTermsStepProps {
  form: UseFormReturn<QuotationBuilderFormData>;
  onNext: () => void;
  onPrevious: () => void;
  isValid: boolean;
}

// Mock terms templates - in real app, these would come from an API
const TERMS_TEMPLATES: TermsTemplate[] = [
  {
    id: "standard",
    name: "Standard Terms",
    content: "Payment due within specified terms. Delivery as per agreed schedule. All prices are subject to applicable taxes.",
    category: "Standard",
  },
  {
    id: "industrial",
    name: "Industrial Equipment Terms",
    content: "Installation and commissioning included. 2-year comprehensive warranty. Training provided for 2 operators. Payment terms as agreed.",
    category: "Industrial",
  },
  {
    id: "bulk",
    name: "Bulk Order Terms",
    content: "Volume discount applied. Staggered delivery available. Extended payment terms for bulk orders. Quality assurance certificate provided.",
    category: "Bulk",
  },
];

const PAYMENT_TERMS_OPTIONS = [
  { value: "advance", label: "100% Advance" },
  { value: "net15", label: "Net 15 Days" },
  { value: "net30", label: "Net 30 Days" },
  { value: "net45", label: "Net 45 Days" },
  { value: "net60", label: "Net 60 Days" },
  { value: "cod", label: "Cash on Delivery" },
  { value: "partial", label: "50% Advance, 50% on Delivery" },
];

const DELIVERY_TERMS_OPTIONS = [
  { value: "FOB Origin", label: "FOB Origin" },
  { value: "FOB Destination", label: "FOB Destination" },
  { value: "CIF", label: "Cost, Insurance & Freight" },
  { value: "Ex Works", label: "Ex Works (EXW)" },
  { value: "Delivered", label: "Delivered Duty Paid (DDP)" },
];

export function PricingTermsStep({
  form,
  onNext,
  onPrevious,
  isValid,
}: PricingTermsStepProps) {
  const { register, setValue, watch, formState: { errors } } = form;
  
  const items = watch("items") || [];
  const pricing = watch("pricing");
  const terms = watch("terms");

  // Calculate pricing automatically when items change
  React.useEffect(() => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const totalDiscount = items.reduce((sum, item) => {
      const discountAmount = (item.unitPrice * item.quantity * item.discount) / 100;
      return sum + discountAmount;
    }, 0);
    
    const taxAmount = (subtotal * pricing.taxRate) / 100;
    const grandTotal = subtotal + taxAmount + pricing.shippingCost;

    setValue("pricing.subtotal", subtotal);
    setValue("pricing.totalDiscount", totalDiscount);
    setValue("pricing.taxAmount", taxAmount);
    setValue("pricing.grandTotal", grandTotal);
  }, [items, pricing.taxRate, pricing.shippingCost, setValue]);

  const handleTermsTemplateChange = (templateId: string) => {
    const template = TERMS_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setValue("terms.termsTemplate", templateId);
      setValue("terms.notes", template.content);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Pricing Calculations */}
      <FormSection
        title="Pricing Calculations"
        description="Configure tax rates, shipping, and view pricing breakdown"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tax Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Percent className="w-4 h-4" />
                Tax Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Tax Rate (%)"
                type="number"
                {...register("pricing.taxRate", { valueAsNumber: true })}
                error={errors.pricing?.taxRate?.message}
                min="0"
                max="100"
                step="0.1"
                placeholder="18"
              />
              <div className="text-sm text-gray-600">
                <p>Common tax rates:</p>
                <div className="flex gap-2 mt-1">
                  {[0, 5, 12, 18, 28].map(rate => (
                    <Button
                      key={rate}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setValue("pricing.taxRate", rate)}
                      className="text-xs"
                    >
                      {rate}%
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="w-4 h-4" />
                Shipping & Handling
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Shipping Cost (₹)"
                type="number"
                {...register("pricing.shippingCost", { valueAsNumber: true })}
                error={errors.pricing?.shippingCost?.message}
                min="0"
                step="0.01"
                placeholder="0"
              />
              <div className="text-sm text-gray-600">
                <p>Quick options:</p>
                <div className="flex gap-2 mt-1">
                  {[0, 1000, 2500, 5000].map(cost => (
                    <Button
                      key={cost}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setValue("pricing.shippingCost", cost)}
                      className="text-xs"
                    >
                      ₹{cost.toLocaleString()}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Summary */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              Pricing Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-700">Subtotal ({items.length} items):</span>
                <span className="font-medium">{formatCurrency(pricing.subtotal)}</span>
              </div>
              
              {pricing.totalDiscount > 0 && (
                <div className="flex justify-between items-center py-2 text-green-600">
                  <span>Total Discount:</span>
                  <span className="font-medium">-{formatCurrency(pricing.totalDiscount)}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-700">Tax ({pricing.taxRate}%):</span>
                <span className="font-medium">{formatCurrency(pricing.taxAmount)}</span>
              </div>
              
              {pricing.shippingCost > 0 && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Shipping & Handling:</span>
                  <span className="font-medium">{formatCurrency(pricing.shippingCost)}</span>
                </div>
              )}
              
              <div className="border-t border-blue-200 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Grand Total:</span>
                  <span className="text-xl font-bold text-blue-600">
                    {formatCurrency(pricing.grandTotal)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </FormSection>

      {/* Terms and Conditions */}
      <FormSection
        title="Terms & Conditions"
        description="Set payment terms, delivery terms, and validity period"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Payment Terms"
            options={PAYMENT_TERMS_OPTIONS}
            {...register("terms.paymentTerms")}
            error={errors.terms?.paymentTerms?.message}
            placeholder="Select payment terms"
          />
          
          <Select
            label="Delivery Terms"
            options={DELIVERY_TERMS_OPTIONS}
            {...register("terms.deliveryTerms")}
            error={errors.terms?.deliveryTerms?.message}
            placeholder="Select delivery terms"
          />
        </div>

        <Input
          label="Valid Until"
          type="date"
          {...register("terms.validUntil")}
          error={errors.terms?.validUntil?.message}
          min={new Date().toISOString().split('T')[0]}
        />

        {/* Terms Templates */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Terms Template (Optional)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {TERMS_TEMPLATES.map((template) => (
                <Card
                  key={template.id}
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:shadow-md",
                    terms.termsTemplate === template.id && "ring-2 ring-blue-500 bg-blue-50"
                  )}
                  onClick={() => handleTermsTemplateChange(template.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-sm">{template.name}</span>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-3">
                      {template.content}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Custom Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes & Terms
            </label>
            <textarea
              {...register("terms.notes")}
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter any additional terms, conditions, or notes for this quotation..."
            />
            {errors.terms?.notes && (
              <p className="text-sm text-red-600 mt-1">{errors.terms.notes.message}</p>
            )}
          </div>
        </div>
      </FormSection>

      {/* Validity and Expiration */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">Quotation Validity</h4>
              <p className="text-sm text-yellow-700 mt-1">
                This quotation will be valid until {new Date(terms.validUntil).toLocaleDateString('en-IN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}. After this date, prices and terms may be subject to change.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <FormActions>
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Products
        </Button>
        <Button
          type="button"
          onClick={onNext}
          disabled={!isValid}
          className="flex items-center gap-2"
        >
          Continue to Review
          <ChevronRight className="w-4 h-4" />
        </Button>
      </FormActions>
    </div>
  );
}