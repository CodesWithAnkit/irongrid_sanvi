"use client";

import { AdminLayout } from "@/components/layout/enhanced-admin-layout";
import { Dashboard } from "@/components/admin/dashboard";

export default function AdminHome() {
  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Dashboard', isActive: true },
  ];

  return (
    <AdminLayout 
      title="Dashboard Overview"
      breadcrumbs={breadcrumbs}
    >
      <Dashboard />
    </AdminLayout>
  );
}
