import { render, screen, fireEvent } from '@testing-library/react';
import { NumberInput } from '../number-input';
import { describe, it, expect, vi } from 'vitest';

describe('NumberInput Component', () => {
  it('renders with label', () => {
    render(<NumberInput label="Price" />);
    expect(screen.getByText('Price')).toBeInTheDocument();
  });

  it('displays error message', () => {
    render(<NumberInput label="Price" error="Invalid price" />);
    expect(screen.getByText('Invalid price')).toBeInTheDocument();
  });

  it('handles numeric input correctly', () => {
    const onChange = vi.fn();
    render(<NumberInput label="Price" onChange={onChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '123.45' } });
    
    expect(onChange).toHaveBeenCalledWith(123.45);
  });

  it('rejects non-numeric input', () => {
    const onChange = vi.fn();
    render(<NumberInput label="Price" onChange={onChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'abc' } });
    
    expect(onChange).not.toHaveBeenCalled();
  });

  it('respects min and max values', () => {
    const onChange = vi.fn();
    render(<NumberInput label="Price" min={0} max={100} onChange={onChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '150' } });
    
    expect(onChange).toHaveBeenCalledWith(100);
  });

  it('handles increment and decrement buttons', () => {
    const onChange = vi.fn();
    render(<NumberInput label="Quantity" value={5} step={1} onChange={onChange} />);
    
    const buttons = screen.getAllByRole('button');
    const incrementButton = buttons[0];
    const decrementButton = buttons[1];
    
    fireEvent.click(incrementButton);
    expect(onChange).toHaveBeenCalledWith(6);
    
    onChange.mockClear();
    fireEvent.click(decrementButton);
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('disables increment when at max value', () => {
    render(<NumberInput label="Price" value={100} max={100} />);
    
    const buttons = screen.getAllByRole('button');
    const incrementButton = buttons[0];
    
    expect(incrementButton).toBeDisabled();
  });

  it('disables decrement when at min value', () => {
    render(<NumberInput label="Price" value={0} min={0} />);
    
    const buttons = screen.getAllByRole('button');
    const decrementButton = buttons[1];
    
    expect(decrementButton).toBeDisabled();
  });

  it('formats number with prefix and suffix', () => {
    render(<NumberInput label="Price" value={100} prefix="$" suffix=" USD" />);
    
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('$100 USD');
  });

  it('handles decimal precision', () => {
    const onChange = vi.fn();
    render(<NumberInput label="Price" precision={2} onChange={onChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '123.456' } });
    fireEvent.blur(input);
    
    expect((input as HTMLInputElement).value).toBe('123.46');
  });

  it('disallows negative numbers when allowNegative is false', () => {
    const onChange = vi.fn();
    render(<NumberInput label="Price" allowNegative={false} onChange={onChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '-50' } });
    
    // The input should not accept the negative value, so onChange should not be called with -50
    expect(onChange).not.toHaveBeenCalledWith(-50);
  });

  it('disallows decimal numbers when allowDecimal is false', () => {
    const onChange = vi.fn();
    render(<NumberInput label="Quantity" allowDecimal={false} onChange={onChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '12.5' } });
    
    expect(onChange).not.toHaveBeenCalled();
  });
});