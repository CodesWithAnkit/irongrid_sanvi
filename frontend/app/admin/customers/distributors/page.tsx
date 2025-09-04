"use client";

import { AdminLayout } from "@/components/layout/enhanced-admin-layout";
import { ComingSoon } from "@/components/admin/coming-soon";

export default function DistributorsPage() {
  return (
    <AdminLayout title="Distributors" user={{ name: "Admin", email: "admin@sanvi.local" }}>
      <ComingSoon 
        title="Distributor Management"
        description="Manage your distributor network, territory assignments, and commission structures."
      />
    </AdminLayout>
  );
}