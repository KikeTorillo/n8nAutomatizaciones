/**
 * Constantes para el módulo de Almacén (WMS)
 * Query keys y configuración compartida
 * Ene 2026 - Centralización de query keys
 */

/**
 * Query keys para React Query - Almacén
 */
export const ALMACEN_KEYS = {
  all: ['almacen'],

  // Operaciones de Almacén
  operaciones: {
    all: () => ['operaciones-almacen'],
    list: (params) => [...ALMACEN_KEYS.operaciones.all(), 'list', params],
    detail: (id) => ['operacion-almacen', id],
    pendientes: (tipo) => [...ALMACEN_KEYS.operaciones.all(), 'pendientes', tipo],
    porZona: (zonaId) => [...ALMACEN_KEYS.operaciones.all(), 'zona', zonaId],
  },

  // Batch Picking
  batchPicking: {
    all: () => ['batch-picking'],
    list: (params) => [...ALMACEN_KEYS.batchPicking.all(), 'list', params],
    detail: (id) => ['batch-picking', id],
    activo: () => [...ALMACEN_KEYS.batchPicking.all(), 'activo'],
    items: (batchId) => [...ALMACEN_KEYS.batchPicking.all(), batchId, 'items'],
  },

  // Reorden (Reabastecimiento)
  reorden: {
    all: () => ['reorden'],
    dashboard: () => ['reorden', 'dashboard'],
    productosBajoMinimo: (filtros) => ['reorden', 'productos-bajo-minimo', filtros],
    rutas: (filtros) => ['reorden', 'rutas', filtros],
    reglas: (filtros) => ['reorden', 'reglas', filtros],
    regla: (id) => ['reorden', 'regla', id],
    logs: (filtros) => ['reorden', 'logs', filtros],
    log: (id) => ['reorden', 'log', id],
    historicoStock: (productoId, dias) => ['inventario', 'historico-stock', productoId, dias],
  },

  // Dropship
  dropship: {
    all: () => ['dropship'],
    estadisticas: () => ['dropship', 'estadisticas'],
    configuracion: () => ['dropship', 'configuracion'],
    pendientes: () => ['dropship', 'pendientes'],
    ordenes: (filtros) => ['dropship', 'ordenes', filtros],
    orden: (id) => ['dropship', 'ordenes', id],
  },

  // Consigna
  consigna: {
    all: () => ['consigna'],
    acuerdos: (filtros) => ['consigna', 'acuerdos', filtros],
    acuerdo: (id) => ['consigna', 'acuerdo', id],
    inventario: (acuerdoId) => ['consigna', 'inventario', acuerdoId],
    movimientos: (acuerdoId) => ['consigna', 'movimientos', acuerdoId],
    liquidaciones: (acuerdoId) => ['consigna', 'liquidaciones', acuerdoId],
  },

  // Zonas de Almacén
  zonas: {
    all: () => ['zonas-almacen'],
    list: (params) => [...ALMACEN_KEYS.zonas.all(), 'list', params],
    detail: (id) => ['zona-almacen', id],
    bySucursal: (sucursalId) => [...ALMACEN_KEYS.zonas.all(), 'sucursal', sucursalId],
  },

  // Pasillos
  pasillos: {
    all: () => ['pasillos'],
    list: (params) => [...ALMACEN_KEYS.pasillos.all(), 'list', params],
    byZona: (zonaId) => [...ALMACEN_KEYS.pasillos.all(), 'zona', zonaId],
  },

  // Configuración
  configuracion: {
    all: () => ['configuracion-almacen'],
    general: () => ['configuracion-almacen', 'general'],
    tiposUbicacion: () => ['tipos-ubicacion'],
    estrategiasPicking: () => ['estrategias-picking'],
  },
};

/**
 * Estados de Operación de Almacén
 */
export const ESTADOS_OPERACION = {
  PENDIENTE: 'pendiente',
  EN_PROCESO: 'en_proceso',
  PAUSADA: 'pausada',
  COMPLETADA: 'completada',
  CANCELADA: 'cancelada',
};

/**
 * Tipos de Operación
 */
export const TIPOS_OPERACION = {
  RECEPCION: 'recepcion',
  PICKING: 'picking',
  EMPAQUE: 'empaque',
  DESPACHO: 'despacho',
  TRANSFERENCIA: 'transferencia',
  REUBICACION: 'reubicacion',
  CONTEO: 'conteo',
};

/**
 * Tipos de Zona
 */
export const TIPOS_ZONA = {
  ALMACENAMIENTO: 'almacenamiento',
  RECEPCION: 'recepcion',
  DESPACHO: 'despacho',
  PICKING: 'picking',
  CUARENTENA: 'cuarentena',
  DEVOLUCION: 'devolucion',
};

/**
 * Estados de Acuerdo de Consigna
 */
export const ESTADOS_CONSIGNA = {
  BORRADOR: 'borrador',
  ACTIVO: 'activo',
  PAUSADO: 'pausado',
  LIQUIDACION_PENDIENTE: 'liquidacion_pendiente',
  FINALIZADO: 'finalizado',
  CANCELADO: 'cancelado',
};

/**
 * Estados de Orden Dropship
 */
export const ESTADOS_DROPSHIP = {
  PENDIENTE: 'pendiente',
  ENVIADA_PROVEEDOR: 'enviada_proveedor',
  CONFIRMADA: 'confirmada',
  EN_TRANSITO: 'en_transito',
  ENTREGADA: 'entregada',
  CANCELADA: 'cancelada',
};
