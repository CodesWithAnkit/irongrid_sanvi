"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useMe, useLogout } from "@/features/auth/hooks";
import { AdminGuard } from "@/components/auth/admin-guard";
import { Breadcrumb, type BreadcrumbItem } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export interface SidebarSection {
  title: string;
  links: {
    href: string;
    label: string;
    icon?: React.ReactNode;
    isActive?: (pathname: string) => boolean;
    roles?: string[];
  }[];
}

export interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: BreadcrumbItem[];
  sidebarSections?: SidebarSection[];
  user?: {
    name: string;
    email: string;
  };
}

export function AdminLayout({ 
  children, 
  title, 
  breadcrumbs = [],
  sidebarSections = [],
  user: userProp
}: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: userMe } = useMe();
  const user = userProp || userMe;
  const { mutateAsync: doLogout, isPending: isLoggingOut } = useLogout();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await doLogout();
      router.replace("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const defaultSections: SidebarSection[] = [
    {
      title: "BUSINESS",
      links: [
        {
          href: "/admin/dashboard",
          label: "Dashboard",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            </svg>
          ),
          isActive: (path) => path === "/admin" || path === "/admin/dashboard"
        },
        {
          href: "/admin/quotations",
          label: "Quotations",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          isActive: (path) => path.startsWith("/admin/quotations")
        },
        {
          href: "/admin/orders",
          label: "Orders",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          ),
          isActive: (path) => path.startsWith("/admin/orders")
        }
      ]
    },
    {
      title: "CUSTOMERS",
      links: [
        {
          href: "/admin/customers",
          label: "All Customers",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          ),
          isActive: (path) => path === "/admin/customers"
        },
        {
          href: "/admin/customers/credit-management",
          label: "Credit Management",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a5 5 0 00-10 0v2a2 2 0 00-2 2v7a2 2 0 002 2h10a2 2 0 002-2v-7a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 17v.01" />
            </svg>
          ),
          isActive: (path) => path === "/admin/customers/credit-management"
        },
        {
          href: "/admin/customers/wholesale",
          label: "Wholesale Clients",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          ),
          isActive: (path) => path === "/admin/customers/wholesale"
        },
        {
          href: "/admin/customers/distributors",
          label: "Distributors",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
            </svg>
          ),
          isActive: (path) => path === "/admin/customers/distributors"
        }
      ]
    },
    {
      title: "INVENTORY",
      links: [
        {
          href: "/admin/products",
          label: "Product Catalog",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          ),
          isActive: (path) => path.startsWith("/admin/products")
        },
        {
          href: "/admin/inventory",
          label: "Stock Management",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          ),
          isActive: (path) => path === "/admin/inventory"
        }
      ]
    },
    {
      title: "ANALYTICS",
      links: [
        {
          href: "/admin/analytics",
          label: "Sales Analytics",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          ),
          isActive: (path) => path === "/admin/analytics"
        },
        {
          href: "/admin/reports",
          label: "Business Reports",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          isActive: (path) => path === "/admin/reports"
        }
      ]
    }
  ];

  const sections = sidebarSections.length > 0 ? sidebarSections : defaultSections;

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={toggleSidebar}
                aria-label="Toggle sidebar"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>

              {/* Logo */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[var(--color-sanvi-primary-700)] rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <span className="font-semibold text-lg text-gray-900 hidden sm:block">Sanvi Machinery</span>
              </div>
            </div>

            {/* User menu */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm text-gray-600">{user?.email}</span>
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">{user?.email?.[0]?.toUpperCase()}</span>
                </div>
              </div>
              <Button 
                onClick={handleLogout}
                disabled={isLoggingOut}
                variant="outline"
                size="sm"
              >
                {isLoggingOut ? "Logging out..." : "Logout"}
              </Button>
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Sidebar */}
          <aside className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}>
            <div className="flex flex-col h-full pt-16 lg:pt-0">
              {/* Mobile header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden">
                <span className="font-semibold text-lg text-gray-900">Menu</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeSidebar}
                  aria-label="Close sidebar"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
                {sections.map((section, index) => (
                  <div key={index}>
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                      {section.title}
                    </h3>
                    <div className="space-y-1">
                      {section.links.map((link) => {
                        const isActive = link.isActive ? link.isActive(pathname) : pathname === link.href;
                        return (
                          <a
                            key={link.href}
                            href={link.href}
                            onClick={closeSidebar}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                              isActive 
                                ? "bg-[var(--color-sanvi-primary-100)] text-[var(--color-sanvi-primary-700)]" 
                                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                            )}
                          >
                            {link.icon}
                            {link.label}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Settings */}
                <div className="pt-4 border-t border-gray-200">
                  <a
                    href="/admin/settings"
                    onClick={closeSidebar}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      pathname === "/admin/settings"
                        ? "bg-[var(--color-sanvi-primary-100)] text-[var(--color-sanvi-primary-700)]"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </a>
                </div>
              </nav>
            </div>
          </aside>

          {/* Mobile overlay */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={closeSidebar}
            />
          )}

          {/* Main content */}
          <main className="flex-1 lg:ml-0">
            <div className="p-4 lg:p-8">
              {/* Breadcrumbs */}
              {breadcrumbs.length > 0 && (
                <div className="mb-6">
                  <Breadcrumb items={breadcrumbs} />
                </div>
              )}

              {/* Page title */}
              {title && (
                <div className="mb-6">
                  <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
                </div>
              )}

              {/* Page content */}
              {children}
            </div>
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}