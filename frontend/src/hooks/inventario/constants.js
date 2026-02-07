/**
 * Constantes para el modulo de Inventario
 *
 * Ene 2026 - Constantes de configuracion compartida
 *
 * NOTA: Las query keys fueron migradas a `@/hooks/config/queryKeys.js`
 * Usar: import { queryKeys } from '@/hooks/config';
 */

/**
 * Estados de Ordenes de Compra
 */
export const ESTADOS_ORDEN_COMPRA = {
  BORRADOR: 'borrador',
  ENVIADA: 'enviada',
  CONFIRMADA: 'confirmada',
  RECIBIDA_PARCIAL: 'recibida_parcial',
  RECIBIDA: 'recibida',
  CANCELADA: 'cancelada',
};

/**
 * Tipos de Movimientos
 */
export const TIPOS_MOVIMIENTO = {
  ENTRADA: 'entrada',
  SALIDA: 'salida',
  AJUSTE_POSITIVO: 'ajuste_positivo',
  AJUSTE_NEGATIVO: 'ajuste_negativo',
  TRANSFERENCIA_ENTRADA: 'transferencia_entrada',
  TRANSFERENCIA_SALIDA: 'transferencia_salida',
  VENTA: 'venta',
  DEVOLUCION: 'devolucion',
};

/**
 * Estados de Conteo
 */
export const ESTADOS_CONTEO = {
  BORRADOR: 'borrador',
  EN_PROGRESO: 'en_progreso',
  COMPLETADO: 'completado',
  APROBADO: 'aprobado',
  CANCELADO: 'cancelado',
};

/**
 * Tipos de Seguimiento
 */
export const TIPOS_SEGUIMIENTO = {
  NINGUNO: 'ninguno',
  LOTE: 'lote',
  SERIE: 'serie',
};
