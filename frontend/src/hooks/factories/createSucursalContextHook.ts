/**
 * ====================================================================
 * FACTORY: Context de Sucursal para Hooks
 * ====================================================================
 *
 * Helpers para hooks que necesitan contexto de sucursal del store.
 * Reduce código repetitivo en hooks de almacén y otros módulos.
 *
 * Ene 2026 - Auditoría Frontend
 * Feb 2026 - Migración TypeScript
 * ====================================================================
 */

import useSucursalStore, { selectGetSucursalId } from '@/store/sucursalStore';

/**
 * Hook para obtener ID de sucursal con fallback al store
 *
 * Resuelve el ID de sucursal en este orden:
 * 1. Si se proporciona sucursalId, usarlo
 * 2. Si no, obtener del store (sucursal activa)
 */
export function useSucursalContext(
  sucursalId?: number | string | null
): number | null {
  const getSucursalId = useSucursalStore(selectGetSucursalId);
  return (sucursalId as number) || getSucursalId();
}

/**
 * Factory para crear hooks que usan contexto de sucursal
 *
 * Envuelve un hook para que automáticamente resuelva el sucursalId
 * del store cuando no se proporciona explícitamente.
 *
 * @example
 * export const useConfiguracion = createSucursalContextHook((sucursalId) =>
 *   useQuery({ queryKey: ['config', sucursalId], ... })
 * );
 */
export function createSucursalContextHook<
  TReturn,
  TArgs extends unknown[] = [],
>(
  hookFn: (sucursalId: number | null, ...args: TArgs) => TReturn
): (sucursalIdParam?: number | string | null, ...args: TArgs) => TReturn {
  return function useSucursalHook(
    sucursalIdParam?: number | string | null,
    ...args: TArgs
  ): TReturn {
    const sucursalId = useSucursalContext(sucursalIdParam);
    return hookFn(sucursalId, ...args);
  };
}

/**
 * Factory para crear query options con contexto de sucursal
 *
 * @example
 * const getConfigOptions = createSucursalQueryOptions((sucursalId) => ({
 *   queryKey: ['config', sucursalId],
 *   queryFn: () => api.getConfig(sucursalId),
 *   enabled: !!sucursalId,
 * }));
 */
export function createSucursalQueryOptions<
  TOptions,
  TArgs extends unknown[] = [],
>(
  createOptions: (sucursalId: number | null, ...args: TArgs) => TOptions
): (sucursalIdParam?: number | string | null, ...args: TArgs) => TOptions {
  return function getOptions(
    sucursalIdParam?: number | string | null,
    ...args: TArgs
  ): TOptions {
    const sucursalId =
      (sucursalIdParam as number) ||
      useSucursalStore.getState().getSucursalId() ||
      null;
    return createOptions(sucursalId, ...args);
  };
}

export default {
  useSucursalContext,
  createSucursalContextHook,
  createSucursalQueryOptions,
};
