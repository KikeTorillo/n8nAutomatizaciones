/**
 * Schemas compartidos de paginación
 * Centraliza los campos de paginación para evitar duplicación en 100+ schemas
 *
 * @module schemas/shared/pagination
 */

const Joi = require('joi');

/**
 * Schema base de paginación
 * Campos estándar que se repiten en todos los endpoints de listado
 */
const paginationSchema = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).optional(),
  order_by: Joi.string().optional(),
  order_direction: Joi.string().valid('ASC', 'DESC').default('DESC')
};

/**
 * Crea un schema de query con paginación incluida
 * @param {Object} customFields - Campos específicos del endpoint
 * @returns {Joi.ObjectSchema} Schema Joi con paginación + campos custom
 *
 * @example
 * // En un archivo de schemas:
 * const { withPagination } = require('../../schemas/shared');
 *
 * const listar = {
 *   query: withPagination({
 *     estado: Joi.string().valid('activo', 'inactivo'),
 *     busqueda: Joi.string().max(100)
 *   })
 * };
 */
const withPagination = (customFields = {}) => Joi.object({
  ...paginationSchema,
  ...customFields
});

/**
 * Schema de paginación simple (sin campos custom)
 * Para endpoints que solo necesitan paginación básica
 */
const paginationOnly = Joi.object(paginationSchema);

module.exports = {
  paginationSchema,
  withPagination,
  paginationOnly
};
