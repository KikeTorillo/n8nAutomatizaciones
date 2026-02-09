import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { marketplaceApi } from '@/services/api/endpoints';
import { sanitizeParams } from '@/lib/params';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { queryKeys } from '@/hooks/config';

// ==================== QUERIES (1) ====================

/**
 * Hook para listar reseñas de un negocio (público)
 * @param {string} slug - Slug del negocio
 * @param {Object} params - { pagina, limite, orden }
 * @returns {Object} { data: { resenas, paginacion }, isLoading, error }
 *
 * @example
 * const { data, isLoading } = useReseñasNegocio('barberia-cdmx-abc123', {
 *   pagina: 1,
 *   limite: 10,
 *   orden: 'recientes'
 * });
 */
export function useReseñasNegocio(slug, params = {}) {
  return useQuery({
    queryKey: queryKeys.marketplace.resenas(slug, params),
    queryFn: async () => {
      const response = await marketplaceApi.getReseñas(slug, sanitizeParams(params));
      return {
        resenas: response.data.data.resenas || [],
        paginacion: response.data.data.paginacion || null,
      };
    },
    enabled: !!slug,
    staleTime: STALE_TIMES.DYNAMIC, // 2 minutos
    keepPreviousData: true,
  });
}

// ==================== MUTATIONS (3) ====================

/**
 * Hook para crear reseña (cliente con cita completada)
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 *
 * @example
 * const crearResena = useCrearReseña();
 *
 * const handleCrear = () => {
 *   crearResena.mutate({
 *     cita_id: 123,
 *     rating: 5,
 *     comentario: 'Excelente servicio'
 *   });
 * };
 */
export function useCrearReseña() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const sanitized = {
        ...data,
        comentario: data.comentario?.trim() || undefined,
      };
      const response = await marketplaceApi.crearReseña(sanitized);
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidar reseñas del negocio
      queryClient.invalidateQueries({ queryKey: ['resenas-negocio'], refetchType: 'active' });
      // Invalidar perfil público (para actualizar rating promedio)
      queryClient.invalidateQueries({ queryKey: ['perfil-publico'], refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('create', 'Resena', {
      400: 'No puedes crear resena para esta cita',
      409: 'Ya creaste una resena para esta cita',
    }),
  });
}

/**
 * Hook para responder reseña (admin/propietario)
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 *
 * @example
 * const responder = useResponderReseña();
 *
 * const handleResponder = () => {
 *   responder.mutate({
 *     id: 1,
 *     respuesta: '¡Gracias por tu comentario!'
 *   });
 * };
 */
export function useResponderReseña() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, respuesta }) => {
      const response = await marketplaceApi.responderReseña(id, {
        respuesta: respuesta.trim(),
      });
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidar reseñas
      queryClient.invalidateQueries({ queryKey: ['resenas-negocio'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.marketplace.perfiles.miPerfil, exact: true, refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Resena'),
  });
}

/**
 * Hook para moderar reseña (admin/propietario)
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 *
 * @example
 * const moderar = useModerarReseña();
 *
 * const handleModerar = () => {
 *   moderar.mutate({
 *     id: 1,
 *     estado: 'oculta',
 *     motivo_moderacion: 'Contenido inapropiado'
 *   });
 * };
 */
export function useModerarReseña() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, estado, motivo_moderacion }) => {
      const response = await marketplaceApi.moderarReseña(id, {
        estado,
        motivo_moderacion: motivo_moderacion?.trim() || undefined,
      });
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidar reseñas
      queryClient.invalidateQueries({ queryKey: ['resenas-negocio'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.marketplace.perfiles.miPerfil, exact: true, refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Resena'),
  });
}
