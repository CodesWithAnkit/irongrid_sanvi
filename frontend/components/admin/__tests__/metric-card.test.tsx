import { render, screen } from '@testing-library/react';
import { MetricCard } from '../metric-card';

const mockIcon = (
  <svg data-testid="test-icon" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

describe('MetricCard', () => {
  it('renders basic metric card', () => {
    render(
      <MetricCard
        title="Test Metric"
        value={100}
        icon={mockIcon}
      />
    );

    expect(screen.getByText('Test Metric')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('renders with trend information', () => {
    render(
      <MetricCard
        title="Test Metric"
        value="50%"
        icon={mockIcon}
        trend={{ value: "+5% improvement", isPositive: true }}
      />
    );

    expect(screen.getByText('+5% improvement')).toBeInTheDocument();
    expect(screen.getByText('+5% improvement')).toHaveClass('text-green-600');
  });

  it('renders negative trend correctly', () => {
    render(
      <MetricCard
        title="Test Metric"
        value={75}
        icon={mockIcon}
        trend={{ value: "-2% decline", isPositive: false }}
      />
    );

    expect(screen.getByText('-2% decline')).toBeInTheDocument();
    expect(screen.getByText('-2% decline')).toHaveClass('text-red-600');
  });

  it('renders subtitle when no trend provided', () => {
    render(
      <MetricCard
        title="Test Metric"
        value={200}
        icon={mockIcon}
        subtitle="Additional information"
      />
    );

    expect(screen.getByText('Additional information')).toBeInTheDocument();
  });

  it('applies custom icon colors', () => {
    render(
      <MetricCard
        title="Test Metric"
        value={300}
        icon={mockIcon}
        iconBgColor="bg-red-100"
        iconTextColor="text-red-600"
      />
    );

    const iconContainer = screen.getByTestId('test-icon').closest('div');
    expect(iconContainer).toHaveClass('text-red-600');
    expect(iconContainer?.parentElement).toHaveClass('bg-red-100');
  });

  it('shows loading state', () => {
    render(
      <MetricCard
        title="Test Metric"
        value={400}
        icon={mockIcon}
        isLoading={true}
      />
    );

    // Should show skeleton loading
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    
    // Should not show actual content when loading
    expect(screen.queryByText('Test Metric')).not.toBeInTheDocument();
    expect(screen.queryByText('400')).not.toBeInTheDocument();
  });

  it('handles string and number values', () => {
    const { rerender } = render(
      <MetricCard
        title="String Value"
        value="₹1,25,000"
        icon={mockIcon}
      />
    );

    expect(screen.getByText('₹1,25,000')).toBeInTheDocument();

    rerender(
      <MetricCard
        title="Number Value"
        value={125000}
        icon={mockIcon}
      />
    );

    expect(screen.getByText('125000')).toBeInTheDocument();
  });
});