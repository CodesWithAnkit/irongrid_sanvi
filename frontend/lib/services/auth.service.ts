import { apiClient, TokenManager } from '../api';
import type { User } from '../types/api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const authService = {
  async login(data: LoginRequest) {
    const response = await apiClient.post<{ user: User }>('/auth/login', data);

    // Tokens are set as cookies by the backend, no need to store them manually
    
    return response;
  },

  async register(data: RegisterRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/register', data);
    
    // Store tokens
    TokenManager.setTokens(response.data.accessToken, response.data.refreshToken);
    
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      // Clear any stored tokens (though we mainly use cookies)
      TokenManager.clearTokens();
    }
  },

  async refreshToken(): Promise<{ user: User }> {
    const response = await apiClient.post<{ user: User }>('/auth/refresh', {});
    
    // Tokens are refreshed as cookies by the backend
    
    return response;
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    await apiClient.post('/auth/forgot-password', data);
  },

  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    await apiClient.post('/auth/reset-password', data);
  },

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await apiClient.post('/auth/change-password', data);
  },

  isAuthenticated(): boolean {
    // Since we use cookies, we can't easily check authentication status on the client
    // This should be determined by trying to fetch the current user
    return true; // Will be handled by the useCurrentUser hook
  },
};