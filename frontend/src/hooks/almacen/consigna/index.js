/**
 * ====================================================================
 * BARREL: Consigna Hooks
 * ====================================================================
 * Re-exporta todos los hooks de consignacion
 */

// Query keys
export { CONSIGNA_KEYS } from './consignaKeys';

// Acuerdos
export {
  useAcuerdosConsigna,
  useAcuerdoConsigna,
  useProductosAcuerdo,
  useCrearAcuerdoConsigna,
  useActualizarAcuerdoConsigna,
  useActivarAcuerdoConsigna,
  usePausarAcuerdoConsigna,
  useTerminarAcuerdoConsigna,
  useAgregarProductoConsigna,
  useActualizarProductoConsigna,
  useRemoverProductoConsigna,
} from './useAcuerdosConsigna';

// Stock
export {
  useStockConsigna,
  useRecibirMercanciaConsigna,
  useAjustarStockConsigna,
  useDevolverMercanciaConsigna,
} from './useStockConsigna';

// Liquidaciones
export {
  useLiquidacionesConsigna,
  useLiquidacionConsigna,
  useGenerarLiquidacion,
  useConfirmarLiquidacion,
  usePagarLiquidacion,
  useCancelarLiquidacion,
} from './useLiquidacionesConsigna';

// Reportes
export {
  useReporteStockConsigna,
  useReporteVentasConsigna,
  usePendienteLiquidar,
} from './useReportesConsigna';
