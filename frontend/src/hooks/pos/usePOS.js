/**
 * usePOS.js - Re-exports de hooks de Punto de Venta
 *
 * Este archivo fue modularizado en Enero 2026.
 * Los hooks están organizados en archivos separados por funcionalidad.
 *
 * Archivos modulares:
 * - useVentasPOS.js - CRUD de ventas, items, devoluciones
 * - usePagosVenta.js - Pagos simples, split y desglose
 * - useCorteCaja.js - Reportes de corte y ventas diarias
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
} from './useVentasPOS';

// ==================== PAGOS ====================
export {
  useRegistrarPago,
  useRegistrarPagosSplit,
  usePagosVenta,
} from './usePagosVenta';

// ==================== REPORTES ====================
export {
  useCorteCaja,
  useVentasDiarias,
} from './useCorteCaja';

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
