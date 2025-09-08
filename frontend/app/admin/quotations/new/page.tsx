"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AdminLayout } from "@/components/layout/enhanced-admin-layout";
import AdminPageHeader from "@/components/ui/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Zap, ArrowRight } from "lucide-react";

export default function NewQuotationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const preSelectedCustomerId = searchParams.get("customerId");
  const preSelectedProductId = searchParams.get("productId");

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title="Create New Quotation"
          subtitle="Sales Operations"
          description="Choose your preferred quotation creation method"
          compact
        />

        <div className="px-6">
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Live Quotation Builder */}
            <Card className="relative overflow-hidden border-2 border-blue-200 bg-blue-50/30">
              <div className="absolute top-3 right-3">
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                  Recommended
                </span>
              </div>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 text-white rounded-lg">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle>Live Quotation Builder</CardTitle>
                    <CardDescription>Fast, visual, single-page editor</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  <div className="text-sm text-gray-600">
                    <strong>Perfect for:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1 text-xs">
                      <li>Quick quotation creation</li>
                      <li>Real-time preview while editing</li>
                      <li>Print-ready professional format</li>
                      <li>Indian GST calculations</li>
                      <li>Immediate PDF/JSON export</li>
                    </ul>
                  </div>
                </div>
                <Link href="/admin/quotations/builder">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Start Building
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Traditional Wizard */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-500 text-white rounded-lg">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle>Step-by-Step Wizard</CardTitle>
                    <CardDescription>Guided form with validation</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  <div className="text-sm text-gray-600">
                    <strong>Perfect for:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1 text-xs">
                      <li>Complex quotations</li>
                      <li>Multiple product configurations</li>
                      <li>Detailed customer management</li>
                      <li>Advanced validation</li>
                      <li>Step-by-step guidance</li>
                    </ul>
                  </div>
                </div>
                <Link href="/admin/quotations/wizard">
                  <Button variant="outline" className="w-full">
                    Use Wizard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500 mb-3">Need to go back?</p>
            <Button 
              variant="ghost" 
              onClick={() => router.push("/admin/quotations")}
            >
              ← Back to Quotations
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}