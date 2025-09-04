"use client";

import * as React from "react";
import { UseFormReturn } from "react-hook-form";
import { Search, Plus, User, Building, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormSection, FormActions } from "@/components/ui/form";
import { type QuotationBuilderFormData } from "@/features/quotations/schemas";
import { type Customer } from "@/features/customers/types";
import { useCustomers } from "@/features/customers/hooks";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { cn } from "@/lib/cn";

export interface CustomerSelectionStepProps {
  form: UseFormReturn<QuotationBuilderFormData>;
  onNext: () => void;
  onPrevious: () => void;
  isValid: boolean;
}

export function CustomerSelectionStep({
  form,
  onNext,
  isValid,
}: CustomerSelectionStepProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showNewCustomerForm, setShowNewCustomerForm] = React.useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<number | null>(null);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const { data: customers = [], isLoading: isLoadingCustomers } = useCustomers();

  const { register, setValue, watch, formState: { errors } } = form;
  const customerData = watch("customer");

  // Filter customers based on search query
  const filteredCustomers = React.useMemo(() => {
    if (!debouncedSearchQuery) return customers;
    
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      customer.company.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );
  }, [customers, debouncedSearchQuery]);

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    setValue("customer", {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      company: customer.company,
      address: customer.address,
      isNewCustomer: false,
    });
    setShowNewCustomerForm(false);
  };

  const handleNewCustomerToggle = () => {
    setShowNewCustomerForm(!showNewCustomerForm);
    setSelectedCustomerId(null);
    if (!showNewCustomerForm) {
      // Reset form when switching to new customer
      setValue("customer", {
        name: "",
        email: "",
        phone: "",
        company: "",
        address: "",
        isNewCustomer: true,
      });
    }
  };

  const handleCreateInlineCustomer = async () => {
    // In a real implementation, this would call the API to create the customer
    // For now, we'll just mark it as a new customer
    setValue("customer.isNewCustomer", true);
  };

  return (
    <div className="space-y-6">
      {/* Search and Toggle */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search customers by name, email, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleNewCustomerToggle}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {showNewCustomerForm ? "Select Existing" : "New Customer"}
        </Button>
      </div>

      {/* Customer Selection or Creation */}
      {showNewCustomerForm ? (
        <FormSection
          title="New Customer Information"
          description="Enter details for the new customer"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Customer Name *"
              {...register("customer.name")}
              error={errors.customer?.name?.message}
              placeholder="John Doe"
            />
            <Input
              label="Email Address *"
              type="email"
              {...register("customer.email")}
              error={errors.customer?.email?.message}
              placeholder="john@company.com"
            />
            <Input
              label="Phone Number *"
              {...register("customer.phone")}
              error={errors.customer?.phone?.message}
              placeholder="+91 98765 43210"
            />
            <Input
              label="Company Name *"
              {...register("customer.company")}
              error={errors.customer?.company?.message}
              placeholder="ABC Manufacturing"
            />
          </div>
          <Input
            label="Address *"
            {...register("customer.address")}
            error={errors.customer?.address?.message}
            placeholder="123 Industrial Area, City, State - 123456"
          />
        </FormSection>
      ) : (
        <div className="space-y-4">
          {/* Customer List */}
          {isLoadingCustomers ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredCustomers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomers.map((customer) => (
                <Card
                  key={customer.id}
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:shadow-md",
                    selectedCustomerId === customer.id && "ring-2 ring-blue-500 bg-blue-50"
                  )}
                  onClick={() => handleCustomerSelect(customer)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-gray-900">{customer.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Building className="w-4 h-4" />
                        <span>{customer.company}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{customer.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{customer.phone}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery ? "No customers match your search." : "No customers available."}
              </p>
              <Button
                type="button"
                onClick={handleNewCustomerToggle}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create New Customer
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Selected Customer Preview */}
      {selectedCustomerId && !showNewCustomerForm && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <User className="w-5 h-5" />
              Selected Customer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">{customerData.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-gray-500" />
                  <span>{customerData.company}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span>{customerData.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span>{customerData.phone}</span>
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                  <span>{customerData.address}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <FormActions>
        <Button
          type="button"
          onClick={onNext}
          disabled={!isValid}
          className="flex items-center gap-2"
        >
          Continue to Products
          <ChevronRight className="w-4 h-4" />
        </Button>
      </FormActions>
    </div>
  );
}

// Import ChevronRight for the continue button
import { ChevronRight } from "lucide-react";