import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios, { AxiosError } from 'axios';
import { ApiError, ErrorCodes, TokenManager } from '../api';

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
      defaults: { baseURL: 'http://localhost:3001/api' },
    })),
    post: vi.fn(),
  },
  AxiosError: class MockAxiosError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'AxiosError';
    }
    response?: any;
    code?: string;
  },
}));

const mockedAxios = vi.mocked(axios);

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('ApiError', () => {
  it('should create ApiError from axios error with response', () => {
    const axiosError = {
      response: {
        status: 400,
        data: {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: { field: 'email' },
            requestId: 'req-123',
          },
        },
      },
    } as AxiosError;

    const apiError = ApiError.fromAxiosError(axiosError);

    expect(apiError.message).toBe('Invalid input');
    expect(apiError.code).toBe('VALIDATION_ERROR');
    expect(apiError.statusCode).toBe(400);
    expect(apiError.details).toEqual({ field: 'email' });
    expect(apiError.requestId).toBe('req-123');
  });

  it('should handle network errors', () => {
    const axiosError = {
      code: 'NETWORK_ERROR',
      message: 'Network Error',
    } as AxiosError;

    const apiError = ApiError.fromAxiosError(axiosError);

    expect(apiError.message).toBe('Network error. Please check your connection.');
    expect(apiError.code).toBe(ErrorCodes.NETWORK_ERROR);
    expect(apiError.statusCode).toBe(0);
  });

  it('should handle timeout errors', () => {
    const axiosError = {
      code: 'ECONNABORTED',
      message: 'timeout of 30000ms exceeded',
    } as AxiosError;

    const apiError = ApiError.fromAxiosError(axiosError);

    expect(apiError.message).toBe('Request timeout. Please try again.');
    expect(apiError.code).toBe(ErrorCodes.NETWORK_ERROR);
    expect(apiError.statusCode).toBe(408);
  });
});

describe('TokenManager', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  it('should get access token from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('test-token');
    
    const token = TokenManager.getAccessToken();
    
    expect(token).toBe('test-token');
    expect(localStorageMock.getItem).toHaveBeenCalledWith('access_token');
  });

  it('should set access token in localStorage', () => {
    TokenManager.setAccessToken('new-token');
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith('access_token', 'new-token');
  });

  it('should clear tokens from localStorage', () => {
    TokenManager.clearTokens();
    
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('access_token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh_token');
  });

  it('should set both tokens', () => {
    TokenManager.setTokens('access-token', 'refresh-token');
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith('access_token', 'access-token');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('refresh_token', 'refresh-token');
  });
});

// Note: apiClient tests would require more complex mocking of the retry logic
// For now, we'll focus on testing the core error handling and token management