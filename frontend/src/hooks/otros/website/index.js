/**
 * ====================================================================
 * WEBSITE - BARREL EXPORTS
 * ====================================================================
 * Exportaciones centralizadas para el modulo website.
 *
 * ESTRUCTURA:
 * - constants.js: Query keys (WEBSITE_KEYS, ANALYTICS_KEYS)
 * - queries.js: Hooks de lectura (useWebsiteConfig, useWebsitePaginas, etc.)
 * - mutations.js: Hooks de escritura (useCrearBloque, useActualizarBloque, etc.)
 * - manager.js: Hook combinado (useWebsiteEditor)
 * - useWebsite.js: Hook original (mantiene compatibilidad)
 * - useWebsiteAnalytics.js: Hooks de analytics
 *
 * USO:
 * ```js
 * // Hook combinado (recomendado para la mayoria de casos)
 * import { useWebsiteEditor } from '@/hooks/otros/website';
 *
 * // Hooks individuales
 * import { useWebsiteConfig, useCrearBloque } from '@/hooks/otros/website';
 *
 * // Query keys (para invalidacion manual)
 * import { WEBSITE_KEYS, ANALYTICS_KEYS } from '@/hooks/otros/website';
 * ```
 *
 * @since 2026-01-29
 */

// Constantes
export { WEBSITE_KEYS, ANALYTICS_KEYS } from './constants';

// Queries
export {
  useWebsiteConfig,
  useVerificarSlug,
  useWebsitePaginas,
  useWebsitePagina,
  useWebsiteBloques,
  useTiposBloques,
  useDefaultBloque,
} from './queries';

// Mutations
export {
  useCrearWebsiteConfig,
  useActualizarWebsiteConfig,
  usePublicarWebsite,
  useEliminarWebsite,
  useCrearPagina,
  useActualizarPagina,
  useReordenarPaginas,
  useEliminarPagina,
  useCrearBloque,
  useActualizarBloque,
  useReordenarBloques,
  useDuplicarBloque,
  useEliminarBloque,
} from './mutations';

// Manager (hook combinado)
export { useWebsiteEditor } from './manager';

// Analytics
export {
  useWebsiteAnalyticsResumen,
  useWebsiteAnalyticsPaginas,
  useWebsiteAnalyticsEventos,
  useWebsiteAnalyticsTiempoReal,
  trackEvent,
} from './useWebsiteAnalytics';

// Backward compatibility - re-export desde archivo original
// Esto permite que imports existentes sigan funcionando
export * from './useWebsite';

// Default export: hook combinado
export { default } from './manager';
