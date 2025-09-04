"use client";

import * as React from "react";
import { Check, ChevronRight } from "lucide-react";
import { type QuotationWizardStep } from "@/features/quotations/types";
import { cn } from "@/lib/cn";

export interface WizardProgressProps {
  steps: QuotationWizardStep[];
  currentStepIndex: number;
  onStepClick?: (stepIndex: number) => void;
}

export function WizardProgress({ steps, currentStepIndex, onStepClick }: WizardProgressProps) {
  return (
    <div className="w-full">
      <nav aria-label="Progress">
        <ol className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = index === currentStepIndex;
            const isCompleted = step.isCompleted;
            const isClickable = onStepClick && (isCompleted || index <= currentStepIndex);

            return (
              <li key={step.id} className="flex-1 relative">
                <div className="flex items-center">
                  {/* Step Circle */}
                  <button
                    type="button"
                    onClick={() => isClickable && onStepClick(index)}
                    disabled={!isClickable}
                    className={cn(
                      "relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200",
                      isActive && "border-blue-600 bg-blue-600 text-white",
                      isCompleted && !isActive && "border-green-600 bg-green-600 text-white",
                      !isActive && !isCompleted && "border-gray-300 bg-white text-gray-500",
                      isClickable && "hover:border-blue-400 cursor-pointer",
                      !isClickable && "cursor-not-allowed"
                    )}
                    aria-current={isActive ? "step" : undefined}
                  >
                    {isCompleted && !isActive ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </button>

                  {/* Step Content */}
                  <div className="ml-4 min-w-0 flex-1">
                    <div
                      className={cn(
                        "text-sm font-medium transition-colors duration-200",
                        isActive && "text-blue-600",
                        isCompleted && !isActive && "text-green-600",
                        !isActive && !isCompleted && "text-gray-500"
                      )}
                    >
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {step.description}
                    </div>
                  </div>

                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className="hidden sm:block absolute top-5 left-10 w-full h-0.5 bg-gray-200">
                      <div
                        className={cn(
                          "h-full bg-blue-600 transition-all duration-300",
                          isCompleted ? "w-full" : "w-0"
                        )}
                      />
                    </div>
                  )}

                  {/* Mobile Chevron */}
                  {index < steps.length - 1 && (
                    <ChevronRight className="sm:hidden w-5 h-5 text-gray-400 mx-2" />
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Mobile Progress Bar */}
      <div className="sm:hidden mt-4">
        <div className="bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((currentStepIndex + 1) / steps.length) * 100}%`,
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>Step {currentStepIndex + 1} of {steps.length}</span>
          <span>{Math.round(((currentStepIndex + 1) / steps.length) * 100)}% Complete</span>
        </div>
      </div>
    </div>
  );
}