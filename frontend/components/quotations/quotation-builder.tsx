"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { quotationBuilderSchema, type QuotationBuilderFormData } from "@/features/quotations/schemas";
import { type QuotationWizardStep, type QuotationBuilderData } from "@/features/quotations/types";
import { CustomerSelectionStep } from "./steps/customer-selection-step";
import { ProductConfigurationStep } from "./steps/product-configuration-step";
import { PricingTermsStep } from "./steps/pricing-terms-step";
import { ReviewSendStep } from "./steps/review-send-step";
import { WizardProgress } from "./wizard-progress";
import { cn } from "@/lib/cn";

export interface QuotationBuilderProps {
  initialData?: Partial<QuotationBuilderData>;
  onSave?: (data: QuotationBuilderFormData) => Promise<void>;
  onCancel?: () => void;
  onComplete?: (quotationId: string) => void;
}

const WIZARD_STEPS: QuotationWizardStep[] = [
  {
    id: "customer",
    title: "Customer Selection",
    description: "Select or create customer",
    isCompleted: false,
    isActive: true,
  },
  {
    id: "products",
    title: "Product Configuration",
    description: "Add products and specifications",
    isCompleted: false,
    isActive: false,
  },
  {
    id: "pricing",
    title: "Pricing & Terms",
    description: "Set pricing and terms",
    isCompleted: false,
    isActive: false,
  },
  {
    id: "review",
    title: "Review & Send",
    description: "Review and send quotation",
    isCompleted: false,
    isActive: false,
  },
];

export function QuotationBuilder({
  initialData,
  onSave,
  onCancel,
  onComplete,
}: QuotationBuilderProps) {
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
  const [steps, setSteps] = React.useState<QuotationWizardStep[]>(WIZARD_STEPS);
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<QuotationBuilderFormData>({
    resolver: zodResolver(quotationBuilderSchema),
    defaultValues: {
      customer: {
        name: "",
        email: "",
        phone: "",
        company: "",
        address: "",
        isNewCustomer: false,
      },
      items: [],
      pricing: {
        subtotal: 0,
        taxRate: 18,
        taxAmount: 0,
        shippingCost: 0,
        totalDiscount: 0,
        grandTotal: 0,
      },
      terms: {
        paymentTerms: "net30",
        deliveryTerms: "FOB Origin",
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: "",
      },
      review: {
        quotationNumber: `QUO-${Date.now()}`,
        status: "DRAFT",
      },
      ...initialData,
    },
    mode: "onChange",
  });

  const { handleSubmit, trigger, formState: { errors, isValid } } = form;

  const currentStep = steps[currentStepIndex];

  // Update step completion status based on form validation
  React.useEffect(() => {
    const updateStepCompletion = async () => {
      const newSteps = [...steps];
      
      // Check customer step
      const customerValid = await trigger("customer");
      newSteps[0].isCompleted = customerValid;
      
      // Check products step
      const itemsValid = await trigger("items");
      newSteps[1].isCompleted = itemsValid;
      
      // Check pricing step
      const pricingValid = await trigger(["pricing", "terms"]);
      newSteps[2].isCompleted = pricingValid;
      
      // Review step is completed when all previous steps are valid
      newSteps[3].isCompleted = customerValid && itemsValid && pricingValid;
      
      setSteps(newSteps);
    };

    updateStepCompletion();
  }, [form.watch(), trigger, steps]);

  const goToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      const newSteps = steps.map((step, index) => ({
        ...step,
        isActive: index === stepIndex,
      }));
      setSteps(newSteps);
      setCurrentStepIndex(stepIndex);
    }
  };

  const goToNextStep = async () => {
    const isCurrentStepValid = await validateCurrentStep();
    if (isCurrentStepValid && currentStepIndex < steps.length - 1) {
      goToStep(currentStepIndex + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      goToStep(currentStepIndex - 1);
    }
  };

  const validateCurrentStep = async (): Promise<boolean> => {
    switch (currentStep.id) {
      case "customer":
        return await trigger("customer");
      case "products":
        return await trigger("items");
      case "pricing":
        return await trigger(["pricing", "terms"]);
      case "review":
        return await trigger("review");
      default:
        return false;
    }
  };

  const handleSaveAsDraft = async () => {
    setIsLoading(true);
    try {
      const formData = form.getValues();
      formData.review.status = "DRAFT";
      await onSave?.(formData);
    } catch (error) {
      console.error("Failed to save draft:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async (data: QuotationBuilderFormData) => {
    setIsLoading(true);
    try {
      await onSave?.(data);
      onComplete?.(data.review.quotationNumber);
    } catch (error) {
      console.error("Failed to complete quotation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderCurrentStep = () => {
    const stepProps = {
      form,
      onNext: goToNextStep,
      onPrevious: goToPreviousStep,
      isValid: steps[currentStepIndex].isCompleted,
    };

    switch (currentStep.id) {
      case "customer":
        return <CustomerSelectionStep {...stepProps} />;
      case "products":
        return <ProductConfigurationStep {...stepProps} />;
      case "pricing":
        return <PricingTermsStep {...stepProps} />;
      case "review":
        return <ReviewSendStep {...stepProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Quotation</h1>
          <p className="text-gray-600">Build a professional quotation step by step</p>
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveAsDraft}
            disabled={isLoading}
          >
            Save as Draft
          </Button>
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
        </div>
      </div>

      {/* Progress Indicator */}
      <WizardProgress
        steps={steps}
        currentStepIndex={currentStepIndex}
        onStepClick={goToStep}
      />

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold">
              {currentStepIndex + 1}
            </span>
            <div>
              <h2 className="text-xl font-semibold">{currentStep.title}</h2>
              <p className="text-sm text-gray-600 font-normal">{currentStep.description}</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleComplete)} className="space-y-6">
            {renderCurrentStep()}
          </form>
        </CardContent>
      </Card>

      {/* Debug Info (Development only) */}
      {process.env.NODE_ENV === "development" && (
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="text-sm">Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs space-y-2">
              <div>Current Step: {currentStep.id} ({currentStepIndex + 1}/{steps.length})</div>
              <div>Step Valid: {steps[currentStepIndex].isCompleted ? "Yes" : "No"}</div>
              <div>Form Valid: {isValid ? "Yes" : "No"}</div>
              {Object.keys(errors).length > 0 && (
                <div>
                  <div className="font-semibold">Errors:</div>
                  <pre className="text-red-600">{JSON.stringify(errors, null, 2)}</pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}