"use client";

import { AdminLayout } from "@/components/layout/enhanced-admin-layout";
import { ComingSoon } from "@/components/admin/coming-soon";

export default function WholesaleCustomersPage() {
  return (
    <AdminLayout title="Wholesale Customers" user={{ name: "Admin", email: "admin@sanvi.local" }}>
      <ComingSoon 
        title="Wholesale Customers"
        description="Manage your wholesale customer accounts, special pricing tiers, and bulk order preferences."
      />
    </AdminLayout>
  );
}