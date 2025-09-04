import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, it, vi } from 'vitest';
import { AnalyticsDashboard } from '../analytics-dashboard';
import { analyticsService } from '../../../lib/services/analytics';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock the analytics service
vi.mock('../../../lib/services/analytics', () => ({
  analyticsService: {
    getDashboardMetrics: vi.fn(),
  },
}));

const mockAnalyticsService = vi.mocked(analyticsService);

const mockMetrics = {
  quotationMetrics: {
    totalQuotations: 156,
    conversionRate: 28.8,
    averageValue: 125000,
    responseTime: 2.3,
    statusBreakdown: {
      DRAFT: 30,
      SENT: 40,
      APPROVED: 25,
      REJECTED: 5,
    },
  },
  customerMetrics: {
    totalCustomers: 89,
    activeCustomers: 67,
    newCustomers: 12,
    customerLifetimeValue: 450000,
    topCustomers: [
      {
        id: '1',
        name: 'Test Company A',
        totalValue: 500000,
        quotationCount: 15,
      },
      {
        id: '2',
        name: 'Test Company B',
        totalValue: 350000,
        quotationCount: 10,
      },
    ],
  },
  revenueMetrics: {
    totalRevenue: 2850000,
    monthlyGrowth: 12.5,
    forecastedRevenue: 3200000,
    revenueByMonth: [
      { month: 'Jan', revenue: 2200000, quotations: 45 },
      { month: 'Feb', revenue: 2400000, quotations: 52 },
    ],
    topProducts: [
      {
        id: '1',
        name: 'Industrial Lathe Machine',
        revenue: 850000,
        quantity: 15,
      },
      {
        id: '2',
        name: 'CNC Milling Machine',
        revenue: 720000,
        quantity: 12,
      },
    ],
  },
  performanceMetrics: {
    averageQuotationTime: 2.5,
    emailDeliveryRate: 95.5,
    systemUptime: 99.8,
    apiResponseTime: 180,
  },
};

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
};

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('AnalyticsDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockAnalyticsService.getDashboardMetrics.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderWithQueryClient(<AnalyticsDashboard />);

    // Check for loading skeletons - look for animate-pulse class
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders analytics data when loaded', async () => {
    mockAnalyticsService.getDashboardMetrics.mockResolvedValue(mockMetrics);

    renderWithQueryClient(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('156')).toBeInTheDocument();
      expect(screen.getByText('67')).toBeInTheDocument();
      expect(screen.getByText('₹28,50,000')).toBeInTheDocument();
      expect(screen.getByText('2.3h')).toBeInTheDocument();
    });
  });

  it('displays top customers correctly', async () => {
    mockAnalyticsService.getDashboardMetrics.mockResolvedValue(mockMetrics);

    renderWithQueryClient(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Test Company A')).toBeInTheDocument();
      expect(screen.getByText('Test Company B')).toBeInTheDocument();
      expect(screen.getByText('₹5,00,000')).toBeInTheDocument();
      expect(screen.getByText('15 quotations')).toBeInTheDocument();
    });
  });

  it('displays top products correctly', async () => {
    mockAnalyticsService.getDashboardMetrics.mockResolvedValue(mockMetrics);

    renderWithQueryClient(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Industrial Lathe Machine')).toBeInTheDocument();
      expect(screen.getByText('CNC Milling Machine')).toBeInTheDocument();
      expect(screen.getByText('₹8,50,000')).toBeInTheDocument();
      expect(screen.getByText('15 units')).toBeInTheDocument();
    });
  });

  it('displays performance metrics correctly', async () => {
    mockAnalyticsService.getDashboardMetrics.mockResolvedValue(mockMetrics);

    renderWithQueryClient(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('99.8%')).toBeInTheDocument();
      expect(screen.getByText('180ms')).toBeInTheDocument();
      expect(screen.getByText('95.5%')).toBeInTheDocument();
      expect(screen.getByText('2.5h')).toBeInTheDocument();
    });
  });

  it('handles error state correctly', async () => {
    mockAnalyticsService.getDashboardMetrics.mockRejectedValue(
      new Error('Failed to fetch analytics')
    );

    renderWithQueryClient(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load analytics data')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    });
  });

  it('formats currency correctly', async () => {
    mockAnalyticsService.getDashboardMetrics.mockResolvedValue(mockMetrics);

    renderWithQueryClient(<AnalyticsDashboard />);

    await waitFor(() => {
      // Check for Indian currency formatting
      expect(screen.getByText('₹28,50,000')).toBeInTheDocument();
    });
  });

  it('formats percentages correctly', async () => {
    mockAnalyticsService.getDashboardMetrics.mockResolvedValue(mockMetrics);

    renderWithQueryClient(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('28.8% conversion rate')).toBeInTheDocument();
      expect(screen.getByText('12.5% growth')).toBeInTheDocument();
    });
  });

  it('shows positive trends correctly', async () => {
    mockAnalyticsService.getDashboardMetrics.mockResolvedValue(mockMetrics);

    renderWithQueryClient(<AnalyticsDashboard />);

    await waitFor(() => {
      const trendElements = screen.getAllByText(/growth|Excellent|Fast|Reliable|Efficient/);
      expect(trendElements.length).toBeGreaterThan(0);
    });
  });

  it('respects custom date range', async () => {
    const customDateRange = {
      dateRange: 'CUSTOM' as const,
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    };

    mockAnalyticsService.getDashboardMetrics.mockResolvedValue(mockMetrics);

    renderWithQueryClient(<AnalyticsDashboard dateRange={customDateRange} />);

    await waitFor(() => {
      expect(mockAnalyticsService.getDashboardMetrics).toHaveBeenCalledWith(customDateRange);
    });
  });

  it('refreshes data at specified interval', async () => {
    mockAnalyticsService.getDashboardMetrics.mockResolvedValue(mockMetrics);

    renderWithQueryClient(<AnalyticsDashboard refreshInterval={1000} />);

    await waitFor(() => {
      expect(mockAnalyticsService.getDashboardMetrics).toHaveBeenCalledTimes(1);
    });

    // Wait for refresh interval
    await new Promise(resolve => setTimeout(resolve, 1100));

    await waitFor(() => {
      expect(mockAnalyticsService.getDashboardMetrics).toHaveBeenCalledTimes(2);
    });
  });
});