/**
 * Schemas compartidos de IDs
 * Validaciones comunes para identificadores
 *
 * @module schemas/shared/ids
 */

const Joi = require('joi');

/**
 * ID positivo requerido (entero mayor a 0)
 */
const idRequired = Joi.number().integer().positive().required();

/**
 * ID positivo opcional
 */
const idOptional = Joi.number().integer().positive().optional();

/**
 * Array de IDs positivos
 */
const idsArray = Joi.array().items(Joi.number().integer().positive()).optional();

/**
 * Array de IDs requerido (mínimo 1)
 */
const idsArrayRequired = Joi.array().items(Joi.number().integer().positive()).min(1).required();

/**
 * UUID v4 requerido
 */
const uuidRequired = Joi.string().uuid({ version: 'uuidv4' }).required();

/**
 * UUID v4 opcional
 */
const uuidOptional = Joi.string().uuid({ version: 'uuidv4' }).optional();

/**
 * Schema para parámetros con ID
 * Uso: params: idParams
 */
const idParams = Joi.object({
  id: idRequired
});

/**
 * Schema para parámetros con múltiples IDs comunes
 */
const multiIdParams = {
  id: idRequired,
  organizacion_id: idOptional,
  sucursal_id: idOptional
};

module.exports = {
  idRequired,
  idOptional,
  idsArray,
  idsArrayRequired,
  uuidRequired,
  uuidOptional,
  idParams,
  multiIdParams
};
