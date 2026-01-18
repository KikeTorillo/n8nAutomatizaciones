/**
 * useInventario.js - Re-exports de hooks de inventario
 *
 * Este archivo fue modularizado en Enero 2026.
 * Los hooks están organizados en archivos separados por funcionalidad.
 *
 * Archivos modulares:
 * - useMovimientos.js - Movimientos de inventario y kardex
 * - useAlertas.js - Alertas y dashboard de alertas
 * - useReportesInventario.js - Reportes y análisis ABC
 * - useReservasStock.js - Reservas de stock para ventas
 * - useAutoOC.js - Auto-generación de órdenes de compra
 * - useRutasOperacion.js - Rutas de operación WMS
 * - useReglasReabastecimiento.js - Reglas de reabastecimiento automático
 * - useTransferenciasInventario.js - Transferencias entre sucursales
 */

// ==================== MOVIMIENTOS DE INVENTARIO ====================
export {
  useMovimientos,
  useKardex,
  useEstadisticasMovimientos,
  useRegistrarMovimiento,
} from './useMovimientos';

// ==================== ALERTAS DE INVENTARIO ====================
export {
  useAlertas,
  useDashboardAlertas,
  useAlerta,
  useMarcarAlertaLeida,
  useMarcarVariasAlertasLeidas,
} from './useAlertas';

// ==================== REPORTES DE INVENTARIO ====================
export {
  useValorInventario,
  useAnalisisABC,
  useRotacionInventario,
  useResumenAlertas,
} from './useReportesInventario';

// ==================== RESERVAS DE STOCK ====================
export {
  useStockDisponible,
  useStockDisponibleMultiple,
  useVerificarDisponibilidad,
  useCrearReserva,
  useCrearReservasMultiple,
  useConfirmarReserva,
  useConfirmarReservasMultiple,
  useCancelarReserva,
  useReservas,
} from './useReservasStock';

// ==================== AUTO-GENERACIÓN DE OC ====================
export {
  useSugerenciasOC,
  useGenerarOCDesdeProducto,
  useAutoGenerarOCs,
} from './useAutoOC';

// ==================== RUTAS DE OPERACIÓN ====================
export {
  useRutasOperacion,
  useRutaOperacion,
  useInicializarRutas,
  useCrearRuta,
  useActualizarRuta,
  useEliminarRuta,
  useRutasProducto,
  useAsignarRutaProducto,
  useQuitarRutaProducto,
} from './useRutasOperacion';

// ==================== REGLAS DE REABASTECIMIENTO ====================
export {
  useReglasReabastecimiento,
  useCrearReglaReabastecimiento,
  useActualizarReglaReabastecimiento,
  useEliminarReglaReabastecimiento,
} from './useReglasReabastecimiento';

// ==================== TRANSFERENCIAS ENTRE SUCURSALES ====================
export {
  useTransferenciasInventario,
  useTransferenciaInventario,
  useCrearTransferencia,
  useAprobarTransferencia,
  useRechazarTransferencia,
  useEnviarTransferencia,
  useRecibirTransferencia,
} from './useTransferenciasInventario';
