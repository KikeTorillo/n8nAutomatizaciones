/**
 * ====================================================================
 * FACTORY: Context de Sucursal para Hooks
 * ====================================================================
 *
 * Helpers para hooks que necesitan contexto de sucursal del store.
 * Reduce código repetitivo en hooks de almacén y otros módulos.
 *
 * Ene 2026 - Auditoría Frontend
 *
 * @example
 * // Uso básico - Hook individual
 * export function useConfiguracion(sucursalId) {
 *   const efectiveSucursalId = useSucursalContext(sucursalId);
 *   return useQuery({
 *     queryKey: ['config', efectiveSucursalId],
 *     enabled: !!efectiveSucursalId,
 *   });
 * }
 *
 * @example
 * // Factory para crear hook con contexto de sucursal
 * const useConfiguracion = createSucursalContextHook((sucursalId) =>
 *   useQuery({
 *     queryKey: ['config', sucursalId],
 *     enabled: !!sucursalId,
 *   })
 * );
 * ====================================================================
 */

import useSucursalStore, { selectGetSucursalId } from '@/store/sucursalStore';

/**
 * Hook para obtener ID de sucursal con fallback al store
 *
 * Resuelve el ID de sucursal en este orden:
 * 1. Si se proporciona sucursalId, usarlo
 * 2. Si no, obtener del store (sucursal activa)
 *
 * @param {number|string} [sucursalId] - ID de sucursal opcional
 * @returns {number|null} ID de sucursal efectivo
 */
export function useSucursalContext(sucursalId) {
  const getSucursalId = useSucursalStore(selectGetSucursalId);
  return sucursalId || getSucursalId();
}

/**
 * Factory para crear hooks que usan contexto de sucursal
 *
 * Envuelve un hook para que automáticamente resuelva el sucursalId
 * del store cuando no se proporciona explícitamente.
 *
 * @param {Function} hookFn - Función que recibe sucursalId y retorna el hook result
 * @returns {Function} Hook envuelto con resolución de sucursal
 *
 * @example
 * // Antes (duplicación en cada hook):
 * export function useConfiguracion(sucursalId) {
 *   const getSucursalId = useSucursalStore(selectGetSucursalId);
 *   const efectiveSucursalId = sucursalId || getSucursalId();
 *   return useQuery({ queryKey: ['config', efectiveSucursalId], ... });
 * }
 *
 * // Después:
 * export const useConfiguracion = createSucursalContextHook((sucursalId) =>
 *   useQuery({ queryKey: ['config', sucursalId], ... })
 * );
 */
export function createSucursalContextHook(hookFn) {
  return function useSucursalHook(sucursalIdParam, ...args) {
    const sucursalId = useSucursalContext(sucursalIdParam);
    return hookFn(sucursalId, ...args);
  };
}

/**
 * Factory para crear query options con contexto de sucursal
 *
 * Útil cuando se necesita pasar options a useQuery pero con
 * sucursalId resuelto automáticamente.
 *
 * @param {Function} createOptions - Función que recibe sucursalId y retorna query options
 * @returns {Function} Función que retorna options con sucursalId resuelto
 *
 * @example
 * const getConfigOptions = createSucursalQueryOptions((sucursalId) => ({
 *   queryKey: ['config', sucursalId],
 *   queryFn: () => api.getConfig(sucursalId),
 *   enabled: !!sucursalId,
 * }));
 *
 * // En componente:
 * const options = getConfigOptions(sucursalIdOpcional);
 * const { data } = useQuery(options);
 */
export function createSucursalQueryOptions(createOptions) {
  return function getOptions(sucursalIdParam, ...args) {
    const getSucursalId = useSucursalStore.getState().sucursalActiva?.id;
    const sucursalId = sucursalIdParam || getSucursalId;
    return createOptions(sucursalId, ...args);
  };
}

export default {
  useSucursalContext,
  createSucursalContextHook,
  createSucursalQueryOptions,
};
