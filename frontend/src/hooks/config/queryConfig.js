/**
 * Configuración centralizada para TanStack Query
 *
 * Ene 2026: Estandariza tiempos de cache y opciones de query
 * para mantener consistencia en todo el frontend.
 */

/**
 * Duraciones de cache predefinidas
 * Usar según el tipo de datos:
 * - SHORT: Datos que cambian frecuentemente (notificaciones, estados en tiempo real)
 * - MEDIUM: Datos normales (listas, detalles) - DEFAULT
 * - LONG: Datos que cambian poco (configuraciones, catálogos)
 * - STATIC: Datos casi inmutables (países, monedas)
 */
export const CACHE_DURATIONS = {
  SHORT: 30 * 1000,           // 30 segundos
  MEDIUM: 5 * 60 * 1000,      // 5 minutos (default)
  LONG: 10 * 60 * 1000,       // 10 minutos
  STATIC: 60 * 60 * 1000,     // 1 hora
};

/**
 * Opciones por defecto para useQuery
 * Aplicar en queries que no necesiten configuración especial
 */
export const DEFAULT_QUERY_OPTIONS = {
  staleTime: CACHE_DURATIONS.MEDIUM,
  refetchOnWindowFocus: false,
};

/**
 * Opciones para datos estáticos (catálogos, configuración)
 */
export const STATIC_QUERY_OPTIONS = {
  staleTime: CACHE_DURATIONS.STATIC,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
};

/**
 * Opciones para datos en tiempo real (notificaciones, estados)
 */
export const REALTIME_QUERY_OPTIONS = {
  staleTime: CACHE_DURATIONS.SHORT,
  refetchOnWindowFocus: true,
  refetchInterval: 30 * 1000, // Polling cada 30 seg
};

/**
 * Opciones para listas paginadas
 */
export const LIST_QUERY_OPTIONS = {
  staleTime: CACHE_DURATIONS.MEDIUM,
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
        queryClient.invalidateQueries({ queryKey: [key] });
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
