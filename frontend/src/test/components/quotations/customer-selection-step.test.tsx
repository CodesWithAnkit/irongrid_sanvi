import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useForm } from 'react-hook-form';
import { CustomerSelectionStep } from '@/components/quotations/steps/customer-selection-step';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type QuotationBuilderFormData } from '@/features/quotations/schemas';

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
      {
        id: 2,
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+91 98765 43211',
        company: 'XYZ Ltd',
        address: '456 Oak Ave',
      },
    ],
    isLoading: false,
  }),
}));

vi.mock('@/lib/hooks/use-debounce', () => ({
  useDebounce: (value: string) => value, // Return immediately for tests
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// Mock form component for testing
function TestCustomerSelectionStep() {
  const form = useForm<QuotationBuilderFormData>({
    defaultValues: {
      customer: {
        name: '',
        email: '',
        phone: '',
        company: '',
        address: '',
        isNewCustomer: false,
      },
    },
  });

  const mockOnNext = vi.fn();
  const mockOnPrevious = vi.fn();

  return (
    <TestWrapper>
      <CustomerSelectionStep
        form={form}
        onNext={mockOnNext}
        onPrevious={mockOnPrevious}
        isValid={true}
      />
    </TestWrapper>
  );
}

describe('CustomerSelectionStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders customer search input', () => {
    render(<TestCustomerSelectionStep />);

    expect(
      screen.getByPlaceholderText('Search customers by name, email, or company...')
    ).toBeInTheDocument();
  });

  it('renders new customer toggle button', () => {
    render(<TestCustomerSelectionStep />);

    expect(screen.getByText('New Customer')).toBeInTheDocument();
  });

  it('displays customer list by default', () => {
    render(<TestCustomerSelectionStep />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('ABC Corp')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('XYZ Ltd')).toBeInTheDocument();
  });

  it('filters customers based on search query', async () => {
    render(<TestCustomerSelectionStep />);

    const searchInput = screen.getByPlaceholderText('Search customers by name, email, or company...');
    fireEvent.change(searchInput, { target: { value: 'John' } });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });
  });

  it('shows new customer form when toggle is clicked', async () => {
    render(<TestCustomerSelectionStep />);

    const newCustomerButton = screen.getByText('New Customer');
    fireEvent.click(newCustomerButton);

    await waitFor(() => {
      expect(screen.getByText('New Customer Information')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('john@company.com')).toBeInTheDocument();
    });
  });

  it('switches back to customer list when toggle is clicked again', async () => {
    render(<TestCustomerSelectionStep />);

    // Switch to new customer form
    const newCustomerButton = screen.getByText('New Customer');
    fireEvent.click(newCustomerButton);

    await waitFor(() => {
      expect(screen.getByText('New Customer Information')).toBeInTheDocument();
    });

    // Switch back to existing customers
    const selectExistingButton = screen.getByText('Select Existing');
    fireEvent.click(selectExistingButton);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('New Customer Information')).not.toBeInTheDocument();
    });
  });

  it('shows continue button', () => {
    render(<TestCustomerSelectionStep />);

    expect(screen.getByText('Continue to Products')).toBeInTheDocument();
  });

  it('shows no customers message when search returns no results', async () => {
    render(<TestCustomerSelectionStep />);

    const searchInput = screen.getByPlaceholderText('Search customers by name, email, or company...');
    fireEvent.change(searchInput, { target: { value: 'NonexistentCustomer' } });

    await waitFor(() => {
      expect(screen.getByText('No customers found')).toBeInTheDocument();
      expect(screen.getByText('No customers match your search.')).toBeInTheDocument();
    });
  });

  it('validates required fields in new customer form', async () => {
    render(<TestCustomerSelectionStep />);

    // Switch to new customer form
    const newCustomerButton = screen.getByText('New Customer');
    fireEvent.click(newCustomerButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('john@company.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('+91 98765 43210')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('ABC Manufacturing')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('123 Industrial Area, City, State - 123456')).toBeInTheDocument();
    });
  });

  it('allows filling new customer form fields', async () => {
    render(<TestCustomerSelectionStep />);

    // Switch to new customer form
    const newCustomerButton = screen.getByText('New Customer');
    fireEvent.click(newCustomerButton);

    await waitFor(() => {
      const nameInput = screen.getByPlaceholderText('John Doe');
      const emailInput = screen.getByPlaceholderText('john@company.com');
      
      fireEvent.change(nameInput, { target: { value: 'Test Customer' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      expect(nameInput).toHaveValue('Test Customer');
      expect(emailInput).toHaveValue('test@example.com');
    });
  });
});