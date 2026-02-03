/**
 * ====================================================================
 * WEBSITE - HOOKS DE LECTURA (QUERIES)
 * ====================================================================
 * Hooks de TanStack Query para operaciones de lectura del modulo website.
 *
 * @since 2026-01-29
 */

import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { websiteApi } from '@/services/api/endpoints';
import { useAuthStore, selectIsAuthenticated } from '@/features/auth';
import { WEBSITE_KEYS } from './constants';

// ==================== QUERIES - CONFIG ====================

/**
 * Hook para obtener la configuracion del sitio web
 */
export function useWebsiteConfig() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  return useQuery({
    queryKey: WEBSITE_KEYS.config(),
    queryFn: async () => {
      const response = await websiteApi.obtenerConfig();
      return response.data.data;
    },
    enabled: isAuthenticated,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook para verificar disponibilidad de slug
 */
export function useVerificarSlug(slug, excludeId) {
  return useQuery({
    queryKey: WEBSITE_KEYS.slugDisponible(slug),
    queryFn: async () => {
      const response = await websiteApi.verificarSlug(slug, excludeId);
      return response.data.data;
    },
    enabled: !!slug && slug.length >= 3,
    staleTime: STALE_TIMES.REAL_TIME,
  });
}

// ==================== QUERIES - PAGINAS ====================

/**
 * Hook para listar paginas del sitio
 */
export function useWebsitePaginas() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  return useQuery({
    queryKey: WEBSITE_KEYS.paginas(),
    queryFn: async () => {
      const response = await websiteApi.listarPaginas();
      return response.data.data;
    },
    enabled: isAuthenticated,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para obtener una pagina por ID
 */
export function useWebsitePagina(id) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  return useQuery({
    queryKey: WEBSITE_KEYS.pagina(id),
    queryFn: async () => {
      const response = await websiteApi.obtenerPagina(id);
      return response.data.data;
    },
    enabled: isAuthenticated && !!id,
  });
}

// ==================== QUERIES - BLOQUES ====================

/**
 * Hook para listar bloques de una pagina
 */
export function useWebsiteBloques(paginaId) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  return useQuery({
    queryKey: WEBSITE_KEYS.bloques(paginaId),
    queryFn: async () => {
      const response = await websiteApi.listarBloques(paginaId);
      return response.data.data;
    },
    enabled: isAuthenticated && !!paginaId,
    staleTime: STALE_TIMES.FREQUENT,
  });
}

/**
 * Hook para obtener tipos de bloques disponibles
 */
export function useTiposBloques() {
  return useQuery({
    queryKey: WEBSITE_KEYS.tiposBloques(),
    queryFn: async () => {
      const response = await websiteApi.listarTiposBloques();
      return response.data.data;
    },
    staleTime: STALE_TIMES.LONG,
  });
}

/**
 * Hook para obtener contenido default de un tipo de bloque
 */
export function useDefaultBloque(tipo) {
  return useQuery({
    queryKey: WEBSITE_KEYS.defaultBloque(tipo),
    queryFn: async () => {
      const response = await websiteApi.obtenerDefaultBloque(tipo);
      return response.data.data;
    },
    enabled: !!tipo,
    staleTime: STALE_TIMES.LONG,
  });
}
