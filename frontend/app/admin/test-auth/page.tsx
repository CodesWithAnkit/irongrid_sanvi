"use client";

import { AdminLayout } from "@/components/layout/enhanced-admin-layout";
import { Button } from "@/components/ui/button";
import { useMe, useLogout } from "@/features/auth/hooks";

export default function TestAuthPage() {
  const { data: user } = useMe();
  const { mutateAsync: logout } = useLogout();

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
  <AdminLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">Authentication Test</h1>
          
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Current User</h2>
              <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                <pre className="text-sm text-gray-700">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900">Admin Guard Status</h2>
              <div className="mt-2 p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">
                  ✅ Admin Guard is working - you can see this page!
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900">Test Logout</h2>
              <div className="mt-2">
                <Button onClick={handleLogout} variant="outline">
                  Test Logout Function
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
  </AdminLayout>
  );
}