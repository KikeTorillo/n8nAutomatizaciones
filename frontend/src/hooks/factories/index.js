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

// Re-exportar sanitizeFields para facilitar migración gradual
export { sanitizeFields, COMMON_FIELDS } from '@/lib/sanitize';

export {
  useSucursalContext,
  createSucursalContextHook,
  createSucursalQueryOptions,
} from './createSucursalContextHook';

export { createSearchHook } from './createSearchHook';

// Nuevas factories (Ene 2026)
export { createStatsHook } from './createStatsHook';
export { createBulkOperationHook } from './createBulkOperationHook';
