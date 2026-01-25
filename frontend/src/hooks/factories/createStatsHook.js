/**
 * ====================================================================
 * FACTORY PARA HOOKS DE ESTADÍSTICAS
 * ====================================================================
 *
 * Genera hooks estandarizados para obtener estadísticas.
 *
 * Ene 2026 - Mejoras Frontend
 *
 * @example
 * // Estadísticas globales (sin parámetro)
 * export const useEstadisticasClientes = createStatsHook({
 *   key: queryKeys.personas.clientes.estadisticas,
 *   queryFn: () => clientesApi.obtenerEstadisticas(),
 * });
 *
 * @example
 * // Estadísticas por ID
 * export const useEstadisticasCliente = createStatsHook({
 *   key: (id) => queryKeys.personas.clientes.estadisticasDetalle(id),
 *   queryFn: (id) => clientesApi.obtenerEstadisticasCliente(id),
 *   requiredParam: true,
 * });
 *
 * @example
 * // Con transformación de respuesta
 * export const useResumenVentas = createStatsHook({
 *   key: (params) => ['resumen-ventas', params],
 *   queryFn: (params) => ventasApi.obtenerResumen(params),
 *   transformResponse: (data) => ({
 *     ...data,
 *     totalFormateado: formatCurrency(data.total),
 *   }),
 * });
 * ====================================================================
 */

import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';

/**
 * Factory para crear hooks de estadísticas estandarizados
 *
 * @param {Object} config - Configuración del hook
 * @param {Array|Function} config.key - Query key (array) o función que retorna query key
 * @param {Function} config.queryFn - Función que hace la petición API
 * @param {boolean} [config.requiredParam=false] - Si el parámetro es requerido para ejecutar
 * @param {number} [config.staleTime] - Tiempo de cache (default: SEMI_STATIC)
 * @param {number} [config.gcTime] - Tiempo de garbage collection
 * @param {Function} [config.transformResponse] - Función para transformar la respuesta
 * @param {boolean} [config.refetchOnWindowFocus=false] - Refetch al enfocar ventana
 *
 * @returns {Function} Hook de estadísticas
 */
export function createStatsHook(config) {
  const {
    key,
    queryFn,
    requiredParam = false,
    staleTime = STALE_TIMES.SEMI_STATIC,
    gcTime,
    transformResponse,
    refetchOnWindowFocus = false,
  } = config;

  /**
   * Hook de estadísticas generado
   *
   * @param {*} param - Parámetro para la query (id, filtros, etc.)
   * @param {Object} options - Opciones adicionales de useQuery
   * @returns {Object} Resultado de useQuery
   */
  return function useStats(param, options = {}) {
    // Determinar query key
    const queryKey = typeof key === 'function' ? key(param) : key;

    // Determinar si está habilitado
    const enabled = requiredParam ? param != null : true;

    return useQuery({
      queryKey,
      queryFn: async () => {
        const response = await queryFn(param);
        const data = response.data?.data ?? response.data ?? response;

        if (transformResponse) {
          return transformResponse(data);
        }

        return data;
      },
      enabled: enabled && (options.enabled !== false),
      staleTime,
      gcTime,
      refetchOnWindowFocus,
      ...options,
    });
  };
}

export default createStatsHook;
