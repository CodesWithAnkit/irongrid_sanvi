"use client";

import { AdminLayout } from "@/components/layout/enhanced-admin-layout";
import { ComingSoon } from "@/components/admin/coming-soon";

export default function InventoryPage() {
  return (
    <AdminLayout title="Inventory" user={{ name: "Admin", email: "admin@sanvi.local" }}>
      <ComingSoon 
        title="Stock Management"
        description="Track inventory levels, manage stock across multiple locations, and set reorder points."
      />
    </AdminLayout>
  );
}