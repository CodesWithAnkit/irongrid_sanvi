"use client";

import { AdminLayout } from "@/components/layout/enhanced-admin-layout";
import { ComingSoon } from "@/components/admin/coming-soon";

export default function ReportsPage() {
  return (
  <AdminLayout title="Reports">
      <ComingSoon 
        title="Business Reports"
        description="Generate comprehensive reports on sales, inventory, customer analytics, and financial performance."
      />
  </AdminLayout>
  );
}