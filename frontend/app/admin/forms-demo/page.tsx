"use client";

import * as React from "react";
import { AdminLayout } from "@/components/layout/enhanced-admin-layout";
import { CustomerForm } from "@/components/forms/customer-form";
import { ProductForm } from "@/components/forms/product-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type DemoForm = "customer" | "product" | "quotation";

export default function FormsDemo() {
  const [activeForm, setActiveForm] = React.useState<DemoForm>("customer");
  const [isLoading, setIsLoading] = React.useState(false);

  const handleFormSubmit = (data: any) => {
    setIsLoading(true);
    console.log("Form submitted:", data);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      alert("Form submitted successfully! Check console for data.");
    }, 2000);
  };

  const mockCustomers = [
    { id: "1", name: "ABC Manufacturing", email: "contact@abc.com", phone: "+91 98765 43210" },
    { id: "2", name: "XYZ Industries", email: "info@xyz.com", phone: "+91 87654 32109" }
  ];

  const mockProducts = [
    { id: "1", name: "Industrial Drill Machine", price: 25000 },
    { id: "2", name: "Welding Equipment Set", price: 45000 },
    { id: "3", name: "Precision Cutting Tool", price: 8500 }
  ];

  return (
  <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Forms Demo</h1>
          <p className="text-gray-600">Interactive demonstration of Sanvi Machinery form components</p>
        </div>

        {/* Form Selector */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Select Form to Demo</h2>
          <div className="flex gap-4">
            <Button
              variant={activeForm === "customer" ? "primary" : "outline"}
              onClick={() => setActiveForm("customer")}
            >
              Customer Form
            </Button>
            <Button
              variant={activeForm === "product" ? "primary" : "outline"}
              onClick={() => setActiveForm("product")}
            >
              Product Form
            </Button>
            <Button
              variant={activeForm === "quotation" ? "primary" : "outline"}
              onClick={() => setActiveForm("quotation")}
            >
              Quotation Form
            </Button>
          </div>
        </Card>

        {/* Form Display */}
        <Card className="p-6">
          {activeForm === "customer" && (
            <CustomerForm
              onSuccess={() => alert("Customer saved successfully!")}
              onCancel={() => alert("Form cancelled")}
            />
          )}

          {activeForm === "product" && (
            <ProductForm
              onSuccess={() => alert("Product saved successfully!")}
              onCancel={() => alert("Form cancelled")}
            />
          )}

          {activeForm === "quotation" && (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Quotation form coming soon...</p>
              <p className="text-sm text-gray-400">This will integrate with customers and products APIs</p>
            </div>
          )}
        </Card>

        {/* Usage Instructions */}
        <Card className="p-6 bg-blue-50">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Usage Instructions</h3>
          <div className="text-blue-800 space-y-2">
            <p>• All form components are located in <code className="bg-blue-100 px-1 rounded">components/ui/</code></p>
            <p>• Form examples are in <code className="bg-blue-100 px-1 rounded">components/examples/</code></p>
            <p>• Import components: <code className="bg-blue-100 px-1 rounded">import {`{ Input, Select, Form }`} from "@/components/ui"</code></p>
            <p>• All forms include validation, error handling, and consistent styling</p>
            <p>• Components follow Sanvi Machinery design system with proper branding colors</p>
          </div>
        </Card>
      </div>
  </AdminLayout>
  );
}