/**
 * Módulo del Carrito POS
 * Ene 2026: Descomposición de usePOSCart (514 líneas → 4 archivos)
 *
 * Estructura:
 * - usePOSCart.js: Orquestador principal (API pública)
 * - usePOSCartState.js: Estado puro del carrito
 * - usePOSCartCalculations.js: Cálculos derivados (useMemos)
 * - usePOSCartHandlers.js: Handlers de manipulación
 *
 * Uso externo:
 * ```js
 * import { usePOSCart } from '@/hooks/pos/cart';
 * // o
 * import { usePOSCart } from '@/hooks/pos';
 * ```
 */

export { usePOSCart, default } from './usePOSCart';
export { usePOSCartState } from './usePOSCartState';
export { usePOSCartCalculations } from './usePOSCartCalculations';
export { usePOSCartHandlers } from './usePOSCartHandlers';
