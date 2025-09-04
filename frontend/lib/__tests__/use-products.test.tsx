import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProducts, useProduct, useCreateProduct, useUpdateProduct } from '../hooks/use-products';
import { productService } from '../services/product.service';

// Mock the product service
vi.mock('../services/product.service', () => ({
  productService: {
    getProducts: vi.fn(),
    getProduct: vi.fn(),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),
    getCategories: vi.fn(),
  },
}));

const mockedProductService = vi.mocked(productService);

// Test wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('useProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch products successfully', async () => {
    const mockProductsResponse = {
      data: [
        {
          id: '1',
          sku: 'PROD-001',
          name: 'Test Product',
          description: 'A test product',
          category: { id: '1', name: 'Test Category', description: 'Test', isActive: true },
          basePrice: 1000,
          currency: 'INR',
          specifications: [],
          images: [],
          isActive: true,
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    };

    mockedProductService.getProducts.mockResolvedValue(mockProductsResponse);

    const { result } = renderHook(() => useProducts({ page: 1, limit: 10 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockProductsResponse);
    expect(mockedProductService.getProducts).toHaveBeenCalledWith({ page: 1, limit: 10 });
  });

  it('should handle products fetch error', async () => {
    const mockError = new Error('Failed to fetch products');
    mockedProductService.getProducts.mockRejectedValue(mockError);

    const { result } = renderHook(() => useProducts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(mockError);
  });
});

describe('useProduct', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch single product successfully', async () => {
    const mockProduct = {
      id: '1',
      sku: 'PROD-001',
      name: 'Test Product',
      description: 'A test product',
      category: { id: '1', name: 'Test Category', description: 'Test', isActive: true },
      basePrice: 1000,
      currency: 'INR' as const,
      specifications: [],
      images: [],
      isActive: true,
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
    };

    mockedProductService.getProduct.mockResolvedValue(mockProduct);

    const { result } = renderHook(() => useProduct('1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockProduct);
    expect(mockedProductService.getProduct).toHaveBeenCalledWith('1');
  });

  it('should not fetch when disabled', () => {
    const { result } = renderHook(() => useProduct('1', false), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedProductService.getProduct).not.toHaveBeenCalled();
  });
});

describe('useCreateProduct', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create product successfully', async () => {
    const mockProduct = {
      id: '1',
      sku: 'PROD-001',
      name: 'Test Product',
      description: 'A test product',
      category: { id: '1', name: 'Test Category', description: 'Test', isActive: true },
      basePrice: 1000,
      currency: 'INR' as const,
      specifications: [],
      images: [],
      isActive: true,
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
    };

    const createData = {
      sku: 'PROD-001',
      name: 'Test Product',
      description: 'A test product',
      categoryId: '1',
      basePrice: 1000,
      currency: 'INR',
      specifications: [],
    };

    mockedProductService.createProduct.mockResolvedValue(mockProduct);

    const { result } = renderHook(() => useCreateProduct(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(createData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockedProductService.createProduct).toHaveBeenCalledWith(createData);
    expect(result.current.data).toEqual(mockProduct);
  });
});

describe('useUpdateProduct', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update product successfully', async () => {
    const mockUpdatedProduct = {
      id: '1',
      sku: 'PROD-001',
      name: 'Updated Product',
      description: 'An updated product',
      category: { id: '1', name: 'Test Category', description: 'Test', isActive: true },
      basePrice: 1500,
      currency: 'INR' as const,
      specifications: [],
      images: [],
      isActive: true,
      createdAt: '2023-01-01',
      updatedAt: '2023-01-02',
    };

    const updateData = {
      name: 'Updated Product',
      description: 'An updated product',
      basePrice: 1500,
    };

    mockedProductService.updateProduct.mockResolvedValue(mockUpdatedProduct);

    const { result } = renderHook(() => useUpdateProduct(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: '1', data: updateData });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockedProductService.updateProduct).toHaveBeenCalledWith('1', updateData);
    expect(result.current.data).toEqual(mockUpdatedProduct);
  });
});