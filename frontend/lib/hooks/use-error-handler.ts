import { useCallback } from 'react';
import { ApiError, ErrorCodes } from '../api';

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  fallbackMessage?: string;
}

export function useErrorHandler() {
  const handleError = useCallback((
    error: unknown, 
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast = true,
      logError = true,
      fallbackMessage = 'An unexpected error occurred'
    } = options;

    let errorMessage = fallbackMessage;
    let errorCode = ErrorCodes.INTERNAL_SERVER_ERROR;

    if (error instanceof ApiError) {
      errorMessage = error.message;
      errorCode = error.code;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    // Log error for debugging
    if (logError) {
      console.error('Error handled:', {
        message: errorMessage,
        code: errorCode,
        error,
        timestamp: new Date().toISOString(),
      });
    }

    // Show user-friendly error message
    if (showToast) {
      // In a real app, you'd use a toast library here
      // For now, we'll just log to console
      console.warn('Toast would show:', getUserFriendlyMessage(errorCode, errorMessage));
    }

    return {
      message: errorMessage,
      code: errorCode,
      userMessage: getUserFriendlyMessage(errorCode, errorMessage),
    };
  }, []);

  return { handleError };
}

function getUserFriendlyMessage(code: string, originalMessage: string): string {
  switch (code) {
    case ErrorCodes.NETWORK_ERROR:
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    
    case ErrorCodes.AUTHENTICATION_ERROR:
      return 'Your session has expired. Please log in again.';
    
    case ErrorCodes.AUTHORIZATION_ERROR:
      return 'You do not have permission to perform this action.';
    
    case ErrorCodes.VALIDATION_ERROR:
      return 'Please check your input and try again.';
    
    case ErrorCodes.RESOURCE_NOT_FOUND:
      return 'The requested item could not be found.';
    
    case ErrorCodes.RATE_LIMIT_EXCEEDED:
      return 'Too many requests. Please wait a moment and try again.';
    
    case ErrorCodes.BUSINESS_LOGIC_ERROR:
      // For business logic errors, show the original message as it's usually user-friendly
      return originalMessage;
    
    case ErrorCodes.EXTERNAL_SERVICE_ERROR:
      return 'A third-party service is currently unavailable. Please try again later.';
    
    default:
      return 'Something went wrong. Please try again or contact support if the problem persists.';
  }
}

// Hook for handling specific error scenarios
export function useApiErrorHandler() {
  const { handleError } = useErrorHandler();

  const handleApiError = useCallback((error: unknown, context?: string) => {
    if (error instanceof ApiError) {
      // Handle specific API error codes
      switch (error.code) {
        case ErrorCodes.AUTHENTICATION_ERROR:
          // Emit logout event for auth components to handle
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth:logout'));
          }
          break;
        
        case ErrorCodes.AUTHORIZATION_ERROR:
          // Could redirect to unauthorized page or show modal
          console.warn('Authorization error in context:', context);
          break;
        
        case ErrorCodes.VALIDATION_ERROR:
          // Could highlight form fields with errors
          if (error.details?.fields) {
            console.warn('Validation errors:', error.details.fields);
          }
          break;
      }
    }

    return handleError(error, { 
      fallbackMessage: context ? `Failed to ${context}` : undefined 
    });
  }, [handleError]);

  return { handleApiError };
}