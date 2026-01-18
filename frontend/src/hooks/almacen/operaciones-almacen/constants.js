/**
 * ====================================================================
 * CONSTANTES: Operaciones de Almacén
 * ====================================================================
 * Tipos, estados y labels para operaciones multi-paso
 * Ene 2026 - Fragmentación de hooks
 */

/**
 * Query Keys para operaciones de almacén
 */
export const OPERACIONES_ALMACEN_KEYS = {
  all: ['operaciones-almacen'],
  list: (params) => [...OPERACIONES_ALMACEN_KEYS.all, 'list', params],
  detail: (id) => [...OPERACIONES_ALMACEN_KEYS.all, 'detail', id],
  cadena: (id) => [...OPERACIONES_ALMACEN_KEYS.all, 'cadena', id],
  pendientes: (sucursalId) => [...OPERACIONES_ALMACEN_KEYS.all, 'pendientes', sucursalId],
  estadisticas: (sucursalId) => [...OPERACIONES_ALMACEN_KEYS.all, 'estadisticas', sucursalId],
  kanban: (sucursalId) => [...OPERACIONES_ALMACEN_KEYS.all, 'kanban', sucursalId],
};

/**
 * Tipos de operación de almacén
 */
export const TIPOS_OPERACION = {
  RECEPCION: 'recepcion',
  CONTROL_CALIDAD: 'control_calidad',
  ALMACENAMIENTO: 'almacenamiento',
  PICKING: 'picking',
  EMPAQUE: 'empaque',
  ENVIO: 'envio',
  TRANSFERENCIA_INTERNA: 'transferencia_interna',
};

/**
 * Estados de operación
 */
export const ESTADOS_OPERACION = {
  BORRADOR: 'borrador',
  ASIGNADA: 'asignada',
  EN_PROCESO: 'en_proceso',
  PARCIAL: 'parcial',
  COMPLETADA: 'completada',
  CANCELADA: 'cancelada',
};

/**
 * Labels para tipos de operación
 */
export const LABELS_TIPO_OPERACION = {
  [TIPOS_OPERACION.RECEPCION]: 'Recepción',
  [TIPOS_OPERACION.CONTROL_CALIDAD]: 'Control de Calidad',
  [TIPOS_OPERACION.ALMACENAMIENTO]: 'Almacenamiento',
  [TIPOS_OPERACION.PICKING]: 'Picking',
  [TIPOS_OPERACION.EMPAQUE]: 'Empaque',
  [TIPOS_OPERACION.ENVIO]: 'Envío',
  [TIPOS_OPERACION.TRANSFERENCIA_INTERNA]: 'Transferencia Interna',
};

/**
 * Labels para estados de operación
 */
export const LABELS_ESTADO_OPERACION = {
  [ESTADOS_OPERACION.BORRADOR]: 'Borrador',
  [ESTADOS_OPERACION.ASIGNADA]: 'Asignada',
  [ESTADOS_OPERACION.EN_PROCESO]: 'En Proceso',
  [ESTADOS_OPERACION.PARCIAL]: 'Parcial',
  [ESTADOS_OPERACION.COMPLETADA]: 'Completada',
  [ESTADOS_OPERACION.CANCELADA]: 'Cancelada',
};

/**
 * Colores para badges de estado
 */
export const COLORES_ESTADO_OPERACION = {
  [ESTADOS_OPERACION.BORRADOR]: 'gray',
  [ESTADOS_OPERACION.ASIGNADA]: 'blue',
  [ESTADOS_OPERACION.EN_PROCESO]: 'yellow',
  [ESTADOS_OPERACION.PARCIAL]: 'orange',
  [ESTADOS_OPERACION.COMPLETADA]: 'green',
  [ESTADOS_OPERACION.CANCELADA]: 'red',
};
