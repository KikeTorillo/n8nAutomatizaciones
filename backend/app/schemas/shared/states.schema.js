/**
 * Schemas compartidos de estados
 * Validaciones para estados, flags booleanos y enums comunes
 *
 * @module schemas/shared/states
 */

const Joi = require('joi');

/**
 * Estado activo/inactivo
 */
const estadoActivoInactivo = Joi.string().valid('activo', 'inactivo').optional();

/**
 * Flag booleano para filtro de activos
 */
const activoFilter = Joi.boolean().optional();

/**
 * Flag booleano como string ('true'/'false') para query params
 */
const booleanString = Joi.string().valid('true', 'false').optional();

/**
 * Estados de citas
 */
const estadoCita = Joi.string().valid('pendiente', 'confirmada', 'completada', 'cancelada', 'no_show');

/**
 * Estados de orden de compra
 */
const estadoOrdenCompra = Joi.string().valid('borrador', 'enviada', 'parcial', 'recibida', 'cancelada');

/**
 * Estados de venta POS
 */
const estadoVenta = Joi.string().valid('pendiente', 'pagada', 'parcial', 'cancelada', 'reembolsada');

/**
 * Estados de solicitud de vacaciones
 */
const estadoSolicitudVacaciones = Joi.string().valid('pendiente', 'aprobada', 'rechazada', 'cancelada');

/**
 * Estados de workflow
 */
const estadoWorkflow = Joi.string().valid('pendiente', 'en_progreso', 'aprobado', 'rechazado', 'cancelado');

/**
 * Prioridades (alta, media, baja)
 */
const prioridad = Joi.string().valid('alta', 'media', 'baja').optional();

module.exports = {
  estadoActivoInactivo,
  activoFilter,
  booleanString,
  estadoCita,
  estadoOrdenCompra,
  estadoVenta,
  estadoSolicitudVacaciones,
  estadoWorkflow,
  prioridad
};
