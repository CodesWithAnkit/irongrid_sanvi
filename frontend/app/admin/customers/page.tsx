"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/layout/enhanced-admin-layout";
import AdminPageHeader from "@/components/ui/admin-page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { SearchFilter } from "@/components/ui/search-filter";
import { useCustomers, useDeleteCustomer } from "@/features/customers/hooks";
import { Customer } from "@/features/customers/types";

export default function CustomersPage() {
  const router = useRouter();
  const { data: customers, isLoading, error } = useCustomers();
  const deleteCustomer = useDeleteCustomer();
  
  // Search and filter state
  const [searchValue, setSearchValue] = React.useState("");
  const [filterValues, setFilterValues] = React.useState<Record<string, string>>({});

  // Filter customers based on search and filters
  const filteredCustomers = React.useMemo(() => {
    if (!customers) return [];
    
    return customers.filter(customer => {
      // Search filter
      const searchMatch = !searchValue || 
        customer.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchValue.toLowerCase()) ||
        (customer.company && customer.company.toLowerCase().includes(searchValue.toLowerCase()));
      
      // Additional filters can be added here
      const hasCompanyFilter = filterValues.hasCompany;
      const companyMatch = !hasCompanyFilter || 
        (hasCompanyFilter === "yes" && customer.company) ||
        (hasCompanyFilter === "no" && !customer.company);
      
      return searchMatch && companyMatch;
    });
  }, [customers, searchValue, filterValues]);

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this customer?")) {
      try {
        await deleteCustomer.mutateAsync(id);
      } catch (error) {
        console.error("Failed to delete customer:", error);
      }
    }
  };

  const handleBulkDelete = async (selectedIds: string[]) => {
    if (confirm(`Are you sure you want to delete ${selectedIds.length} customers? This action cannot be undone.`)) {
      try {
        await Promise.all(selectedIds.map(id => deleteCustomer.mutateAsync(parseInt(id))));
      } catch (error) {
        console.error("Failed to delete customers:", error);
      }
    }
  };

  const handleBulkExport = (selectedIds: string[]) => {
    const selectedCustomers = customers?.filter(customer => 
      selectedIds.includes(customer.id.toString())
    );
    
    if (selectedCustomers) {
      const csvContent = [
        "ID,Name,Email,Phone,Company,Address,Created",
        ...selectedCustomers.map(customer => 
          `${customer.id},"${customer.name}","${customer.email}","${customer.phone || ''}","${customer.company || ''}","${customer.address || ''}","${new Date(customer.createdAt).toLocaleDateString()}"`
        )
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const columns: Column<Customer>[] = [
    {
      key: "customer",
      label: "Customer",
      render: (customer) => (
        <div className="flex items-center">
          <div className="w-10 h-10 bg-[var(--color-sanvi-primary-100)] rounded-full flex items-center justify-center">
            <span className="text-[var(--color-sanvi-primary-700)] font-medium">
              {customer.name[0].toUpperCase()}
            </span>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {customer.name}
            </div>
            <div className="text-sm text-gray-500">
              ID: {customer.id}
            </div>
          </div>
        </div>
      )
    },
    {
      key: "company",
      label: "Company",
      render: (customer) => (
        <div className="text-sm text-gray-900">{customer.company || "—"}</div>
      )
    },
    {
      key: "contact",
      label: "Contact",
      render: (customer) => (
        <div>
          <div className="text-sm text-gray-900">{customer.email}</div>
          <div className="text-sm text-gray-500">{customer.phone || "—"}</div>
        </div>
      )
    },
    {
      key: "created",
      label: "Created",
      render: (customer) => (
        <div className="text-sm text-gray-500">
          {new Date(customer.createdAt).toLocaleDateString()}
        </div>
      )
    },
    {
      key: "actions",
      label: "Actions",
      render: (customer) => (
        <div className="text-sm font-medium space-x-2">
          <Link 
            href={`/admin/customers/${customer.id}`}
            className="text-[var(--color-sanvi-primary-600)] hover:text-[var(--color-sanvi-primary-900)]"
          >
            View
          </Link>
          <Link 
            href={`/admin/customers/${customer.id}/edit`}
            className="text-blue-600 hover:text-blue-900"
          >
            Edit
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(customer.id);
            }}
            className="text-red-600 hover:text-red-900"
            disabled={deleteCustomer.isPending}
          >
            Delete
          </button>
        </div>
      )
    }
  ];

  const bulkActions = [
    {
      id: "export",
      label: "Export Selected",
      onClick: handleBulkExport
    },
    {
      id: "delete",
      label: "Delete Selected",
      variant: "destructive" as const,
      onClick: handleBulkDelete
    }
  ];

  const filterOptions = [
    {
      key: "hasCompany",
      label: "Company",
      options: [
        { value: "yes", label: "Has Company" },
        { value: "no", label: "No Company" }
      ]
    }
  ];

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setSearchValue("");
    setFilterValues({});
  };

  const headerActions = (
    <div className="flex gap-3">
      <Button 
        variant="outline"
        onClick={() => handleBulkExport(filteredCustomers.map(c => c.id.toString()))}
        className="border-white text-white hover:bg-white hover:text-[var(--color-sanvi-primary-700)]"
      >
        Export All ({filteredCustomers.length})
      </Button>
      <Link href="/admin/customers/new">
        <Button className="bg-white text-[var(--color-sanvi-primary-700)] hover:bg-gray-100">
          Add New Customer
        </Button>
      </Link>
    </div>
  );

  return (
  <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title="Customer Management"
          subtitle="Business Relationships"
          description="Manage your wholesale clients, distributors, and retail customers"
          actions={headerActions}
          compact
        />

        <div className="px-6">
          {error && (
            <Card className="p-8 text-center">
              <div className="text-red-600">Failed to load customers. Please try again.</div>
            </Card>
          )}

          {!error && (
            <>
              <SearchFilter
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                filters={filterOptions}
                filterValues={filterValues}
                onFilterChange={handleFilterChange}
                onClearFilters={clearFilters}
                placeholder="Search customers by name, email, or company..."
              />

              {customers && customers.length === 0 && !isLoading && (
                <Card className="p-8 text-center">
                  <div className="text-gray-500 mb-4">No customers found</div>
                  <Link href="/admin/customers/new">
                    <Button>Add Your First Customer</Button>
                  </Link>
                </Card>
              )}

              <DataTable
                data={filteredCustomers}
                columns={columns}
                keyField="id"
                bulkActions={bulkActions}
                onRowClick={(customer) => router.push(`/admin/customers/${customer.id}`)}
                loading={isLoading}
                emptyMessage={
                  searchValue || Object.values(filterValues).some(v => v) 
                    ? "No customers match your search criteria" 
                    : "No customers found"
                }
              />
            </>
          )}
        </div>
      </div>
  </AdminLayout>
  );
}