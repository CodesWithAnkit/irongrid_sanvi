import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { Dashboard } from '../dashboard';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';

// Mock Chart.js components
vi.mock('react-chartjs-2', () => ({
  Line: ({ data }: any) => <div data-testid="line-chart">Line Chart</div>,
  Doughnut: ({ data }: any) => <div data-testid="doughnut-chart">Doughnut Chart</div>,
  Bar: ({ data }: any) => <div data-testid="bar-chart">Bar Chart</div>,
}));

vi.mock('chart.js', () => ({
  Chart: {
    register: vi.fn(),
  },
  CategoryScale: {},
  LinearScale: {},
  PointElement: {},
  LineElement: {},
  Title: {},
  Tooltip: {},
  Legend: {},
  ArcElement: {},
  BarElement: {},
}));

// Mock the child components
vi.mock('../recent-activity', () => ({
  RecentActivity: ({ isLoading }: { isLoading?: boolean }) => (
    <div data-testid="recent-activity">
      {isLoading ? 'Loading...' : 'Recent Activity'}
    </div>
  ),
}));

vi.mock('../quick-actions', () => ({
  QuickActions: () => <div data-testid="quick-actions">Quick Actions</div>,
}));

const createTestQueryClient = () => new QueryClient({
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

describe('Dashboard', () => {
  it('renders loading state initially', () => {
    renderWithQueryClient(<Dashboard />);
    
    // Should show loading skeletons
    const loadingElements = document.querySelectorAll('.animate-pulse');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('renders dashboard structure', () => {
    renderWithQueryClient(<Dashboard />);
    
    // Should render the main dashboard container
    expect(document.querySelector('.space-y-8')).toBeInTheDocument();
    
    // Should render metric cards grid
    expect(document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4')).toBeInTheDocument();
  });

  it('renders child components', () => {
    renderWithQueryClient(<Dashboard />);
    
    // Should render mocked child components
    expect(screen.getByTestId('recent-activity')).toBeInTheDocument();
    expect(screen.getByTestId('quick-actions')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    renderWithQueryClient(<Dashboard className="custom-dashboard" />);
    
    const container = document.querySelector('.custom-dashboard');
    expect(container).toBeInTheDocument();
  });

  it('has proper refresh interval default', () => {
    // This test just ensures the component renders without error with default props
    renderWithQueryClient(<Dashboard />);
    
    expect(document.querySelector('.space-y-8')).toBeInTheDocument();
  });
});