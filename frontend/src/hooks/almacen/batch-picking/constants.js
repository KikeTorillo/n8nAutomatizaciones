/**
 * Constantes: Batch Picking (Wave Picking)
 * Query keys y estados para batch picking
 */

/**
 * QUERY KEYS para batch picking
 */
export const BATCH_PICKING_KEYS = {
  all: ['batch-picking'],
  list: (params) => [...BATCH_PICKING_KEYS.all, 'list', params],
  detail: (id) => [...BATCH_PICKING_KEYS.all, 'detail', id],
  listaConsolidada: (id) => [...BATCH_PICKING_KEYS.all, 'lista-consolidada', id],
  estadisticas: (id) => [...BATCH_PICKING_KEYS.all, 'estadisticas', id],
  pendientes: (sucursalId) => [...BATCH_PICKING_KEYS.all, 'pendientes', sucursalId],
  operacionesDisponibles: (sucursalId) => [...BATCH_PICKING_KEYS.all, 'operaciones-disponibles', sucursalId],
};

// ==================== ESTADOS BATCH ====================

export const ESTADOS_BATCH = {
  BORRADOR: 'borrador',
  CONFIRMADO: 'confirmado',
  EN_PROCESO: 'en_proceso',
  COMPLETADO: 'completado',
  CANCELADO: 'cancelado',
};

export const LABELS_ESTADO_BATCH = {
  [ESTADOS_BATCH.BORRADOR]: 'Borrador',
  [ESTADOS_BATCH.CONFIRMADO]: 'Confirmado',
  [ESTADOS_BATCH.EN_PROCESO]: 'En Proceso',
  [ESTADOS_BATCH.COMPLETADO]: 'Completado',
  [ESTADOS_BATCH.CANCELADO]: 'Cancelado',
};

export const COLORES_ESTADO_BATCH = {
  [ESTADOS_BATCH.BORRADOR]: 'gray',
  [ESTADOS_BATCH.CONFIRMADO]: 'blue',
  [ESTADOS_BATCH.EN_PROCESO]: 'yellow',
  [ESTADOS_BATCH.COMPLETADO]: 'green',
  [ESTADOS_BATCH.CANCELADO]: 'red',
};
