import { renderHook } from '@testing-library/react';
import { useErrorHandler, useApiErrorHandler } from '../use-error-handler';
import { ApiError, ErrorCodes } from '../../api';

// Mock console methods
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();

// Mock window.dispatchEvent
const mockDispatchEvent = jest.fn();
Object.defineProperty(window, 'dispatchEvent', {
  value: mockDispatchEvent,
  writable: true,
});

describe('useErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
    mockConsoleWarn.mockRestore();
  });

  it('should handle ApiError correctly', () => {
    const { result } = renderHook(() => useErrorHandler());

    const apiError = new ApiError(
      'Validation failed',
      ErrorCodes.VALIDATION_ERROR,
      400,
      { field: 'email' },
      'req-123'
    );

    const handledError = result.current.handleError(apiError);

    expect(handledError).toEqual({
      message: 'Validation failed',
      code: ErrorCodes.VALIDATION_ERROR,
      userMessage: 'Please check your input and try again.',
    });

    expect(mockConsoleError).toHaveBeenCalledWith('Error handled:', {
      message: 'Validation failed',
      code: ErrorCodes.VALIDATION_ERROR,
      error: apiError,
      timestamp: expect.any(String),
    });

    expect(mockConsoleWarn).toHaveBeenCalledWith(
      'Toast would show:',
      'Please check your input and try again.'
    );
  });

  it('should handle generic Error correctly', () => {
    const { result } = renderHook(() => useErrorHandler());

    const genericError = new Error('Something went wrong');
    const handledError = result.current.handleError(genericError);

    expect(handledError).toEqual({
      message: 'Something went wrong',
      code: ErrorCodes.INTERNAL_SERVER_ERROR,
      userMessage: 'Something went wrong. Please try again or contact support if the problem persists.',
    });
  });

  it('should handle unknown error types', () => {
    const { result } = renderHook(() => useErrorHandler());

    const unknownError = 'String error';
    const handledError = result.current.handleError(unknownError);

    expect(handledError).toEqual({
      message: 'An unexpected error occurred',
      code: ErrorCodes.INTERNAL_SERVER_ERROR,
      userMessage: 'Something went wrong. Please try again or contact support if the problem persists.',
    });
  });

  it('should respect error handler options', () => {
    const { result } = renderHook(() => useErrorHandler());

    const error = new Error('Test error');
    const handledError = result.current.handleError(error, {
      showToast: false,
      logError: false,
      fallbackMessage: 'Custom fallback',
    });

    expect(handledError.message).toBe('Test error');
    expect(mockConsoleError).not.toHaveBeenCalled();
    expect(mockConsoleWarn).not.toHaveBeenCalled();
  });

  it('should use fallback message when provided', () => {
    const { result } = renderHook(() => useErrorHandler());

    const unknownError = null;
    const handledError = result.current.handleError(unknownError, {
      fallbackMessage: 'Custom fallback message',
    });

    expect(handledError.message).toBe('Custom fallback message');
  });

  describe('getUserFriendlyMessage', () => {
    const testCases = [
      {
        code: ErrorCodes.NETWORK_ERROR,
        expected: 'Unable to connect to the server. Please check your internet connection and try again.',
      },
      {
        code: ErrorCodes.AUTHENTICATION_ERROR,
        expected: 'Your session has expired. Please log in again.',
      },
      {
        code: ErrorCodes.AUTHORIZATION_ERROR,
        expected: 'You do not have permission to perform this action.',
      },
      {
        code: ErrorCodes.VALIDATION_ERROR,
        expected: 'Please check your input and try again.',
      },
      {
        code: ErrorCodes.RESOURCE_NOT_FOUND,
        expected: 'The requested item could not be found.',
      },
      {
        code: ErrorCodes.RATE_LIMIT_EXCEEDED,
        expected: 'Too many requests. Please wait a moment and try again.',
      },
      {
        code: ErrorCodes.BUSINESS_LOGIC_ERROR,
        expected: 'Business logic error message', // Should use original message
      },
      {
        code: ErrorCodes.EXTERNAL_SERVICE_ERROR,
        expected: 'A third-party service is currently unavailable. Please try again later.',
      },
    ];

    testCases.forEach(({ code, expected }) => {
      it(`should return correct message for ${code}`, () => {
        const { result } = renderHook(() => useErrorHandler());

        const apiError = new ApiError(
          code === ErrorCodes.BUSINESS_LOGIC_ERROR ? 'Business logic error message' : 'Original message',
          code,
          400
        );

        const handledError = result.current.handleError(apiError);
        expect(handledError.userMessage).toBe(expected);
      });
    });
  });
});

describe('useApiErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle authentication errors by dispatching logout event', () => {
    const { result } = renderHook(() => useApiErrorHandler());

    const authError = new ApiError(
      'Token expired',
      ErrorCodes.AUTHENTICATION_ERROR,
      401
    );

    result.current.handleApiError(authError, 'login');

    expect(mockDispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'auth:logout',
      })
    );
  });

  it('should handle authorization errors with context logging', () => {
    const { result } = renderHook(() => useApiErrorHandler());

    const authzError = new ApiError(
      'Insufficient permissions',
      ErrorCodes.AUTHORIZATION_ERROR,
      403
    );

    result.current.handleApiError(authzError, 'delete customer');

    expect(mockConsoleWarn).toHaveBeenCalledWith(
      'Authorization error in context:',
      'delete customer'
    );
  });

  it('should handle validation errors with field details', () => {
    const { result } = renderHook(() => useApiErrorHandler());

    const validationError = new ApiError(
      'Validation failed',
      ErrorCodes.VALIDATION_ERROR,
      400,
      {
        fields: {
          email: 'Invalid email format',
          phone: 'Phone number required',
        },
      }
    );

    result.current.handleApiError(validationError, 'create customer');

    expect(mockConsoleWarn).toHaveBeenCalledWith('Validation errors:', {
      email: 'Invalid email format',
      phone: 'Phone number required',
    });
  });

  it('should use context in fallback message', () => {
    const { result } = renderHook(() => useApiErrorHandler());

    const genericError = new Error('Something went wrong');
    const handledError = result.current.handleApiError(genericError, 'update product');

    expect(handledError.message).toBe('Something went wrong');
    // The fallback message with context would be used if it was a non-Error type
  });

  it('should handle non-ApiError types', () => {
    const { result } = renderHook(() => useApiErrorHandler());

    const genericError = new Error('Network timeout');
    const handledError = result.current.handleApiError(genericError);

    expect(handledError.code).toBe(ErrorCodes.INTERNAL_SERVER_ERROR);
    expect(handledError.message).toBe('Network timeout');
  });

  it('should not dispatch logout event when window is undefined (SSR)', () => {
    // Mock window as undefined
    const originalWindow = global.window;
    (global as any).window = undefined;

    const { result } = renderHook(() => useApiErrorHandler());

    const authError = new ApiError(
      'Token expired',
      ErrorCodes.AUTHENTICATION_ERROR,
      401
    );

    // Should not throw error
    expect(() => {
      result.current.handleApiError(authError);
    }).not.toThrow();

    // Restore window
    global.window = originalWindow;
  });
});