import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/services/api/endpoints';
import useAuthStore, {
  selectSetAuth,
  selectLogout,
  selectIsAuthenticated,
  selectUser,
} from '@/store/authStore';

/**
 * Hook personalizado para manejo de autenticación
 * Ene 2026: Migrado a selectores para evitar re-renders
 */
export function useAuth() {
  const navigate = useNavigate();
  // Ene 2026: Usar selectores individuales para evitar re-renders innecesarios
  const setAuth = useAuthStore(selectSetAuth);
  const clearAuth = useAuthStore(selectLogout);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const user = useAuthStore(selectUser);

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

      // Redirección basada en el rol del usuario
      const userRole = data.user?.rol || data.usuario?.rol;
      let redirectPath = '/home'; // Default: App Home (Nov 2025)

      if (userRole === 'super_admin') {
        redirectPath = '/superadmin';
      } else if (userRole === 'empleado') {
        redirectPath = '/citas';
      }

      navigate(redirectPath);
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
