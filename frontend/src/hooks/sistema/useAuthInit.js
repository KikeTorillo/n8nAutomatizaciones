import { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore, { selectIsAuthenticated, selectLogout } from '@/store/authStore';
import { getAccessToken, setAccessToken } from '@/services/auth/tokenManager';

/**
 * Hook para inicializar autenticación al recargar página
 * Ene 2026 - Migración de seguridad XSS
 *
 * Al recargar, el accessToken en memoria se pierde.
 * Este hook restaura la sesión usando la cookie httpOnly (refreshToken).
 *
 * Flujo:
 * 1. Si no hay sesión activa (isAuthenticated=false), no hacer nada
 * 2. Si hay sesión pero no token en memoria, hacer refresh
 * 3. Si el refresh falla (cookie expirada), hacer logout
 */
export function useAuthInit() {
  const [isInitializing, setIsInitializing] = useState(true);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const logout = useAuthStore(selectLogout);

  useEffect(() => {
    const initAuth = async () => {
      // Si no está autenticado en localStorage, no hay sesión que restaurar
      if (!isAuthenticated) {
        setIsInitializing(false);
        return;
      }

      // Si ya hay token en memoria, la sesión está activa
      if (getAccessToken()) {
        setIsInitializing(false);
        return;
      }

      // Hay sesión en localStorage pero no token en memoria
      // Intentar restaurar usando la cookie httpOnly
      try {
        console.log('🔄 Restaurando sesión...');

        const response = await axios.post(
          '/api/v1/auth/refresh',
          {}, // Body vacío - el refreshToken viene en la cookie httpOnly
          { withCredentials: true }
        );

        const { accessToken } = response.data.data;
        setAccessToken(accessToken);

        console.log('✅ Sesión restaurada exitosamente');
      } catch (error) {
        console.warn('⚠️ No se pudo restaurar la sesión:', error.message);

        // Cookie expirada o inválida - hacer logout
        logout();
      } finally {
        setIsInitializing(false);
      }
    };

    initAuth();
  }, [isAuthenticated, logout]);

  return { isInitializing };
}

export default useAuthInit;
