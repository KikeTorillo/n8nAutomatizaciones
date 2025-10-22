import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './queryClient';
import ToastContainer from '@/components/common/ToastContainer';
import useAuthStore from '@/store/authStore';
import { authApi } from '@/services/api/endpoints';

function App() {
  const { isAuthenticated, setUser } = useAuthStore();

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
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <Outlet />
        <ToastContainer />
      </div>
    </QueryClientProvider>
  );
}

export default App;
