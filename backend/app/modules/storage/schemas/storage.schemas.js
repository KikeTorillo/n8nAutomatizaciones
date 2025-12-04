/**
 * Schemas de validación para Storage
 *
 * @module modules/storage/schemas/storage.schemas
 */

const Joi = require('joi');

/**
 * Schema para upload de archivo
 * Los campos van en el body como form-data
 */
const uploadSchema = {
  body: Joi.object({
    folder: Joi.string()
      .max(100)
      .pattern(/^[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*$/)
      .default('general')
      .messages({
        'string.pattern.base': 'La carpeta solo puede contener letras, números, guiones, guiones bajos y barras para subcarpetas'
      }),
    isPublic: Joi.alternatives()
      .try(Joi.boolean(), Joi.string().valid('true', 'false'))
      .default('true'),
    generateThumbnail: Joi.alternatives()
      .try(Joi.boolean(), Joi.string().valid('true', 'false'))
      .default('false'),
    entidadTipo: Joi.string()
      .max(50)
      .allow(null, '')
      .optional(),
    entidadId: Joi.alternatives()
      .try(Joi.number().integer().positive(), Joi.string().pattern(/^\d+$/))
      .allow(null, '')
      .optional()
  })
};

/**
 * Schema para obtener archivo por ID
 */
const getByIdSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required()
      .messages({
        'number.base': 'El ID debe ser un número',
        'number.positive': 'El ID debe ser positivo'
      })
  })
};

/**
 * Schema para listar archivos
 */
const listSchema = {
  query: Joi.object({
    entidadTipo: Joi.string().max(50).optional(),
    entidadId: Joi.number().integer().positive().optional(),
    limit: Joi.number().integer().min(1).max(100).default(50),
    offset: Joi.number().integer().min(0).default(0)
  })
};

/**
 * Schema para presigned URL
 */
const presignedSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required()
  }),
  query: Joi.object({
    expiry: Joi.number().integer().min(60).max(604800).default(3600)
      .messages({
        'number.min': 'La expiración mínima es 60 segundos',
        'number.max': 'La expiración máxima es 7 días (604800 segundos)'
      })
  })
};

/**
 * Schema para eliminar archivo
 */
const deleteSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required()
  })
};

module.exports = {
  uploadSchema,
  getByIdSchema,
  listSchema,
  presignedSchema,
  deleteSchema
};
