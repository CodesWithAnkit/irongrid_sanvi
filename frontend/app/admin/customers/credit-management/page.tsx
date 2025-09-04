"use client";

import { AdminLayout } from "@/components/layout/enhanced-admin-layout";
import { ComingSoon } from "@/components/admin/coming-soon";

export default function CreditManagementPage() {
  return (
    <AdminLayout title="Credit Management" user={{ name: "Admin", email: "admin@sanvi.local" }}>
      <ComingSoon 
        title="Credit Management"
        description="Monitor customer credit limits, outstanding amounts, and payment terms for B2B customers."
      />
    </AdminLayout>
  );
}