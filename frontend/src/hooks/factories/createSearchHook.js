/**
 * ====================================================================
 * FACTORY: createSearchHook
 * ====================================================================
 *
 * Factory para crear hooks de búsqueda estandarizados.
 * Reduce código repetitivo (~15 líneas → ~3 líneas por hook).
 *
 * Ene 2026 - Refactorización Frontend
 * ====================================================================
 */

import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';

/**
 * Factory para crear hooks de búsqueda estandarizados
 *
 * @param {Object} config - Configuración del hook
 * @param {string} config.key - Query key base (ej: 'clientes')
 * @param {Function} config.searchFn - Función API de búsqueda
 * @param {string} [config.searchParam='q'] - Nombre del parámetro de búsqueda
 * @param {string} [config.responseKey] - Key para extraer datos de response
 * @param {number} [config.minLength=2] - Longitud mínima para buscar
 * @param {number} [config.staleTime] - Tiempo de cache (default: DYNAMIC)
 * @param {Function} [config.transformResponse] - Función para transformar la respuesta
 *
 * @returns {Function} Hook de búsqueda configurado
 *
 * @example
 * // Uso básico
 * export const useBuscarClientes = createSearchHook({
 *   key: 'clientes',
 *   searchFn: clientesApi.buscar,
 * });
 *
 * @example
 * // Con responseKey anidado
 * export const useBuscarProductos = createSearchHook({
 *   key: 'productos',
 *   searchFn: inventarioApi.buscarProductos,
 *   responseKey: 'productos',
 * });
 *
 * @example
 * // Con transformación custom
 * export const useBuscarProfesionales = createSearchHook({
 *   key: 'profesionales',
 *   searchFn: profesionalesApi.listar,
 *   searchParam: 'busqueda',
 *   transformResponse: (data) => data?.profesionales || [],
 * });
 */
export function createSearchHook(config) {
  const {
    key,
    searchFn,
    searchParam = 'q',
    responseKey,
    minLength = 2,
    staleTime = STALE_TIMES.DYNAMIC,
    transformResponse,
  } = config;

  /**
   * Hook de búsqueda generado
   * @param {string} termino - Término de búsqueda
   * @param {Object} [options={}] - Opciones adicionales para la query
   * @returns {Object} Query result de TanStack Query
   */
  return function useSearch(termino, options = {}) {
    const { enabled: externalEnabled = true, ...queryOptions } = options;

    return useQuery({
      queryKey: [key, 'buscar', termino, queryOptions],
      queryFn: async () => {
        const params = { [searchParam]: termino, ...queryOptions };
        const response = await searchFn(params);

        // Extraer datos de la respuesta
        const data = response.data?.data;

        // Aplicar transformación si existe
        if (transformResponse) {
          return transformResponse(data);
        }

        // Usar responseKey si está definido
        if (responseKey) {
          return data?.[responseKey] ?? data;
        }

        return data;
      },
      enabled:
        externalEnabled &&
        typeof termino === 'string' &&
        termino.length >= minLength,
      staleTime,
      placeholderData: (prev) => prev,
    });
  };
}

export default createSearchHook;
