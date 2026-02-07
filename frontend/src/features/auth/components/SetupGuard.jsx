/**
 * Guard para verificar si el sistema necesita setup inicial
 * Redirige a /setup si no existe super administrador
 */

import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/config';
import apiClient from '@/services/api/client';

export default function SetupGuard({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  const { data: setupStatus, isLoading } = useQuery({
    queryKey: queryKeys.auth.setupCheck,
    queryFn: async () => {
      try {
        const response = await apiClient.get('/setup/check');
        return response.data.data;
      } catch (error) {
        console.error('Error verificando setup:', error);
        // Si falla, asumir que no necesita setup
        return { needsSetup: false, hasSuperAdmin: true };
      }
    },
    // Solo hacer la consulta una vez al inicio
    staleTime: Infinity,
    cacheTime: Infinity,
  });

  useEffect(() => {
    if (isLoading) {
      return;
    }

    setIsChecking(false);

    // Si necesita setup y no estamos en la página de setup, redirigir
    if (setupStatus?.needsSetup && location.pathname !== '/setup') {
      navigate('/setup', { replace: true });
    }

    // Si no necesita setup y estamos en la página de setup, redirigir al login
    if (!setupStatus?.needsSetup && location.pathname === '/setup') {
      navigate('/login', { replace: true });
    }
  }, [setupStatus, isLoading, location.pathname, navigate]);

  // Mostrar loading mientras verifica
  if (isChecking || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 dark:border-primary-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Verificando sistema...</p>
        </div>
      </div>
    );
  }

  return children;
}
