"use client";

import * as React from "react";
import { UseFormReturn } from "react-hook-form";
import { 
  FileText, 
  Send, 
  Eye, 
  Download, 
  Mail, 
  User, 
  Building, 
  Package, 
  Calculator,
  ChevronLeft,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormSection, FormActions } from "@/components/ui/form";
import { type QuotationBuilderFormData } from "@/features/quotations/schemas";
import { type EmailTemplate } from "@/features/quotations/types";
import { cn } from "@/lib/cn";

export interface ReviewSendStepProps {
  form: UseFormReturn<QuotationBuilderFormData>;
  onNext: () => void;
  onPrevious: () => void;
  isValid: boolean;
}

// Mock email templates - in real app, these would come from an API
const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "standard",
    name: "Standard Quotation",
    subject: "Quotation #{quotationNumber} from Sanvi Machinery",
    content: "Dear {customerName},\n\nPlease find attached our quotation #{quotationNumber} for your requirements.\n\nWe look forward to your response.\n\nBest regards,\nSanvi Machinery Team",
    variables: ["quotationNumber", "customerName"],
  },
  {
    id: "followup",
    name: "Follow-up Quotation",
    subject: "Follow-up: Quotation #{quotationNumber}",
    content: "Dear {customerName},\n\nWe hope you had a chance to review our quotation #{quotationNumber}.\n\nPlease let us know if you need any clarifications or modifications.\n\nBest regards,\nSanvi Machinery Team",
    variables: ["quotationNumber", "customerName"],
  },
  {
    id: "urgent",
    name: "Urgent Quotation",
    subject: "URGENT: Quotation #{quotationNumber} - Response Required",
    content: "Dear {customerName},\n\nPlease find our urgent quotation #{quotationNumber} attached.\n\nThis offer is valid for a limited time. Please respond at your earliest convenience.\n\nBest regards,\nSanvi Machinery Team",
    variables: ["quotationNumber", "customerName"],
  },
];

export function ReviewSendStep({
  form,
  onPrevious,
  isValid,
}: ReviewSendStepProps) {
  const [showEmailComposer, setShowEmailComposer] = React.useState(false);
  const [selectedTemplate, setSelectedTemplate] = React.useState<EmailTemplate | null>(null);

  const { register, setValue, watch, handleSubmit, formState: { errors } } = form;
  
  const customer = watch("customer");
  const items = watch("items") || [];
  const pricing = watch("pricing");
  const terms = watch("terms");
  const review = watch("review");

  // Initialize email options with customer email
  React.useEffect(() => {
    if (customer.email && !review.emailOptions?.recipientEmail) {
      setValue("review.emailOptions.recipientEmail", customer.email);
    }
  }, [customer.email, review.emailOptions?.recipientEmail, setValue]);

  const handleTemplateSelect = (templateId: string) => {
    const template = EMAIL_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      
      // Replace template variables
      const subject = template.subject
        .replace("{quotationNumber}", review.quotationNumber)
        .replace("{customerName}", customer.name);
      
      const message = template.content
        .replace("{quotationNumber}", review.quotationNumber)
        .replace("{customerName}", customer.name);

      setValue("review.emailOptions.template", templateId);
      setValue("review.emailOptions.subject", subject);
      setValue("review.emailOptions.message", message);
    }
  };

  const handleSendQuotation = async (data: QuotationBuilderFormData) => {
    // Set status to SENT when sending
    setValue("review.status", "SENT");
    
    // In a real implementation, this would:
    // 1. Generate PDF
    // 2. Send email
    // 3. Save quotation to database
    // 4. Show success message
    
    console.log("Sending quotation:", data);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPaymentTermsLabel = (value: string) => {
    const paymentTermsMap: Record<string, string> = {
      advance: "100% Advance",
      net15: "Net 15 Days",
      net30: "Net 30 Days",
      net45: "Net 45 Days",
      net60: "Net 60 Days",
      cod: "Cash on Delivery",
      partial: "50% Advance, 50% on Delivery",
    };
    return paymentTermsMap[value] || value;
  };

  return (
    <div className="space-y-6">
      {/* Quotation Summary */}
      <FormSection
        title="Quotation Summary"
        description="Review all details before sending"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="w-4 h-4" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="font-medium">{customer.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-gray-500" />
                <span>{customer.company}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <span>{customer.email}</span>
              </div>
              <div className="text-sm text-gray-600">
                <strong>Address:</strong> {customer.address}
              </div>
            </CardContent>
          </Card>

          {/* Quotation Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="w-4 h-4" />
                Quotation Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Quotation Number:</span>
                <span className="font-medium">{review.quotationNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Valid Until:</span>
                <span className="font-medium">
                  {new Date(terms.validUntil).toLocaleDateString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Terms:</span>
                <span className="font-medium">{getPaymentTermsLabel(terms.paymentTerms)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Terms:</span>
                <span className="font-medium">{terms.deliveryTerms}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Items Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Items Summary ({items.length} items)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">Product</th>
                    <th className="px-4 py-2 text-center font-medium text-gray-700">Qty</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-700">Unit Price</th>
                    <th className="px-4 py-2 text-center font-medium text-gray-700">Discount</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-900">{item.productName}</div>
                          {item.customSpecifications && (
                            <div className="text-xs text-gray-600 mt-1">
                              Specs: {item.customSpecifications}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-4 py-3 text-center">{item.discount}%</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Summary */}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Calculator className="w-5 h-5" />
              Final Pricing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(pricing.subtotal)}</span>
              </div>
              {pricing.totalDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Total Discount:</span>
                  <span>-{formatCurrency(pricing.totalDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax ({pricing.taxRate}%):</span>
                <span>{formatCurrency(pricing.taxAmount)}</span>
              </div>
              {pricing.shippingCost > 0 && (
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>{formatCurrency(pricing.shippingCost)}</span>
                </div>
              )}
              <div className="border-t border-green-200 pt-2">
                <div className="flex justify-between text-lg font-bold text-green-800">
                  <span>Grand Total:</span>
                  <span>{formatCurrency(pricing.grandTotal)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms and Notes */}
        {terms.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{terms.notes}</p>
            </CardContent>
          </Card>
        )}
      </FormSection>

      {/* PDF Preview and Actions */}
      <FormSection
        title="Document Actions"
        description="Preview, download, or send the quotation"
      >
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => {
              // In real implementation, this would open PDF preview
              console.log("Preview PDF");
            }}
          >
            <Eye className="w-4 h-4" />
            Preview PDF
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => {
              // In real implementation, this would download PDF
              console.log("Download PDF");
            }}
          >
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
          <Button
            type="button"
            className="flex items-center gap-2"
            onClick={() => setShowEmailComposer(!showEmailComposer)}
          >
            <Mail className="w-4 h-4" />
            {showEmailComposer ? "Hide Email Composer" : "Send via Email"}
          </Button>
        </div>
      </FormSection>

      {/* Email Composer */}
      {showEmailComposer && (
        <FormSection
          title="Email Composition"
          description="Compose and send the quotation via email"
        >
          <div className="space-y-4">
            {/* Template Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Template
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {EMAIL_TEMPLATES.map((template) => (
                  <Card
                    key={template.id}
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:shadow-md",
                      selectedTemplate?.id === template.id && "ring-2 ring-blue-500 bg-blue-50"
                    )}
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <CardContent className="p-3">
                      <div className="font-medium text-sm mb-1">{template.name}</div>
                      <div className="text-xs text-gray-600 line-clamp-2">
                        {template.subject}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Email Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Recipient Email"
                type="email"
                {...register("review.emailOptions.recipientEmail")}
                error={errors.review?.emailOptions?.recipientEmail?.message}
                placeholder="customer@company.com"
              />
              <Input
                label="Subject"
                {...register("review.emailOptions.subject")}
                error={errors.review?.emailOptions?.subject?.message}
                placeholder="Quotation from Sanvi Machinery"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Message
              </label>
              <textarea
                {...register("review.emailOptions.message")}
                rows={6}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email message..."
              />
              {errors.review?.emailOptions?.message && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.review.emailOptions.message.message}
                </p>
              )}
            </div>

            {/* Email Preview */}
            {review.emailOptions?.subject && review.emailOptions?.message && (
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-sm">Email Preview</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <div className="space-y-2">
                    <div><strong>To:</strong> {review.emailOptions.recipientEmail}</div>
                    <div><strong>Subject:</strong> {review.emailOptions.subject}</div>
                    <div className="border-t pt-2">
                      <div className="whitespace-pre-wrap">{review.emailOptions.message}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </FormSection>
      )}

      {/* Validation Status */}
      <Card className={cn(
        "border-2",
        isValid ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {isValid ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            )}
            <div>
              <h4 className={cn(
                "font-medium",
                isValid ? "text-green-800" : "text-yellow-800"
              )}>
                {isValid ? "Ready to Send" : "Review Required"}
              </h4>
              <p className={cn(
                "text-sm mt-1",
                isValid ? "text-green-700" : "text-yellow-700"
              )}>
                {isValid 
                  ? "All information has been validated and the quotation is ready to be sent."
                  : "Please review and complete all required information before sending."
                }
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
          Back to Pricing
        </Button>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setValue("review.status", "DRAFT")}
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Save as Draft
          </Button>
          <Button
            type="submit"
            disabled={!isValid}
            onClick={handleSubmit(handleSendQuotation)}
            className="flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send Quotation
          </Button>
        </div>
      </FormActions>
    </div>
  );
}