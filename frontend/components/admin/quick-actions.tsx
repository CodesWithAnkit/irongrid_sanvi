"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  variant?: 'primary' | 'secondary' | 'outline';
  badge?: string;
}

export interface QuickActionsProps {
  actions?: QuickAction[];
  className?: string;
}

const defaultActions: QuickAction[] = [
  {
    id: 'new-quotation',
    label: 'New Quotation',
    description: 'Create a new quotation for a customer',
    href: '/admin/quotations/create',
    variant: 'primary',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ),
  },
  {
    id: 'add-customer',
    label: 'Add Customer',
    description: 'Register a new customer',
    href: '/admin/customers/create',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    id: 'add-product',
    label: 'Add Product',
    description: 'Add new product to catalog',
    href: '/admin/products/create',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    id: 'pending-approvals',
    label: 'Pending Approvals',
    description: 'Review quotations awaiting approval',
    href: '/admin/quotations?status=pending',
    badge: '23',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'view-reports',
    label: 'View Reports',
    description: 'Access business analytics and reports',
    href: '/admin/reports',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: 'bulk-import',
    label: 'Bulk Import',
    description: 'Import customers or products in bulk',
    href: '/admin/import',
    variant: 'outline',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
      </svg>
    ),
  },
];

export function QuickActions({ actions = defaultActions, className }: QuickActionsProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className || ''}`}>
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        <p className="text-sm text-gray-600 mt-1">Frequently used actions and shortcuts</p>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {actions.map((action) => (
            <a
              key={action.id}
              href={action.href}
              className="group relative flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200"
            >
              <div className={`flex-shrink-0 p-2 rounded-lg ${
                action.variant === 'primary' 
                  ? 'bg-[var(--color-sanvi-primary-100)] text-[var(--color-sanvi-primary-700)]'
                  : action.variant === 'secondary'
                  ? 'bg-[var(--color-sanvi-secondary-100)] text-[var(--color-sanvi-secondary-500)]'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {action.icon}
                {action.badge && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {action.badge}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-gray-900 group-hover:text-[var(--color-sanvi-primary-700)] transition-colors">
                    {action.label}
                  </h4>
                  {action.badge && (
                    <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                      {action.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {action.description}
                </p>
              </div>
              <div className="flex-shrink-0">
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}