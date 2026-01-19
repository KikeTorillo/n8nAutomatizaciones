/**
 * Constantes para el módulo de POS (Punto de Venta)
 * Query keys y configuración compartida
 * Ene 2026 - Centralización de query keys
 */

/**
 * Query keys para React Query - POS
 */
export const POS_KEYS = {
  all: ['pos'],

  // Ventas
  ventas: {
    all: () => ['ventas'],
    list: (params, sucursalId) => [...POS_KEYS.ventas.all(), 'list', params, sucursalId],
    detail: (id) => ['venta', id],
    porDia: (fecha, sucursalId) => ['ventas', 'dia', fecha, sucursalId],
    resumen: (params) => ['ventas', 'resumen', params],
  },

  // Sesiones de Caja
  sesiones: {
    all: () => ['sesiones-caja'],
    list: (params) => [...POS_KEYS.sesiones.all(), 'list', params],
    detail: (id) => ['sesion-caja', id],
    activa: (sucursalId) => ['sesion-caja-activa', sucursalId],
    arqueo: (sesionId) => ['sesion-arqueo', sesionId],
  },

  // Cupones
  cupones: {
    all: () => ['cupones'],
    list: (params, sucursalId) => [...POS_KEYS.cupones.all(), 'list', params, sucursalId],
    detail: (id) => ['cupon', id],
    vigentes: () => ['cupones-vigentes'],
    historial: (cuponId, params, sucursalId) => ['cupon-historial', cuponId, params, sucursalId],
    estadisticas: (cuponId, sucursalId) => ['cupon-estadisticas', cuponId, sucursalId],
    validar: (codigo) => ['validar-cupon', codigo],
  },

  // Promociones
  promociones: {
    all: () => ['promociones'],
    list: (params) => [...POS_KEYS.promociones.all(), 'list', params],
    detail: (id) => ['promocion', id],
    vigentes: (params) => ['promociones-vigentes', params],
    evaluar: (items, subtotal, clienteId, sucursalId) => [
      'promociones-evaluar',
      { items, subtotal, clienteId, sucursalId },
    ],
    historial: (promocionId, params) => ['promocion-historial', promocionId, params],
    estadisticas: (promocionId) => ['promocion-estadisticas', promocionId],
  },

  // Lealtad
  lealtad: {
    all: () => ['lealtad'],
    configuracion: () => ['lealtad-configuracion'],
    niveles: (options) => ['lealtad-niveles', options],
    puntos: (clienteId) => ['lealtad-puntos', clienteId],
    historial: (clienteId, params) => ['lealtad-historial', clienteId, params],
    clientes: (params) => ['lealtad-clientes', params],
    estadisticas: (sucursalId) => ['lealtad-estadisticas', sucursalId],
  },

  // Métodos de Pago
  metodosPago: {
    all: () => ['metodos-pago'],
    list: (params) => [...POS_KEYS.metodosPago.all(), 'list', params],
    activos: () => ['metodos-pago-activos'],
  },

  // Reportes
  reportes: {
    all: () => ['reportes-pos'],
    ventasDiarias: (params) => ['reporte-ventas-diarias', params],
    ventasProducto: (params) => ['reporte-ventas-producto', params],
    cierresCaja: (params) => ['reporte-cierres-caja', params],
    comisiones: (params) => ['reporte-comisiones', params],
  },

  // Devoluciones
  devoluciones: {
    all: () => ['devoluciones'],
    list: (params) => [...POS_KEYS.devoluciones.all(), 'list', params],
    detail: (id) => ['devolucion', id],
  },

  // Cotizaciones
  cotizaciones: {
    all: () => ['cotizaciones'],
    list: (params) => [...POS_KEYS.cotizaciones.all(), 'list', params],
    detail: (id) => ['cotizacion', id],
  },
};

/**
 * Estados de Venta
 */
export const ESTADOS_VENTA = {
  PENDIENTE: 'pendiente',
  PAGADA: 'pagada',
  PARCIAL: 'parcial',
  CANCELADA: 'cancelada',
  DEVUELTA: 'devuelta',
  DEVUELTA_PARCIAL: 'devuelta_parcial',
};

/**
 * Estados de Sesión de Caja
 */
export const ESTADOS_SESION_CAJA = {
  ABIERTA: 'abierta',
  CERRADA: 'cerrada',
  ARQUEO_PENDIENTE: 'arqueo_pendiente',
};

/**
 * Tipos de Descuento
 */
export const TIPOS_DESCUENTO = {
  PORCENTAJE: 'porcentaje',
  MONTO_FIJO: 'monto_fijo',
  PRECIO_ESPECIAL: 'precio_especial',
};

/**
 * Tipos de Promoción
 */
export const TIPOS_PROMOCION = {
  DESCUENTO_GENERAL: 'descuento_general',
  DESCUENTO_PRODUCTO: 'descuento_producto',
  DESCUENTO_CATEGORIA: 'descuento_categoria',
  NxM: 'nxm',
  COMBO: 'combo',
  ENVIO_GRATIS: 'envio_gratis',
};

/**
 * Estados de Cupón
 */
export const ESTADOS_CUPON = {
  ACTIVO: 'activo',
  INACTIVO: 'inactivo',
  AGOTADO: 'agotado',
  EXPIRADO: 'expirado',
};
