/**
 * Hooks de POS (Punto de Venta)
 * Re-exports centralizados para el módulo de ventas
 */

// usePOS - exports selectivos para evitar conflictos con useVentas
// (solo hooks de caja y sesiones que son únicos)
export {
  useSesionCaja,
  useSesionCajaActiva,
  useSesionesCaja,
  useAbrirSesionCaja,
  useCerrarSesionCaja,
  useMovimientosCaja,
  useRegistrarMovimientoCaja,
  useResumenSesionCaja,
  usePagosVenta,
  useRegistrarPagosSplit,
  useProductosPOS,
  useCategoriasPOS,
} from './usePOS';

// useVentas - todos los hooks de ventas (prioridad sobre usePOS)
export * from './useVentas';

// Otros hooks de POS
export * from './usePOSCart';
export * from './useCupones';
export * from './usePromociones';
// export * from './useBarcodeScanner'; // TODO: archivo faltante
export * from './usePOSBroadcast';
export * from './useCombos';
export * from './useModificadores';
export * from './useAsignacionesModificadores';
export * from './useCombosModificadoresPOS';
export * from './useLealtad';
export { useTiposVenta, TIPO_VENTA, TIPOS_VENTA_KEYS } from './useTiposVenta';
