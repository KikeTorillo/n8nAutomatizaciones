import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'sonner';
import { queryClient } from './queryClient';
import { ToastContainer } from '@/components/ui';
import SetupGuard from '@/components/auth/SetupGuard';
import useAuthStore, { selectIsAuthenticated, selectSetUser } from '@/store/authStore';
import useThemeStore, { selectApplyTheme, selectInitSystemListener } from '@/store/themeStore';
import { authApi } from '@/services/api/endpoints';

function App() {
  // Ene 2026: Usar selectores para evitar re-renders
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const setUser = useAuthStore(selectSetUser);
  const initSystemListener = useThemeStore(selectInitSystemListener);
  const applyTheme = useThemeStore(selectApplyTheme);

  // Inicializar tema al montar la aplicación
  useEffect(() => {
    applyTheme();
    const cleanup = initSystemListener();
    return cleanup;
  }, [applyTheme, initSystemListener]);

  // Cargar datos completos del usuario (incluyendo tipo_industria) al iniciar la app
  useEffect(() => {
    const fetchUserData = async () => {
      if (isAuthenticated) {
        try {
          const response = await authApi.me();
          setUser(response.data.data.usuario);
        } catch (error) {
          console.error('Error al obtener datos del usuario:', error);
          // Si falla, no hacemos nada - el usuario ya tiene datos básicos del login
        }
      }
    };

    fetchUserData();
  }, [isAuthenticated, setUser]);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <SetupGuard>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
            <Outlet />
            <ToastContainer />
            <Toaster position="top-center" richColors closeButton theme="system" />
          </div>
        </SetupGuard>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
