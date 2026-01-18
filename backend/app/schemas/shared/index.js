/**
 * Schemas compartidos
 * Centraliza validaciones comunes para evitar duplicación
 *
 * @module schemas/shared
 *
 * @example
 * // Usar paginación y campos compartidos
 * const { withPagination, idParams, fields, toUpdateSchema } = require('../../schemas/shared');
 *
 * const crearSchema = Joi.object({
 *   nombre: fields.nombre.required(),
 *   descripcion: fields.descripcion,
 *   precio: fields.precio
 * });
 *
 * const actualizarSchema = toUpdateSchema(crearSchema);
 *
 * const miSchema = {
 *   params: idParams,
 *   query: withPagination({
 *     estado: estadoCita,
 *     busqueda: Joi.string().max(100)
 *   }),
 *   body: crearSchema
 * };
 */

const pagination = require('./pagination.schema');
const ids = require('./ids.schema');
const states = require('./states.schema');
const commonFields = require('./common-fields.schema');

module.exports = {
  // Paginación
  ...pagination,

  // IDs
  ...ids,

  // Estados
  ...states,

  // Campos comunes
  ...commonFields
};
