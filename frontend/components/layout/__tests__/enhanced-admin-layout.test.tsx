import { render, screen, fireEvent } from '@testing-library/react';
import { vi, it, describe, beforeEach, afterEach, expect } from 'vitest';
import { useRouter, usePathname } from 'next/navigation';
import { AdminLayout } from '../enhanced-admin-layout';
import { useMe, useLogout } from '@/features/auth/hooks';

// Mock Next.js hooks
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}));

// Mock auth hooks
vi.mock('@/features/auth/hooks', () => ({
  useMe: vi.fn(),
  useLogout: vi.fn(),
}));

// Mock AdminGuard
vi.mock('@/components/auth/admin-guard', () => ({
  AdminGuard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockRouter = {
  replace: vi.fn(),
};

const mockUser = {
  email: 'test@example.com',
  name: 'Test User',
};

const mockLogout = {
  mutateAsync: vi.fn(),
  isPending: false,
};

describe('AdminLayout', () => {
  beforeEach(() => {
    (useRouter as any).mockReturnValue(mockRouter);
    (usePathname as any).mockReturnValue('/admin/dashboard');
    (useMe as any).mockReturnValue({ data: mockUser });
    (useLogout as any).mockReturnValue(mockLogout);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the layout with header and sidebar', () => {
    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    );

    expect(screen.getByText('Sanvi Machinery')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Quotations')).toBeInTheDocument();
  });

  it('displays user email in header', () => {
    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    );

    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('shows mobile menu button on small screens', () => {
    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    );

    const mobileMenuButton = screen.getByLabelText('Toggle sidebar');
    expect(mobileMenuButton).toBeInTheDocument();
  });

  it('toggles sidebar when mobile menu button is clicked', () => {
    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    );

    const mobileMenuButton = screen.getByLabelText('Toggle sidebar');
    fireEvent.click(mobileMenuButton);

    // Check if sidebar is visible (has translate-x-0 class)
    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('translate-x-0');
  });

  it('calls logout function when logout button is clicked', async () => {
    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    );

    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    expect(mockLogout.mutateAsync).toHaveBeenCalled();
  });

  it('displays breadcrumbs when provided', () => {
    const breadcrumbs = [
      { label: 'Home', href: '/admin' },
      { label: 'Customers', href: '/admin/customers' },
      { label: 'Customer Details', isActive: true },
    ];

    render(
      <AdminLayout breadcrumbs={breadcrumbs}>
        <div>Test Content</div>
      </AdminLayout>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Customers')).toBeInTheDocument();
    expect(screen.getByText('Customer Details')).toBeInTheDocument();
  });

  it('displays page title when provided', () => {
    render(
      <AdminLayout title="Customer Management">
        <div>Test Content</div>
      </AdminLayout>
    );

    expect(screen.getByText('Customer Management')).toBeInTheDocument();
  });

  it('highlights active navigation item', () => {
    (usePathname as any).mockReturnValue('/admin/quotations');

    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    );

    const quotationsLink = screen.getByText('Quotations');
    expect(quotationsLink.closest('a')).toHaveClass('bg-[var(--color-sanvi-primary-100)]');
  });

  it('shows loading state when logging out', () => {
    (useLogout as any).mockReturnValue({
      ...mockLogout,
      isPending: true,
    });

    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    );

    expect(screen.getByText('Logging out...')).toBeInTheDocument();
  });

  it('closes sidebar when overlay is clicked', () => {
    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    );

    // Open sidebar first
    const mobileMenuButton = screen.getByLabelText('Toggle sidebar');
    fireEvent.click(mobileMenuButton);

    // Click overlay to close
    const overlay = document.querySelector('.bg-black.bg-opacity-50');
    if (overlay) {
      fireEvent.click(overlay);
    }

    // Check if sidebar is hidden
    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('-translate-x-full');
  });
});