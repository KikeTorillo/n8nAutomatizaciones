/**
 * Constantes centralizadas para estados, colores y formateo de entidades
 *
 * Este archivo centraliza todos los mapeos de estado → color/variant
 * que antes estaban duplicados en múltiples páginas.
 *
 * Uso:
 * import { ESTADO_VARIANTS, getEstadoVariant, formatearEstado } from '@/constants/entityStates';
 */

// =============================================================================
// VARIANTES DE BADGE POR TIPO DE ENTIDAD
// =============================================================================

/**
 * Variantes de Badge para Órdenes de Compra
 */
export const ESTADO_OC_VARIANTS = {
  borrador: 'default',
  enviada: 'primary',
  parcial: 'warning',
  recibida: 'success',
  cancelada: 'error',
};

/**
 * Variantes de Badge para Estado de Pago
 */
export const ESTADO_PAGO_VARIANTS = {
  pendiente: 'warning',
  parcial: 'warning',
  pagado: 'success',
};

/**
 * Variantes de Badge para Conteos de Inventario
 */
export const ESTADO_CONTEO_VARIANTS = {
  borrador: 'default',
  en_proceso: 'primary',
  completado: 'warning',
  ajustado: 'success',
  cancelado: 'error',
};

/**
 * Variantes de Badge para Productos
 */
export const ESTADO_PRODUCTO_VARIANTS = {
  activo: 'success',
  inactivo: 'error',
  descontinuado: 'warning',
};

/**
 * Variantes de Badge para Ventas POS
 */
export const ESTADO_VENTA_VARIANTS = {
  completada: 'success',
  pendiente: 'warning',
  cancelada: 'error',
  devuelta: 'default',
};

/**
 * Variantes de Badge para Promociones
 */
export const ESTADO_PROMOCION_VARIANTS = {
  activa: 'success',
  inactiva: 'default',
  programada: 'primary',
  expirada: 'error',
};

/**
 * Variantes de Badge para Cupones
 */
export const ESTADO_CUPON_VARIANTS = {
  activo: 'success',
  inactivo: 'default',
  expirado: 'error',
  agotado: 'warning',
};

/**
 * Variantes de Badge para Asientos Contables
 */
export const ESTADO_ASIENTO_VARIANTS = {
  borrador: 'default',
  publicado: 'success',
  anulado: 'error',
};

/**
 * Variantes de Badge para Eventos Digitales
 */
export const ESTADO_EVENTO_VARIANTS = {
  borrador: 'default',
  publicado: 'success',
  finalizado: 'primary',
  cancelado: 'error',
};

/**
 * Variantes de Badge para Citas
 */
export const ESTADO_CITA_VARIANTS = {
  pendiente: 'warning',
  confirmada: 'primary',
  completada: 'success',
  cancelada: 'error',
  no_show: 'error',
};

/**
 * Variantes de Badge para Dropship
 */
export const ESTADO_DROPSHIP_VARIANTS = {
  borrador: 'default',
  enviada: 'primary',
  en_transito: 'warning',
  entregada: 'success',
  cancelada: 'error',
};

/**
 * Variantes de Badge para Consigna
 */
export const ESTADO_CONSIGNA_VARIANTS = {
  activo: 'success',
  pendiente: 'warning',
  liquidado: 'primary',
  cancelado: 'error',
};

/**
 * Variantes de Badge genéricas (activo/inactivo)
 */
export const ESTADO_ACTIVO_VARIANTS = {
  activo: 'success',
  inactivo: 'error',
  true: 'success',
  false: 'error',
};

// =============================================================================
// MAPEO CONSOLIDADO DE TODAS LAS VARIANTES
// =============================================================================

export const ESTADO_VARIANTS = {
  orden_compra: ESTADO_OC_VARIANTS,
  pago: ESTADO_PAGO_VARIANTS,
  conteo: ESTADO_CONTEO_VARIANTS,
  producto: ESTADO_PRODUCTO_VARIANTS,
  venta: ESTADO_VENTA_VARIANTS,
  promocion: ESTADO_PROMOCION_VARIANTS,
  cupon: ESTADO_CUPON_VARIANTS,
  asiento: ESTADO_ASIENTO_VARIANTS,
  evento: ESTADO_EVENTO_VARIANTS,
  cita: ESTADO_CITA_VARIANTS,
  dropship: ESTADO_DROPSHIP_VARIANTS,
  consigna: ESTADO_CONSIGNA_VARIANTS,
  activo: ESTADO_ACTIVO_VARIANTS,
};

// =============================================================================
// LABELS DE ESTADOS (para mostrar en UI)
// =============================================================================

export const ESTADO_LABELS = {
  // Órdenes de Compra
  orden_compra: {
    borrador: 'Borrador',
    enviada: 'Enviada',
    parcial: 'Parcial',
    recibida: 'Recibida',
    cancelada: 'Cancelada',
  },
  // Pago
  pago: {
    pendiente: 'Pendiente',
    parcial: 'Parcial',
    pagado: 'Pagado',
  },
  // Conteos
  conteo: {
    borrador: 'Borrador',
    en_proceso: 'En Proceso',
    completado: 'Completado',
    ajustado: 'Ajustado',
    cancelado: 'Cancelado',
  },
  // Productos
  producto: {
    activo: 'Activo',
    inactivo: 'Inactivo',
    descontinuado: 'Descontinuado',
  },
  // Ventas
  venta: {
    completada: 'Completada',
    pendiente: 'Pendiente',
    cancelada: 'Cancelada',
    devuelta: 'Devuelta',
  },
  // Promociones
  promocion: {
    activa: 'Activa',
    inactiva: 'Inactiva',
    programada: 'Programada',
    expirada: 'Expirada',
  },
  // Cupones
  cupon: {
    activo: 'Activo',
    inactivo: 'Inactivo',
    expirado: 'Expirado',
    agotado: 'Agotado',
  },
  // Asientos
  asiento: {
    borrador: 'Borrador',
    publicado: 'Publicado',
    anulado: 'Anulado',
  },
  // Eventos
  evento: {
    borrador: 'Borrador',
    publicado: 'Publicado',
    finalizado: 'Finalizado',
    cancelado: 'Cancelado',
  },
  // Citas
  cita: {
    pendiente: 'Pendiente',
    confirmada: 'Confirmada',
    completada: 'Completada',
    cancelada: 'Cancelada',
    no_show: 'No Show',
  },
  // Dropship
  dropship: {
    borrador: 'Borrador',
    enviada: 'Enviada',
    en_transito: 'En Tránsito',
    entregada: 'Entregada',
    cancelada: 'Cancelada',
  },
  // Consigna
  consigna: {
    activo: 'Activo',
    pendiente: 'Pendiente',
    liquidado: 'Liquidado',
    cancelado: 'Cancelado',
  },
  // Genérico activo/inactivo
  activo: {
    activo: 'Activo',
    inactivo: 'Inactivo',
    true: 'Activo',
    false: 'Inactivo',
  },
};

// =============================================================================
// FUNCIONES HELPER
// =============================================================================

/**
 * Obtener la variante de Badge para un estado
 *
 * @param {string} entityType - Tipo de entidad (orden_compra, producto, etc.)
 * @param {string} estado - Estado actual
 * @returns {string} Variante del Badge (default, primary, success, warning, error)
 *
 * @example
 * getEstadoVariant('orden_compra', 'enviada') // 'primary'
 * getEstadoVariant('producto', 'activo') // 'success'
 */
export function getEstadoVariant(entityType, estado) {
  const variants = ESTADO_VARIANTS[entityType];
  if (!variants) return 'default';
  return variants[estado] || 'default';
}

/**
 * Obtener el label formateado para un estado
 *
 * @param {string} entityType - Tipo de entidad
 * @param {string} estado - Estado actual
 * @returns {string} Label formateado para mostrar
 *
 * @example
 * formatearEstado('orden_compra', 'en_proceso') // 'En Proceso'
 * formatearEstado('cita', 'no_show') // 'No Show'
 */
export function formatearEstado(entityType, estado) {
  const labels = ESTADO_LABELS[entityType];
  if (!labels) {
    // Fallback: capitalizar primera letra y reemplazar guiones bajos
    return estado
      ?.replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase()) || estado;
  }
  return labels[estado] || estado;
}

/**
 * Obtener variante de stock basado en niveles
 *
 * @param {Object} producto - Objeto del producto
 * @param {number} producto.stock_actual - Stock actual
 * @param {number} producto.stock_minimo - Stock mínimo
 * @param {number} producto.stock_maximo - Stock máximo (opcional)
 * @returns {string} Variante del Badge
 */
export function getStockVariant(producto) {
  const { stock_actual, stock_minimo, stock_maximo } = producto;

  if (stock_actual === 0) return 'error';
  if (stock_actual <= stock_minimo) return 'warning';
  if (stock_maximo && stock_actual >= stock_maximo) return 'primary';
  return 'success';
}

/**
 * Obtener opciones de filtro para un tipo de entidad
 *
 * @param {string} entityType - Tipo de entidad
 * @param {boolean} includeAll - Incluir opción "Todos" al inicio
 * @returns {Array<{value: string, label: string}>}
 *
 * @example
 * getEstadoOptions('orden_compra', true)
 * // [{ value: '', label: 'Todos' }, { value: 'borrador', label: 'Borrador' }, ...]
 */
export function getEstadoOptions(entityType, includeAll = true) {
  const labels = ESTADO_LABELS[entityType];
  if (!labels) return [];

  const options = Object.entries(labels).map(([value, label]) => ({
    value,
    label,
  }));

  if (includeAll) {
    return [{ value: '', label: 'Todos los estados' }, ...options];
  }

  return options;
}

// =============================================================================
// CLASES TAILWIND PARA ESTADOS (alternativa a Badge cuando se necesita más control)
// =============================================================================

/**
 * Clases de color para estados (uso directo en className)
 */
export const ESTADO_COLORS = {
  success: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400',
  warning: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-400',
  error: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-400',
  primary: 'bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-400',
  default: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
};

/**
 * Obtener clases de color para un estado
 *
 * @param {string} entityType - Tipo de entidad
 * @param {string} estado - Estado actual
 * @returns {string} Clases Tailwind
 */
export function getEstadoColorClasses(entityType, estado) {
  const variant = getEstadoVariant(entityType, estado);
  return ESTADO_COLORS[variant] || ESTADO_COLORS.default;
}
