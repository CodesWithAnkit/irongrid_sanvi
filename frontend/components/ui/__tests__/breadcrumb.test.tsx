import { render, screen } from '@testing-library/react';
import { Breadcrumb, type BreadcrumbItem } from '../breadcrumb';

import { vi } from 'vitest';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { it } from 'zod/locales';
import { describe } from 'node:test';

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  },
}));

describe('Breadcrumb', () => {
  it('renders breadcrumb items correctly', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Home', href: '/admin' },
      { label: 'Customers', href: '/admin/customers' },
      { label: 'Customer Details', isActive: true },
    ];

    render(<Breadcrumb items={items} />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Customers')).toBeInTheDocument();
    expect(screen.getByText('Customer Details')).toBeInTheDocument();
  });

  it('renders links for non-active items with href', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Home', href: '/admin' },
      { label: 'Customers', href: '/admin/customers' },
    ];

    render(<Breadcrumb items={items} />);

    const homeLink = screen.getByText('Home').closest('a');
    const customersLink = screen.getByText('Customers').closest('a');

    expect(homeLink).toHaveAttribute('href', '/admin');
    expect(customersLink).toHaveAttribute('href', '/admin/customers');
  });

  it('renders active items as spans without links', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Home', href: '/admin' },
      { label: 'Current Page', isActive: true },
    ];

    render(<Breadcrumb items={items} />);

    const activeItem = screen.getByText('Current Page');
    expect(activeItem.tagName).toBe('SPAN');
    expect(activeItem.closest('a')).toBeNull();
  });

  it('renders separators between items', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Home', href: '/admin' },
      { label: 'Customers', href: '/admin/customers' },
      { label: 'Details', isActive: true },
    ];

    render(<Breadcrumb items={items} />);

    // Should have 2 separators for 3 items
    const separators = document.querySelectorAll('svg');
    expect(separators).toHaveLength(2);
  });

  it('applies custom className', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Home', href: '/admin' },
    ];

    render(<Breadcrumb items={items} className="custom-class" />);

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('custom-class');
  });

  it('has proper accessibility attributes', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Home', href: '/admin' },
      { label: 'Current', isActive: true },
    ];

    render(<Breadcrumb items={items} />);

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Breadcrumb');
  });

  it('handles items without href correctly', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Home', href: '/admin' },
      { label: 'Static Item' }, // No href, not active
    ];

    render(<Breadcrumb items={items} />);

    const staticItem = screen.getByText('Static Item');
    expect(staticItem.tagName).toBe('SPAN');
    expect(staticItem.closest('a')).toBeNull();
  });
});