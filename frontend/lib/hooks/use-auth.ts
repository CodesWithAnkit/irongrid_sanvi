import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authService } from '../services/auth.service';
import { queryKeys, invalidateQueries } from '../query-client';
import { ApiError } from '../api';
import type { 
  LoginRequest, 
  RegisterRequest, 
  ForgotPasswordRequest, 
  ResetPasswordRequest,
  ChangePasswordRequest 
} from '../services/auth.service';

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.auth.currentUser,
    queryFn: authService.getCurrentUser,
    enabled: authService.isAuthenticated(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error instanceof ApiError && error.statusCode === 401) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      // Set user data in cache
      queryClient.setQueryData(queryKeys.auth.currentUser, data.user);
      console.log(data);
      // Redirect to dashboard
      router.push('/admin/dashboard');
    },
    onError: (error: ApiError) => {
      console.error('Login failed:', error.message);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: authService.register,
    onSuccess: (data) => {
      // Set user data in cache
      queryClient.setQueryData(queryKeys.auth.currentUser, data.user);
      
      // Redirect to dashboard
      router.push('/admin/dashboard');
    },
    onError: (error: ApiError) => {
      console.error('Registration failed:', error.message);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      
      // Redirect to login
      router.push('/auth/login');
    },
    onError: (error: ApiError) => {
      console.error('Logout failed:', error.message);
      
      // Even if logout fails, clear cache and redirect
      queryClient.clear();
      router.push('/auth/login');
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: authService.forgotPassword,
    onError: (error: ApiError) => {
      console.error('Forgot password failed:', error.message);
    },
  });
}

export function useResetPassword() {
  const router = useRouter();

  return useMutation({
    mutationFn: authService.resetPassword,
    onSuccess: () => {
      // Redirect to login after successful password reset
      router.push('/auth/login?message=password-reset-success');
    },
    onError: (error: ApiError) => {
      console.error('Reset password failed:', error.message);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: authService.changePassword,
    onError: (error: ApiError) => {
      console.error('Change password failed:', error.message);
    },
  });
}

// Auth state hook
export function useAuth() {
  const { data: user, isLoading, error } = useCurrentUser();
  const loginMutation = useLogin();
  const logoutMutation = useLogout();
  const registerMutation = useRegister();

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    register: registerMutation.mutate,
    isLoginLoading: loginMutation.isPending,
    isLogoutLoading: logoutMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
    loginError: loginMutation.error,
    logoutError: logoutMutation.error,
    registerError: registerMutation.error,
  };
}