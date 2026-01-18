/**
 * usePOS.js - Re-exports de hooks de Punto de Venta
 *
 * Este archivo fue modularizado en Enero 2026.
 * Los hooks están organizados en archivos separados por funcionalidad.
 *
 * Archivos modulares:
 * - useVentas.js - CRUD de ventas, items, devoluciones, reportes
 * - usePagosVenta.js - Pagos simples, split y desglose
 * - useSesionesCaja.js - Apertura, cierre y movimientos de caja
 * - useCategoriasPOS.js - Grid visual de categorías y productos
 */

// ==================== VENTAS POS ====================
export {
  useVentas,
  useVenta,
  useCrearVenta,
  useActualizarVenta,
  useActualizarEstadoVenta,
  useCancelarVenta,
  useDevolverItems,
  useAgregarItems,
  useEliminarVenta,
  // Reportes (consolidados en useVentas.js)
  useCorteCaja,
  useVentasDiarias,
} from './useVentas';

// ==================== PAGOS ====================
export {
  useRegistrarPago,
  useRegistrarPagosSplit,
  usePagosVenta,
} from './usePagosVenta';

// ==================== SESIONES DE CAJA ====================
export {
  useSesionCajaActiva,
  useSesionCaja,
  useResumenSesionCaja,
  useSesionesCaja,
  useMovimientosCaja,
  useAbrirSesionCaja,
  useCerrarSesionCaja,
  useRegistrarMovimientoCaja,
} from './useSesionesCaja';

// ==================== GRID VISUAL ====================
export {
  useCategoriasPOS,
  useProductosPOS,
} from './useCategoriasPOS';
