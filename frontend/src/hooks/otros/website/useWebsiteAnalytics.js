import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { websiteApi } from '@/services/api/endpoints';
import useAuthStore, { selectIsAuthenticated } from '@/store/authStore';
import { ANALYTICS_KEYS } from './constants';

/**
 * Hook para obtener el resumen de analytics
 * @param {Object} params - { dias?, website_id? }
 */
export function useWebsiteAnalyticsResumen(params = {}) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  return useQuery({
    queryKey: ANALYTICS_KEYS.resumen(params),
    queryFn: async () => {
      const response = await websiteApi.obtenerResumenAnalytics(params);
      return response.data?.data ?? response.data ?? response;
    },
    enabled: isAuthenticated,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para obtener las paginas mas populares
 * @param {Object} params - { dias?, website_id?, limite? }
 */
export function useWebsiteAnalyticsPaginas(params = {}) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  return useQuery({
    queryKey: ANALYTICS_KEYS.paginas(params),
    queryFn: async () => {
      const response = await websiteApi.obtenerPaginasPopulares(params);
      return response.data?.data ?? response.data ?? response;
    },
    enabled: isAuthenticated,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para obtener eventos recientes
 * @param {Object} params - { website_id?, evento_tipo?, limite?, offset? }
 */
export function useWebsiteAnalyticsEventos(params = {}) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  return useQuery({
    queryKey: ANALYTICS_KEYS.eventos(params),
    queryFn: async () => {
      const response = await websiteApi.listarEventos(params);
      return response.data?.data ?? response.data ?? response;
    },
    enabled: isAuthenticated,
    staleTime: STALE_TIMES.FREQUENT,
  });
}

/**
 * Hook para obtener metricas en tiempo real
 * @param {string} websiteId - UUID opcional del sitio
 * @param {Object} options - { enabled?, refetchInterval? }
 */
export function useWebsiteAnalyticsTiempoReal(websiteId = null, options = {}) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const { enabled = true, refetchInterval = 30000 } = options;

  return useQuery({
    queryKey: ANALYTICS_KEYS.tiempoReal(websiteId),
    queryFn: async () => {
      const response = await websiteApi.obtenerTiempoReal(websiteId);
      return response.data?.data ?? response.data ?? response;
    },
    enabled: isAuthenticated && enabled,
    staleTime: STALE_TIMES.REAL_TIME,
    refetchInterval: refetchInterval,
  });
}

/**
 * Funcion utilitaria para registrar eventos de tracking (fire-and-forget)
 * Se usa en el sitio publico
 * @param {string} slug - Slug del sitio
 * @param {string} eventoTipo - Tipo de evento
 * @param {Object} datos - Datos adicionales del evento
 */
export function trackEvent(slug, eventoTipo, datos = {}) {
  websiteApi.registrarEvento(slug, {
    evento_tipo: eventoTipo,
    ...datos,
  });
}
