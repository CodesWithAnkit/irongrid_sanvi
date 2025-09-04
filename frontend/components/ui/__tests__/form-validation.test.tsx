import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { z } from 'zod';
import { FormError } from '../form-error';
import { FormSuccess } from '../form-success';
import { FormSubmitButton } from '../form-submit-button';
import { AutoSaveIndicator } from '../auto-save-indicator';

describe('Form Validation Components', () => {
  describe('FormError', () => {
    it('renders single error message', () => {
      render(<FormError error="This field is required" />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('renders multiple error messages', () => {
      const errors = ['Field is required', 'Must be at least 3 characters'];
      render(<FormError error={errors} />);
      
      expect(screen.getByText('Field is required')).toBeInTheDocument();
      expect(screen.getByText('Must be at least 3 characters')).toBeInTheDocument();
    });

    it('renders with icon by default', () => {
      render(<FormError error="Error message" />);
      expect(document.querySelector('svg')).toBeInTheDocument();
    });

    it('hides icon when showIcon is false', () => {
      render(<FormError error="Error message" showIcon={false} />);
      expect(document.querySelector('svg')).not.toBeInTheDocument();
    });

    it('returns null when no error', () => {
      const { container } = render(<FormError />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('FormSuccess', () => {
    it('renders success message', () => {
      render(<FormSuccess message="Form submitted successfully" />);
      expect(screen.getByText('Form submitted successfully')).toBeInTheDocument();
    });

    it('renders with icon by default', () => {
      render(<FormSuccess message="Success" />);
      expect(document.querySelector('svg')).toBeInTheDocument();
    });

    it('shows dismiss button when onDismiss is provided', () => {
      const onDismiss = vi.fn();
      render(<FormSuccess message="Success" onDismiss={onDismiss} />);
      
      const dismissButton = screen.getByRole('button');
      expect(dismissButton).toBeInTheDocument();
      
      fireEvent.click(dismissButton);
      expect(onDismiss).toHaveBeenCalled();
    });

    it('auto-hides after delay when autoHide is true', async () => {
      const onDismiss = vi.fn();
      render(
        <FormSuccess 
          message="Success" 
          autoHide 
          autoHideDelay={100} 
          onDismiss={onDismiss} 
        />
      );
      
      expect(screen.getByText('Success')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(onDismiss).toHaveBeenCalled();
      }, { timeout: 200 });
    });

    it('returns null when no message', () => {
      const { container } = render(<FormSuccess />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('FormSubmitButton', () => {
    it('renders children when not loading', () => {
      render(<FormSubmitButton>Submit</FormSubmitButton>);
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    it('shows loading state', () => {
      render(<FormSubmitButton loading loadingText="Submitting...">Submit</FormSubmitButton>);
      expect(screen.getByText('Submitting...')).toBeInTheDocument();
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('shows success state', () => {
      render(<FormSubmitButton showSuccess successText="Success!">Submit</FormSubmitButton>);
      expect(screen.getByText('Success!')).toBeInTheDocument();
    });

    it('shows error state', () => {
      render(<FormSubmitButton showError errorText="Error occurred">Submit</FormSubmitButton>);
      expect(screen.getByText('Error occurred')).toBeInTheDocument();
    });

    it('is disabled when loading', () => {
      render(<FormSubmitButton loading>Submit</FormSubmitButton>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('is disabled when showing success', () => {
      render(<FormSubmitButton showSuccess>Submit</FormSubmitButton>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('handles click events', () => {
      const onClick = vi.fn();
      render(<FormSubmitButton onClick={onClick}>Submit</FormSubmitButton>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalled();
    });
  });

  describe('AutoSaveIndicator', () => {
    it('shows saving state', () => {
      render(<AutoSaveIndicator status="saving" />);
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('shows saved state', () => {
      render(<AutoSaveIndicator status="saved" />);
      expect(screen.getByText('Saved')).toBeInTheDocument();
    });

    it('shows saved state with timestamp', () => {
      const lastSaved = new Date(Date.now() - 60000); // 1 minute ago
      render(<AutoSaveIndicator status="saved" lastSaved={lastSaved} />);
      expect(screen.getByText(/1 minute ago/)).toBeInTheDocument();
    });

    it('shows error state', () => {
      render(<AutoSaveIndicator status="error" />);
      expect(screen.getByText('Save failed')).toBeInTheDocument();
    });

    it('hides text when showText is false', () => {
      render(<AutoSaveIndicator status="saved" showText={false} />);
      expect(screen.queryByText('Saved')).not.toBeInTheDocument();
    });

    it('returns null for idle status', () => {
      const { container } = render(<AutoSaveIndicator status="idle" />);
      expect(container.firstChild).toBeNull();
    });
  });
});