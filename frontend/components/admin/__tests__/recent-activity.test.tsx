import { render, screen } from '@testing-library/react';
import { RecentActivity } from '../recent-activity';

// Mock Button component
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

describe('RecentActivity', () => {
  it('renders recent activity list', () => {
    render(<RecentActivity />);

    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('View All')).toBeInTheDocument();
    
    // Should show some activity items
    expect(screen.getByText('New quotation created')).toBeInTheDocument();
    expect(screen.getByText('Customer updated')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<RecentActivity isLoading={true} />);

    // Should show skeleton loading
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    
    // Should not show actual content when loading
    expect(screen.queryByText('New quotation created')).not.toBeInTheDocument();
  });

  it('displays activity details correctly', () => {
    render(<RecentActivity />);

    // Check for activity descriptions
    expect(screen.getByText(/Q-20250127-001 for ABC Manufacturing Ltd/)).toBeInTheDocument();
    expect(screen.getByText(/XYZ Industries contact information updated/)).toBeInTheDocument();
    
    // Check for timestamps
    expect(screen.getByText('2 minutes ago')).toBeInTheDocument();
    expect(screen.getByText('15 minutes ago')).toBeInTheDocument();
    
    // Check for user attribution
    expect(screen.getByText('by John Doe')).toBeInTheDocument();
    expect(screen.getByText('by Jane Smith')).toBeInTheDocument();
  });

  it('renders different activity types with appropriate icons', () => {
    render(<RecentActivity />);

    // All activity items should have icons (SVG elements)
    const icons = document.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('applies custom className', () => {
    render(<RecentActivity className="custom-class" />);

    // Find the root container (should be the outermost div with the custom class)
    const container = document.querySelector('.custom-class');
    expect(container).toBeInTheDocument();
  });

  it('shows appropriate status colors', () => {
    render(<RecentActivity />);

    // Should have different colored status indicators
    const statusIndicators = document.querySelectorAll('.bg-green-100, .bg-blue-100, .bg-yellow-100, .bg-red-100');
    expect(statusIndicators.length).toBeGreaterThan(0);
  });
});