import { useEffect } from 'react';
import { Outlet, ScrollRestoration } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'sonner';
import { Loader2 } from 'lucide-react';
import { queryClient } from './queryClient';
import { ToastContainer } from '@/components/ui';
import GlobalErrorBoundary from '@/components/common/GlobalErrorBoundary';
import SetupGuard from '@/components/auth/SetupGuard';
import { SubscriptionGuard } from '@/components/suscripciones-negocio';
import useAuthStore, { selectIsAuthenticated, selectSetUser } from '@/store/authStore';
import useThemeStore, { selectApplyTheme, selectInitSystemListener } from '@/store/themeStore';
import { useAuthInit } from '@/hooks/sistema/useAuthInit';
import { authApi } from '@/services/api/endpoints';

function App() {
  // Ene 2026: Inicializar autenticación al recargar (restaurar sesión)
  const { isInitializing } = useAuthInit();

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
  // Solo ejecutar cuando la inicialización haya terminado
  useEffect(() => {
    const fetchUserData = async () => {
      if (isAuthenticated && !isInitializing) {
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
  }, [isAuthenticated, isInitializing, setUser]);

  // Mostrar loading mientras se restaura la sesión
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-primary-600 dark:text-primary-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <GlobalErrorBoundary>
          <SetupGuard>
            <SubscriptionGuard>
              <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
                <ScrollRestoration />
                <Outlet />
                <ToastContainer />
                <Toaster position="top-center" richColors closeButton theme="system" />
              </div>
            </SubscriptionGuard>
          </SetupGuard>
        </GlobalErrorBoundary>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
