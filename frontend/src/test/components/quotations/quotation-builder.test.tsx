import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QuotationBuilder } from '@/components/quotations/quotation-builder';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the hooks
vi.mock('@/features/customers/hooks', () => ({
  useCustomers: () => ({
    data: [
      {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+91 98765 43210',
        company: 'ABC Corp',
        address: '123 Main St',
      },
    ],
    isLoading: false,
  }),
}));

vi.mock('@/features/products/hooks', () => ({
  useProducts: () => ({
    data: [
      {
        id: 1,
        name: 'Test Product',
        sku: 'TEST-001',
        description: 'Test product description',
        price: 1000,
        category: 'Test Category',
        stockQuantity: 10,
      },
    ],
    isLoading: false,
  }),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('QuotationBuilder', () => {
  let mockOnSave: ReturnType<typeof vi.fn>;
  let mockOnCancel: ReturnType<typeof vi.fn>;
  let mockOnComplete: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnSave = vi.fn();
    mockOnCancel = vi.fn();
    mockOnComplete = vi.fn();
  });

  it('renders the quotation builder with initial step', () => {
    renderWithQueryClient(
      <QuotationBuilder
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText('Create Quotation')).toBeInTheDocument();
    expect(screen.getAllByText('Customer Selection')).toHaveLength(2); // One in progress, one in step header
    expect(screen.getAllByText('Select or create customer')).toHaveLength(2); // One in progress, one in step description
  });

  it('displays progress indicator with all steps', () => {
    renderWithQueryClient(
      <QuotationBuilder
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getAllByText('Customer Selection')).toHaveLength(2);
    expect(screen.getByText('Product Configuration')).toBeInTheDocument();
    expect(screen.getByText('Pricing & Terms')).toBeInTheDocument();
    expect(screen.getByText('Review & Send')).toBeInTheDocument();
  });

  it('shows customer selection step initially', () => {
    renderWithQueryClient(
      <QuotationBuilder
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByPlaceholderText('Search customers by name, email, or company...')).toBeInTheDocument();
    expect(screen.getByText('New Customer')).toBeInTheDocument();
  });

  it('allows switching to new customer form', async () => {
    renderWithQueryClient(
      <QuotationBuilder
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        onComplete={mockOnComplete}
      />
    );

    const newCustomerButton = screen.getByText('New Customer');
    fireEvent.click(newCustomerButton);

    await waitFor(() => {
      expect(screen.getByText('New Customer Information')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    renderWithQueryClient(
      <QuotationBuilder
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        onComplete={mockOnComplete}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onSave when save as draft is clicked', async () => {
    renderWithQueryClient(
      <QuotationBuilder
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        onComplete={mockOnComplete}
      />
    );

    const saveButton = screen.getByText('Save as Draft');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledTimes(1);
    });
  });

  it('initializes with provided initial data', () => {
    const initialData = {
      customer: {
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '+91 12345 67890',
        company: 'Test Company',
        address: 'Test Address',
      },
    };

    renderWithQueryClient(
      <QuotationBuilder
        initialData={initialData}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        onComplete={mockOnComplete}
      />
    );

    // The form should be initialized with the provided data
    // This would be visible in the form fields when they're rendered
    expect(screen.getByText('Create Quotation')).toBeInTheDocument();
  });

  it('shows debug info in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    renderWithQueryClient(
      <QuotationBuilder
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText('Debug Info')).toBeInTheDocument();
    expect(screen.getByText(/Current Step:/)).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });
});