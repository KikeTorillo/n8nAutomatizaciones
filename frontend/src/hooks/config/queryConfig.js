/**
 * Configuración centralizada para TanStack Query
 *
 * Ene 2026: Estandariza tiempos de cache y opciones de query
 * para mantener consistencia en todo el frontend.
 *
 * NOTA: Los tiempos de cache (STALE_TIMES) están definidos en @/app/queryClient
 */

// Re-exportar STALE_TIMES para mantener compatibilidad con imports existentes
export { STALE_TIMES } from '@/app/queryClient';

/**
 * Alias de compatibilidad (deprecated - usar STALE_TIMES)
 * @deprecated Usar STALE_TIMES desde @/app/queryClient
 */
export const CACHE_DURATIONS = {
  SHORT: 30 * 1000,           // 30 segundos -> STALE_TIMES.REAL_TIME
  MEDIUM: 5 * 60 * 1000,      // 5 minutos -> STALE_TIMES.SEMI_STATIC
  LONG: 10 * 60 * 1000,       // 10 minutos -> STALE_TIMES.STATIC_DATA
  STATIC: 60 * 60 * 1000,     // 1 hora (no usado frecuentemente)
};

/**
 * Opciones por defecto para useQuery
 * Aplicar en queries que no necesiten configuración especial
 */
export const DEFAULT_QUERY_OPTIONS = {
  staleTime: 5 * 60 * 1000, // STALE_TIMES.SEMI_STATIC
  refetchOnWindowFocus: false,
};

/**
 * Opciones para datos estáticos (catálogos, configuración)
 */
export const STATIC_QUERY_OPTIONS = {
  staleTime: 60 * 60 * 1000,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
};

/**
 * Opciones para datos en tiempo real (notificaciones, estados)
 */
export const REALTIME_QUERY_OPTIONS = {
  staleTime: 30 * 1000, // STALE_TIMES.REAL_TIME
  refetchOnWindowFocus: true,
  refetchInterval: 30 * 1000, // Polling cada 30 seg
};

/**
 * Opciones para listas paginadas
 */
export const LIST_QUERY_OPTIONS = {
  staleTime: 5 * 60 * 1000, // STALE_TIMES.SEMI_STATIC
  refetchOnWindowFocus: false,
  keepPreviousData: true, // Mantener datos anteriores mientras carga
};

/**
 * Opciones para mutaciones con invalidación automática
 * @param {QueryClient} queryClient - Cliente de React Query
 * @param {string[]} queryKeys - Keys a invalidar tras mutación
 * @returns {Object} Opciones para useMutation
 */
export function createMutationOptions(queryClient, queryKeys = []) {
  return {
    onSuccess: () => {
      queryKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key], refetchType: 'active' });
      });
    },
  };
}

/**
 * Genera queryKey con parámetros opcionales
 * Filtra valores undefined/null para evitar cache inconsistente
 * @param {string} base - Key base
 * @param {Object} params - Parámetros opcionales
 * @returns {Array} Query key filtrada
 *
 * @example
 * buildQueryKey('productos', { categoria: 1, buscar: '' })
 * // Retorna: ['productos', { categoria: 1 }] (buscar filtrado por vacío)
 */
export function buildQueryKey(base, params = {}) {
  const cleanParams = {};
  let hasParams = false;

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      cleanParams[key] = value;
      hasParams = true;
    }
  });

  return hasParams ? [base, cleanParams] : [base];
}
