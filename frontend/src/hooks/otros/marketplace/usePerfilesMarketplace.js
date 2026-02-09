import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { marketplaceApi } from '@/services/api/endpoints';
import { sanitizeParams } from '@/lib/params';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { queryKeys } from '@/hooks/config';

// ==================== QUERIES (5) ====================

/**
 * Hook para listar categorías/industrias disponibles (público)
 * @returns {Object} { data: categorias[], isLoading, error }
 *
 * @example
 * const { data: categorias, isLoading } = useCategoriasMarketplace();
 * // categorias = [{ id: 1, codigo: 'barberia', nombre: 'Barbería', ... }, ...]
 */
export function useCategoriasMarketplace() {
  return useQuery({
    queryKey: queryKeys.marketplace.categorias,
    queryFn: async () => {
      const response = await marketplaceApi.getCategorias();
      return response.data.data || [];
    },
    staleTime: STALE_TIMES.LONG, // 30 minutos (categorías cambian poco)
  });
}

/**
 * Hook para listar perfiles del marketplace (público)
 * @param {Object} params - { ciudad, ciudad_id, categoria_id, rating_min, q, pagina, limite }
 * @returns {Object} { data: { perfiles, paginacion }, isLoading, error, refetch }
 *
 * @example
 * const { data, isLoading } = usePerfilesMarketplace({
 *   ciudad: 'CDMX',
 *   categoria_id: 1, // Filtro por industria
 *   rating_min: 4,
 *   pagina: 1,
 *   limite: 12
 * });
 */
export function usePerfilesMarketplace(params = {}) {
  return useQuery({
    queryKey: queryKeys.marketplace.perfiles.list(params),
    queryFn: async () => {
      // Sanitizar params y validar rating_min (1-5)
      const sanitizedParams = sanitizeParams(params);
      if (sanitizedParams.rating_min) {
        const num = parseInt(sanitizedParams.rating_min);
        if (!isNaN(num) && num >= 1 && num <= 5) {
          sanitizedParams.rating_min = num;
        } else {
          delete sanitizedParams.rating_min;
        }
      }

      const response = await marketplaceApi.getPerfiles(sanitizedParams);
      return {
        perfiles: response.data.data.perfiles || [],
        paginacion: response.data.data.paginacion || null,
      };
    },
    staleTime: STALE_TIMES.DYNAMIC, // 2 minutos (contenido público cambia poco)
    keepPreviousData: true, // Evita flash durante paginación
  });
}

/**
 * Hook para obtener perfil público por slug
 * @param {string} slug - Slug único del perfil
 * @returns {Object} { data: perfil, isLoading, error }
 *
 * @example
 * const { data: perfil, isLoading } = usePerfilPublico('barberia-cdmx-abc123');
 */
export function usePerfilPublico(slug) {
  return useQuery({
    queryKey: queryKeys.marketplace.perfiles.publico(slug),
    queryFn: async () => {
      const response = await marketplaceApi.getPerfilPorSlug(slug);
      // El backend retorna { perfil, servicios, profesionales, reseñas, stats }
      // Pero necesitamos solo el objeto perfil con todos los datos incluidos
      const data = response.data.data;
      return {
        ...data.perfil,
        servicios: data.servicios || [],
        profesionales: data.profesionales || [],
        reseñas: data.reseñas || [],
        stats: data.stats || {}
      };
    },
    enabled: !!slug,
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
  });
}

/**
 * Hook para obtener mi perfil de marketplace (admin/propietario)
 * @returns {Object} { data: perfil, isLoading, error, refetch }
 *
 * @example
 * const { data: miPerfil, isLoading } = useMiPerfilMarketplace();
 */
export function useMiPerfilMarketplace() {
  return useQuery({
    queryKey: queryKeys.marketplace.perfiles.miPerfil,
    queryFn: async () => {
      const response = await marketplaceApi.getMiPerfil();
      return response.data.data;
    },
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
  });
}

/**
 * Hook para obtener estadísticas del perfil
 * @param {number} id - ID del perfil
 * @param {Object} params - { fecha_desde, fecha_hasta }
 * @returns {Object} { data: estadisticas, isLoading, error }
 *
 * @example
 * const { data: stats } = useEstadisticasPerfil(1, {
 *   fecha_desde: '2025-01-01',
 *   fecha_hasta: '2025-01-31'
 * });
 */
export function useEstadisticasPerfil(id, params = {}) {
  return useQuery({
    queryKey: queryKeys.marketplace.estadisticasPerfil(id, params),
    queryFn: async () => {
      const response = await marketplaceApi.getEstadisticasPerfil(id, sanitizeParams(params));
      return response.data.data;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.FREQUENT, // 1 minuto
  });
}

// ==================== MUTATIONS (2) ====================

/**
 * Hook para crear perfil de marketplace
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 *
 * @example
 * const crearPerfil = useCrearPerfil();
 *
 * const handleCrear = () => {
 *   crearPerfil.mutate({
 *     nombre_comercial: 'Barbería El Corte',
 *     ciudad: 'CDMX',
 *     categoria: 'belleza',
 *     descripcion_corta: 'Los mejores cortes de la ciudad'
 *   });
 * };
 */
export function useCrearPerfil() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      // ⚠️ Sanitizar campos opcionales vacíos
      const sanitized = {
        ...data,
        descripcion_larga: data.descripcion_larga?.trim() || undefined,
        email_publico: data.email_publico?.trim() || undefined,
        sitio_web: data.sitio_web?.trim() || undefined,
        instagram: data.instagram?.trim() || undefined,
        facebook: data.facebook?.trim() || undefined,
      };
      const response = await marketplaceApi.crearPerfil(sanitized);
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidar queries relacionadas (sin exact para capturar todas las variantes)
      queryClient.invalidateQueries({ queryKey: queryKeys.marketplace.perfiles.all, refetchType: 'active' });
      // Invalidar mi perfil (con exact porque es específico)
      queryClient.invalidateQueries({ queryKey: queryKeys.marketplace.perfiles.miPerfil, exact: true, refetchType: 'active' });
      // Invalidar setup progress del dashboard
      queryClient.invalidateQueries({ queryKey: queryKeys.marketplace.setupProgress, exact: true, refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('create', 'Perfil', {
      409: 'Ya existe un perfil para esta organizacion',
    }),
  });
}

/**
 * Hook para actualizar perfil de marketplace
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 *
 * @example
 * const actualizar = useActualizarPerfil();
 *
 * const handleActualizar = () => {
 *   actualizar.mutate({
 *     id: 1,
 *     data: { descripcion_corta: 'Nueva descripción' }
 *   });
 * };
 */
export function useActualizarPerfil() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      // ⚠️ Sanitizar campos opcionales vacíos
      const sanitized = {
        ...data,
        descripcion_larga: data.descripcion_larga?.trim() || undefined,
        email_publico: data.email_publico?.trim() || undefined,
        sitio_web: data.sitio_web?.trim() || undefined,
        instagram: data.instagram?.trim() || undefined,
        facebook: data.facebook?.trim() || undefined,
      };
      const response = await marketplaceApi.actualizarPerfil(id, sanitized);
      return response.data.data;
    },
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.marketplace.perfiles.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.marketplace.perfiles.miPerfil, exact: true, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.marketplace.perfiles.publico(data.slug), exact: true, refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Perfil'),
  });
}
