/**
 * ====================================================================
 * FACTORY: createSearchHook
 * ====================================================================
 *
 * Factory para crear hooks de búsqueda estandarizados.
 * Reduce código repetitivo (~15 líneas → ~3 líneas por hook).
 *
 * Ene 2026 - Refactorización Frontend
 * Feb 2026 - Migración TypeScript
 * ====================================================================
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SearchApiFn = (...args: any[]) => Promise<any>;

export interface SearchHookConfig<TItem = unknown> {
  /** Query key base (ej: 'clientes') */
  key: string;
  /** Función API de búsqueda */
  searchFn: SearchApiFn;
  /** Nombre del parámetro de búsqueda (default: 'q') */
  searchParam?: string;
  /** Key para extraer datos de response */
  responseKey?: string;
  /** Longitud mínima para buscar (default: 2) */
  minLength?: number;
  /** Tiempo de cache */
  staleTime?: number;
  /** Función para transformar la respuesta */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transformResponse?: (data: any) => TItem[];
}

export interface SearchHookOptions {
  enabled?: boolean;
  [key: string]: unknown;
}

/**
 * Factory para crear hooks de búsqueda estandarizados
 *
 * @example
 * export const useBuscarClientes = createSearchHook<Cliente>({
 *   key: 'clientes',
 *   searchFn: clientesApi.buscar,
 * });
 */
export function createSearchHook<TItem = unknown>(
  config: SearchHookConfig<TItem>,
): (termino: string, options?: SearchHookOptions) => UseQueryResult<TItem[]> {
  const {
    key,
    searchFn,
    searchParam = 'q',
    responseKey,
    minLength = 2,
    staleTime = STALE_TIMES.DYNAMIC,
    transformResponse,
  } = config;

  return function useSearch(termino: string, options: SearchHookOptions = {}): UseQueryResult<TItem[]> {
    const { enabled: externalEnabled = true, ...queryOptions } = options;

    return useQuery({
      queryKey: [key, 'buscar', termino, queryOptions],
      queryFn: async () => {
        const params = { [searchParam]: termino, ...queryOptions };
        const response = await searchFn(params);

        const data = response.data?.data;

        if (transformResponse) {
          return transformResponse(data);
        }

        if (responseKey) {
          return (data?.[responseKey as keyof typeof data] ?? data) as TItem[];
        }

        return data as TItem[];
      },
      enabled:
        externalEnabled &&
        typeof termino === 'string' &&
        termino.length >= minLength,
      staleTime,
      placeholderData: (prev: TItem[] | undefined) => prev,
    });
  };
}

export default createSearchHook;
