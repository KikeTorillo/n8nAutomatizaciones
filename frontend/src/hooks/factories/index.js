/**
 * ====================================================================
 * FACTORIES DE HOOKS
 * ====================================================================
 *
 * Exporta factories para generar hooks reutilizables.
 *
 * Ene 2026 - Refactorización Frontend
 * ====================================================================
 */

export {
  createCRUDHooks,
  createSanitizer,
  createInvalidator,
  default,
} from './createCRUDHooks';

export {
  useSucursalContext,
  createSucursalContextHook,
  createSucursalQueryOptions,
} from './createSucursalContextHook';

export { createSearchHook } from './createSearchHook';

// Nuevas factories (Ene 2026)
export { createStatsHook } from './createStatsHook';
export { createBulkOperationHook } from './createBulkOperationHook';
