"use client";

import { AdminLayout } from "@/components/layout/enhanced-admin-layout";
import { ComingSoon } from "@/components/admin/coming-soon";

export default function SettingsPage() {
  return (
  <AdminLayout title="Settings">
      <ComingSoon 
        title="System Settings"
        description="Configure system preferences, user permissions, email templates, and business settings."
      />
  </AdminLayout>
  );
}