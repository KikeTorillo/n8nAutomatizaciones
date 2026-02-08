/**
 * ====================================================================
 * QUERY KEYS: Consigna
 * ====================================================================
 * Query keys para React Query cache de consignacion
 */

export const CONSIGNA_KEYS = {
  all: ['consigna'],
  // Acuerdos
  acuerdos: () => [...CONSIGNA_KEYS.all, 'acuerdos'],
  acuerdosList: (filtros) => [...CONSIGNA_KEYS.acuerdos(), { filtros }],
  acuerdoDetail: (id) => [...CONSIGNA_KEYS.acuerdos(), 'detail', id],
  acuerdoProductos: (acuerdoId) => [...CONSIGNA_KEYS.acuerdos(), acuerdoId, 'productos'],
  // Stock
  stock: () => [...CONSIGNA_KEYS.all, 'stock'],
  stockList: (filtros) => [...CONSIGNA_KEYS.stock(), { filtros }],
  // Liquidaciones
  liquidaciones: () => [...CONSIGNA_KEYS.all, 'liquidaciones'],
  liquidacionesList: (filtros) => [...CONSIGNA_KEYS.liquidaciones(), { filtros }],
  liquidacionDetail: (id) => [...CONSIGNA_KEYS.liquidaciones(), 'detail', id],
  // Reportes
  reportes: () => [...CONSIGNA_KEYS.all, 'reportes'],
  reporteStock: (filtros) => [...CONSIGNA_KEYS.reportes(), 'stock', { filtros }],
  reporteVentas: (filtros) => [...CONSIGNA_KEYS.reportes(), 'ventas', { filtros }],
  reportePendiente: () => [...CONSIGNA_KEYS.reportes(), 'pendiente'],
};
