import { render, screen } from '@testing-library/react';
import { Button } from './Button';
import { vi } from "vitest";

describe('Button', () => {
  it('should render the button with the default primary variant', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toHaveClass('bg-black text-white');
  });

  it('should render the button with the secondary variant', () => {
    render(<Button variant="secondary">Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toHaveClass('border');
  });

  it('should apply any additional className passed to it', () => {
    render(<Button className="my-class">Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toHaveClass('my-class');
  });

  it('should pass any other props to the button element', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    button.click();
    expect(onClick).toHaveBeenCalled();
  });
});
