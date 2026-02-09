/**
 * Configuración centralizada para TanStack Query
 *
 * Ene 2026: Estandariza tiempos de cache y opciones de query
 * para mantener consistencia en todo el frontend.
 */

import type { QueryClient } from '@tanstack/react-query';

// Re-exportar STALE_TIMES para mantener compatibilidad con imports existentes
export { STALE_TIMES } from '@/app/queryClient';

// ========== Tipos ==========

interface QueryOptions {
  staleTime: number;
  refetchOnWindowFocus: boolean;
  refetchOnMount?: boolean;
  refetchInterval?: number;
  keepPreviousData?: boolean;
}

interface MutationOptions {
  onSuccess: () => void;
}

// ========== Constantes ==========

/**
 * Alias de compatibilidad (deprecated - usar STALE_TIMES)
 * @deprecated Usar STALE_TIMES desde @/app/queryClient
 */
export const CACHE_DURATIONS = {
  SHORT: 30 * 1000,
  MEDIUM: 5 * 60 * 1000,
  LONG: 10 * 60 * 1000,
  STATIC: 60 * 60 * 1000,
} as const;

/** Opciones por defecto para useQuery */
export const DEFAULT_QUERY_OPTIONS: QueryOptions = {
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
};

/** Opciones para datos estáticos (catálogos, configuración) */
export const STATIC_QUERY_OPTIONS: QueryOptions = {
  staleTime: 60 * 60 * 1000,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
};

/** Opciones para datos en tiempo real (notificaciones, estados) */
export const REALTIME_QUERY_OPTIONS: QueryOptions = {
  staleTime: 30 * 1000,
  refetchOnWindowFocus: true,
  refetchInterval: 30 * 1000,
};

/** Opciones para listas paginadas */
export const LIST_QUERY_OPTIONS: QueryOptions = {
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
  keepPreviousData: true,
};

/**
 * Opciones para mutaciones con invalidación automática
 */
export function createMutationOptions(queryClient: QueryClient, queryKeys: string[] = []): MutationOptions {
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
 *
 * @example
 * buildQueryKey('productos', { categoria: 1, buscar: '' })
 * // Retorna: ['productos', { categoria: 1 }]
 */
export function buildQueryKey(base: string, params: Record<string, unknown> = {}): unknown[] {
  const cleanParams: Record<string, unknown> = {};
  let hasParams = false;

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      cleanParams[key] = value;
      hasParams = true;
    }
  });

  return hasParams ? [base, cleanParams] : [base];
}
