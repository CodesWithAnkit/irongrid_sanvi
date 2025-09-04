import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Input } from '../input';

describe('Input Component', () => {
  it('renders with label', () => {
    render(<Input label="Test Label" />);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('displays error message', () => {
    render(<Input label="Test" error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveClass('border-red-300');
  });

  it('displays helper text when no error', () => {
    render(<Input label="Test" helperText="Enter your name" />);
    expect(screen.getByText('Enter your name')).toBeInTheDocument();
  });

  it('shows loading spinner', () => {
    render(<Input label="Test" loading />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows clear button when showClearButton is true and has value', () => {
    render(<Input label="Test" showClearButton value="test value" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls onClear when clear button is clicked', () => {
    const onClear = vi.fn();
    render(<Input label="Test" showClearButton value="test" onClear={onClear} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(onClear).toHaveBeenCalled();
  });

  it('handles onChange correctly', () => {
    const onChange = vi.fn();
    render(<Input label="Test" onChange={onChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'new value' } });
    
    expect(onChange).toHaveBeenCalled();
  });

  it('shows required asterisk', () => {
    render(<Input label="Test Label" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('renders with left and right icons', () => {
    const LeftIcon = () => <span data-testid="left-icon">L</span>;
    const RightIcon = () => <span data-testid="right-icon">R</span>;
    
    render(
      <Input 
        label="Test" 
        leftIcon={<LeftIcon />} 
        rightIcon={<RightIcon />} 
      />
    );
    
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('applies disabled state correctly', () => {
    render(<Input label="Test" disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('disabled:opacity-50');
  });
});