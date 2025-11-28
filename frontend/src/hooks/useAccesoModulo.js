import { useQuery } from '@tanstack/react-query';
import { profesionalesApi } from '@/services/api/endpoints';
import useAuthStore from '@/store/authStore';

/**
 * Hook para validar acceso a módulos y obtener profesional vinculado
 * Nov 2025 - Modelo Unificado Profesional-Usuario
 *
 * @param {string} modulo - Módulo a validar: 'agendamiento' | 'pos' | 'inventario'
 * @returns {Object} { tieneAcceso, profesional, isLoading, error }
 *
 * @example
 * // En VentaPOSPage.jsx
 * const { tieneAcceso, profesional, isLoading } = useAccesoModulo('pos');
 *
 * useEffect(() => {
 *   if (!isLoading && !tieneAcceso) {
 *     toast.error('No tienes acceso al Punto de Venta');
 *     navigate('/home');
 *   }
 * }, [tieneAcceso, isLoading]);
 */
export function useAccesoModulo(modulo) {
  const { user, isAuthenticated } = useAuthStore();

  const {
    data: profesional,
    isLoading,
    error,
    isError
  } = useQuery({
    queryKey: ['profesional-usuario', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const response = await profesionalesApi.buscarPorUsuario(user.id);
      // El backend retorna null si no hay profesional vinculado
      return response.data.data || null;
    },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 1000 * 60 * 10, // 10 minutos - datos de acceso cambian poco
    refetchOnWindowFocus: false,
  });

  // Calcular si tiene acceso al módulo
  const tieneAcceso = profesional?.modulos_acceso?.[modulo] === true;

  return {
    tieneAcceso,
    profesional,
    isLoading,
    error,
    isError,
    // Helpers adicionales
    profesionalId: profesional?.id || null,
    profesionalNombre: profesional?.nombre_completo || null,
    modulosAcceso: profesional?.modulos_acceso || {},
  };
}

/**
 * Hook para obtener profesional del usuario logueado
 * Útil cuando solo necesitas los datos del profesional, no validar acceso
 *
 * @returns {Object} { profesional, isLoading, error }
 */
export function useProfesionalUsuario() {
  const { user, isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['profesional-usuario', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const response = await profesionalesApi.buscarPorUsuario(user.id);
      return response.data.data || null;
    },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook para listar usuarios disponibles para vincular
 * Solo para admins en el formulario de profesionales
 *
 * @returns {Object} { usuarios, isLoading, error }
 */
export function useUsuariosDisponibles() {
  return useQuery({
    queryKey: ['usuarios-disponibles'],
    queryFn: async () => {
      const response = await profesionalesApi.usuariosDisponibles();
      return response.data.data?.usuarios || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export default useAccesoModulo;
