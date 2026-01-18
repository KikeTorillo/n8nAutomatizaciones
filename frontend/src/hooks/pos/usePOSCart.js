/**
 * Re-export de usePOSCart desde el módulo cart/
 *
 * Ene 2026: usePOSCart fue refactorizado de 514 líneas a 4 archivos:
 * - cart/usePOSCart.js: Orquestador (~80 líneas)
 * - cart/usePOSCartState.js: Estado puro (~50 líneas)
 * - cart/usePOSCartCalculations.js: Cálculos derivados (~70 líneas)
 * - cart/usePOSCartHandlers.js: Handlers (~280 líneas)
 *
 * Este archivo mantiene compatibilidad con imports existentes:
 * - import { usePOSCart } from '@/hooks/pos/usePOSCart'
 * - import { usePOSCart } from '@/hooks/pos'
 */

export { usePOSCart, default } from './cart';
