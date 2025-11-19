import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketplaceApi } from '@/services/api/endpoints';

/**
 * Hooks personalizados para Super Admin - Gestión de Marketplace
 * Solo accesible para usuarios con rol super_admin
 */

// ==================== QUERIES (1) ====================

/**
 * Hook para listar TODOS los perfiles de marketplace (super_admin)
 * Incluye perfiles activos e inactivos con datos de organización
 *
 * @param {Object} params - { activo, ciudad, rating_min, pagina, limite }
 * @returns {Object} { data: { perfiles, paginacion }, isLoading, error, refetch }
 *
 * @example
 * const { data, isLoading } = usePerfilesAdmin({
 *   activo: 'true', // 'true' | 'false' | undefined (todos)
 *   ciudad: 'CDMX',
 *   rating_min: 4,
 *   pagina: 1,
 *   limite: 20
 * });
 */
export function usePerfilesAdmin(params = {}) {
  return useQuery({
    queryKey: ['perfiles-admin', params],
    queryFn: async () => {
      // ⚠️ CRÍTICO: Sanitizar params - eliminar valores vacíos
      const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          // Validar rating_min (0-5)
          if (key === 'rating_min') {
            const num = parseFloat(value);
            if (!isNaN(num) && num >= 0 && num <= 5) {
              acc[key] = num;
            }
          } else {
            acc[key] = value;
          }
        }
        return acc;
      }, {});

      const response = await marketplaceApi.getPerfilesAdmin(sanitizedParams);
      return {
        perfiles: response.data.data.perfiles || [],
        paginacion: response.data.data.paginacion || null,
      };
    },
    staleTime: 1000 * 60, // 1 minuto (datos administrativos cambian poco)
    keepPreviousData: true, // Evita flash durante paginación
  });
}

// ==================== MUTATIONS (2) ====================

/**
 * Hook para activar/desactivar perfil de marketplace (super_admin)
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 *
 * @example
 * const activarPerfil = useActivarPerfil();
 *
 * const handleToggle = () => {
 *   activarPerfil.mutate({
 *     id: 123,
 *     activo: true
 *   });
 * };
 */
export function useActivarPerfil() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, activo }) => {
      const response = await marketplaceApi.activarPerfil(id, activo);
      return response.data.data;
    },
    onSuccess: () => {
      // ✅ Invalidar lista de perfiles admin
      queryClient.invalidateQueries({ queryKey: ['perfiles-admin'] });
      // ✅ Invalidar lista pública de perfiles (por si el super admin está viendo el directorio)
      queryClient.invalidateQueries({ queryKey: ['perfiles-marketplace'] });
    },
    onError: (error) => {
      // ⚠️ PRIORIZAR mensaje del backend
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }

      const errorMessages = {
        404: 'Perfil no encontrado',
        403: 'No tienes permisos para esta acción',
      };

      const statusCode = error.response?.status;
      throw new Error(errorMessages[statusCode] || 'Error al cambiar estado del perfil');
    },
  });
}

/**
 * Hook para limpiar analytics antiguos (super_admin)
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 *
 * @example
 * const limpiarAnalytics = useLimpiarAnalytics();
 *
 * const handleLimpiar = () => {
 *   limpiarAnalytics.mutate({
 *     dias_antiguedad: 90 // Eliminar datos mayores a 90 días
 *   });
 * };
 */
export function useLimpiarAnalytics() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dias_antiguedad }) => {
      const response = await marketplaceApi.limpiarAnalytics({ dias_antiguedad });
      return response.data.data;
    },
    onSuccess: () => {
      // ✅ Invalidar estadísticas de perfiles
      queryClient.invalidateQueries({ queryKey: ['estadisticas-perfil'] });
    },
    onError: (error) => {
      // ⚠️ PRIORIZAR mensaje del backend
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }

      const errorMessages = {
        400: 'Parámetros inválidos. Los días de antigüedad deben ser mínimo 90',
        403: 'No tienes permisos para esta acción',
      };

      const statusCode = error.response?.status;
      throw new Error(errorMessages[statusCode] || 'Error al limpiar analytics');
    },
  });
}

// ==================== EXPORT DEFAULT ====================

export default {
  // Queries
  usePerfilesAdmin,

  // Mutations
  useActivarPerfil,
  useLimpiarAnalytics,
};
