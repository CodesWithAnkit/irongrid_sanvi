import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

// Types for API responses and errors
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
  requestId: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId: string;
  };
}

export enum ErrorCodes {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  BUSINESS_LOGIC_ERROR = 'BUSINESS_LOGIC_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
}

export class ApiError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: any;
  public readonly requestId?: string;

  constructor(
    message: string,
    code: string = ErrorCodes.INTERNAL_SERVER_ERROR,
    statusCode: number = 500,
    details?: any,
    requestId?: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.requestId = requestId;
  }

  static fromAxiosError(error: AxiosError): ApiError {
    if (error.response?.data && typeof error.response.data === 'object') {
      const errorData = error.response.data as ApiErrorResponse;
      if (errorData.error) {
        return new ApiError(
          errorData.error.message,
          errorData.error.code,
          error.response.status,
          errorData.error.details,
          errorData.error.requestId
        );
      }
    }

    // Handle timeout errors first
    if (error.code === 'ECONNABORTED') {
      return new ApiError(
        'Request timeout. Please try again.',
        ErrorCodes.NETWORK_ERROR,
        408
      );
    }

    // Handle network errors
    if (error.code === 'NETWORK_ERROR' || !error.response) {
      return new ApiError(
        'Network error. Please check your connection.',
        ErrorCodes.NETWORK_ERROR,
        0
      );
    }

    // Generic error handling
    const statusCode = error.response?.status || 500;
    const message = error.response?.statusText || error.message || 'An unexpected error occurred';
    
    return new ApiError(message, ErrorCodes.INTERNAL_SERVER_ERROR, statusCode);
  }
}

// Token management
class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'access_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';

  static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static setAccessToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
  }

  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setRefreshToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  static clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  static setTokens(accessToken: string, refreshToken: string): void {
    this.setAccessToken(accessToken);
    this.setRefreshToken(refreshToken);
  }
}

// Retry configuration
interface RetryConfig {
  retries: number;
  retryDelay: number;
  retryCondition: (error: AxiosError) => boolean;
}

const defaultRetryConfig: RetryConfig = {
  retries: 3,
  retryDelay: 1000,
  retryCondition: (error: AxiosError) => {
    // Retry on network errors, timeouts, and 5xx errors
    return !error.response || 
           error.code === 'NETWORK_ERROR' || 
           error.code === 'ECONNABORTED' ||
           (error.response.status >= 500 && error.response.status < 600);
  }
};

// Create axios instance
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api",
  timeout: 30000, // 30 seconds
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = TokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request ID for tracking
    config.headers['X-Request-ID'] = crypto.randomUUID();
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Token refresh state
let isRefreshing = false;
let pendingRequests: Array<(token: string) => void> = [];

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // Handle 401 errors with token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Wait for the token refresh to complete
        return new Promise((resolve) => {
          pendingRequests.push((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(api.request(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = TokenManager.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          { refreshToken },
          { withCredentials: true }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        TokenManager.setTokens(accessToken, newRefreshToken);

        // Retry all pending requests
        pendingRequests.forEach((callback) => callback(accessToken));
        pendingRequests = [];

        // Retry the original request
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return api.request(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        TokenManager.clearTokens();
        pendingRequests = [];
        
        // Emit event for components to handle logout
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:logout'));
        }
        
        throw ApiError.fromAxiosError(error);
      } finally {
        isRefreshing = false;
      }
    }

    // Convert axios error to ApiError
    throw ApiError.fromAxiosError(error);
  }
);

// Retry logic with exponential backoff
async function retryRequest<T>(
  requestFn: () => Promise<T>,
  config: RetryConfig = defaultRetryConfig
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= config.retries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      // Don't retry if it's the last attempt or if retry condition is not met
      if (attempt === config.retries || !config.retryCondition(error as AxiosError)) {
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = config.retryDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Enhanced API client with retry logic
export const apiClient = {
  // GET request with retry
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return retryRequest(() => api.get<ApiResponse<T>>(url, config).then(res => res.data));
  },

  // POST request with retry
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return retryRequest(() => api.post<ApiResponse<T>>(url, data, config).then(res => res.data), {
      ...defaultRetryConfig,
      retryCondition: (error) => {
        // Don't retry POST requests on 4xx errors (except 408, 429)
        if (error.response && error.response.status >= 400 && error.response.status < 500) {
          return error.response.status === 408 || error.response.status === 429;
        }
        return defaultRetryConfig.retryCondition(error);
      }
    });
  },

  // PUT request with retry
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return retryRequest(() => api.put<ApiResponse<T>>(url, data, config).then(res => res.data), {
      ...defaultRetryConfig,
      retryCondition: (error) => {
        // Don't retry PUT requests on 4xx errors (except 408, 429)
        if (error.response && error.response.status >= 400 && error.response.status < 500) {
          return error.response.status === 408 || error.response.status === 429;
        }
        return defaultRetryConfig.retryCondition(error);
      }
    });
  },

  // DELETE request with retry
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return retryRequest(() => api.delete<ApiResponse<T>>(url, config).then(res => res.data), {
      ...defaultRetryConfig,
      retryCondition: (error) => {
        // Don't retry DELETE requests on 4xx errors (except 408, 429)
        if (error.response && error.response.status >= 400 && error.response.status < 500) {
          return error.response.status === 408 || error.response.status === 429;
        }
        return defaultRetryConfig.retryCondition(error);
      }
    });
  },

  // PATCH request with retry
  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return retryRequest(() => api.patch<ApiResponse<T>>(url, data, config).then(res => res.data), {
      ...defaultRetryConfig,
      retryCondition: (error) => {
        // Don't retry PATCH requests on 4xx errors (except 408, 429)
        if (error.response && error.response.status >= 400 && error.response.status < 500) {
          return error.response.status === 408 || error.response.status === 429;
        }
        return defaultRetryConfig.retryCondition(error);
      }
    });
  }
};

// Export token manager for use in auth components
export { TokenManager };
