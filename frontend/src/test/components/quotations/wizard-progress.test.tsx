import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { WizardProgress } from '@/components/quotations/wizard-progress';
import { type QuotationWizardStep } from '@/features/quotations/types';

const mockSteps: QuotationWizardStep[] = [
  {
    id: 'customer',
    title: 'Customer Selection',
    description: 'Select or create customer',
    isCompleted: true,
    isActive: false,
  },
  {
    id: 'products',
    title: 'Product Configuration',
    description: 'Add products and specifications',
    isCompleted: false,
    isActive: true,
  },
  {
    id: 'pricing',
    title: 'Pricing & Terms',
    description: 'Set pricing and terms',
    isCompleted: false,
    isActive: false,
  },
  {
    id: 'review',
    title: 'Review & Send',
    description: 'Review and send quotation',
    isCompleted: false,
    isActive: false,
  },
];

describe('WizardProgress', () => {
  it('renders all steps with correct titles and descriptions', () => {
    render(
      <WizardProgress
        steps={mockSteps}
        currentStepIndex={1}
      />
    );

    expect(screen.getByText('Customer Selection')).toBeInTheDocument();
    expect(screen.getByText('Product Configuration')).toBeInTheDocument();
    expect(screen.getByText('Pricing & Terms')).toBeInTheDocument();
    expect(screen.getByText('Review & Send')).toBeInTheDocument();

    expect(screen.getByText('Select or create customer')).toBeInTheDocument();
    expect(screen.getByText('Add products and specifications')).toBeInTheDocument();
  });

  it('shows correct step numbers', () => {
    render(
      <WizardProgress
        steps={mockSteps}
        currentStepIndex={1}
      />
    );

    // Step numbers should be visible
    expect(screen.getByText('2')).toBeInTheDocument(); // Current step
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('shows check mark for completed steps', () => {
    render(
      <WizardProgress
        steps={mockSteps}
        currentStepIndex={1}
      />
    );

    // First step is completed, so it should show a check mark (Check icon from lucide-react)
    const checkIcon = screen.getByRole('button', { name: '' }); // Completed step button has no text, just check icon
    expect(checkIcon).toBeInTheDocument();
  });

  it('calls onStepClick when a clickable step is clicked', () => {
    const mockOnStepClick = vi.fn();

    render(
      <WizardProgress
        steps={mockSteps}
        currentStepIndex={1}
        onStepClick={mockOnStepClick}
      />
    );

    // Click on the first step (completed, should be clickable) - it has no name since it shows check icon
    const firstStepButton = screen.getByRole('button', { name: '' });
    fireEvent.click(firstStepButton);

    expect(mockOnStepClick).toHaveBeenCalledWith(0);
  });

  it('does not call onStepClick for non-clickable steps', () => {
    const mockOnStepClick = vi.fn();

    render(
      <WizardProgress
        steps={mockSteps}
        currentStepIndex={1}
        onStepClick={mockOnStepClick}
      />
    );

    // Click on a future step (should not be clickable)
    const futureStepButton = screen.getByRole('button', { name: /4/ });
    fireEvent.click(futureStepButton);

    // Should not be called for non-clickable steps
    expect(mockOnStepClick).not.toHaveBeenCalledWith(3);
  });

  it('shows mobile progress bar', () => {
    render(
      <WizardProgress
        steps={mockSteps}
        currentStepIndex={1}
      />
    );

    expect(screen.getByText('Step 2 of 4')).toBeInTheDocument();
    expect(screen.getByText('50% Complete')).toBeInTheDocument();
  });

  it('applies correct styling for active step', () => {
    render(
      <WizardProgress
        steps={mockSteps}
        currentStepIndex={1}
      />
    );

    const activeStepTitle = screen.getByText('Product Configuration');
    expect(activeStepTitle).toHaveClass('text-blue-600');
  });

  it('applies correct styling for completed step', () => {
    render(
      <WizardProgress
        steps={mockSteps}
        currentStepIndex={1}
      />
    );

    const completedStepTitle = screen.getByText('Customer Selection');
    expect(completedStepTitle).toHaveClass('text-green-600');
  });

  it('handles edge case with no steps', () => {
    render(
      <WizardProgress
        steps={[]}
        currentStepIndex={0}
      />
    );

    // Should not crash and should render empty progress
    expect(screen.queryByText('Step')).not.toBeInTheDocument();
  });

  it('handles edge case with single step', () => {
    const singleStep: QuotationWizardStep[] = [
      {
        id: 'only',
        title: 'Only Step',
        description: 'The only step',
        isCompleted: false,
        isActive: true,
      },
    ];

    render(
      <WizardProgress
        steps={singleStep}
        currentStepIndex={0}
      />
    );

    expect(screen.getByText('Only Step')).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 1')).toBeInTheDocument();
    expect(screen.getByText('100% Complete')).toBeInTheDocument();
  });
});