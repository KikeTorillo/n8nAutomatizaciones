import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/services/api/endpoints';
import useAuthStore from '@/store/authStore';

/**
 * Hook personalizado para manejo de autenticación
 */
export function useAuth() {
  const navigate = useNavigate();
  const { setAuth, logout: clearAuth, isAuthenticated, user } = useAuthStore();

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      const response = await authApi.login(credentials);
      return response.data.data;
    },
    onSuccess: (data) => {
      setAuth({
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      navigate('/dashboard');
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await authApi.logout();
    },
    onSuccess: () => {
      clearAuth();
      navigate('/login');
    },
    onError: () => {
      // Limpiar igualmente si falla
      clearAuth();
      navigate('/login');
    },
  });

  return {
    // State
    isAuthenticated,
    user,

    // Actions
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,

    // Loading states
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,

    // Errors
    loginError: loginMutation.error,
    logoutError: logoutMutation.error,
  };
}
