/**
 * @fileoverview Schemas de validación para Usuarios Ubicaciones
 * @version 1.0.0
 * @date Enero 2026
 */

const Joi = require('joi');
const { commonSchemas } = require('../../../middleware/validation');

/**
 * Schema para listar ubicaciones de un usuario
 * GET /usuarios/:id/ubicaciones
 */
const listarUbicaciones = {
  params: Joi.object({
    id: commonSchemas.id
  })
};

/**
 * Schema para asignar ubicación a usuario
 * POST /usuarios/:id/ubicaciones
 */
const asignarUbicacion = {
  params: Joi.object({
    id: commonSchemas.id
  }),
  body: Joi.object({
    ubicacion_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'El ID de ubicación debe ser un número',
        'number.positive': 'El ID de ubicación debe ser positivo',
        'any.required': 'El ID de ubicación es obligatorio'
      }),
    es_default: Joi.boolean()
      .default(false)
      .messages({
        'boolean.base': 'es_default debe ser verdadero o falso'
      }),
    puede_recibir: Joi.boolean()
      .default(true)
      .messages({
        'boolean.base': 'puede_recibir debe ser verdadero o falso'
      }),
    puede_despachar: Joi.boolean()
      .default(true)
      .messages({
        'boolean.base': 'puede_despachar debe ser verdadero o falso'
      })
  })
};

/**
 * Schema para actualizar asignación de ubicación
 * PATCH /usuarios/:id/ubicaciones/:ubicacionId
 */
const actualizarAsignacion = {
  params: Joi.object({
    id: commonSchemas.id,
    ubicacionId: commonSchemas.id
  }),
  body: Joi.object({
    es_default: Joi.boolean()
      .messages({
        'boolean.base': 'es_default debe ser verdadero o falso'
      }),
    puede_recibir: Joi.boolean()
      .messages({
        'boolean.base': 'puede_recibir debe ser verdadero o falso'
      }),
    puede_despachar: Joi.boolean()
      .messages({
        'boolean.base': 'puede_despachar debe ser verdadero o falso'
      })
  }).min(1).messages({
    'object.min': 'Debe proporcionar al menos un campo para actualizar'
  })
};

/**
 * Schema para desasignar ubicación de usuario
 * DELETE /usuarios/:id/ubicaciones/:ubicacionId
 */
const desasignarUbicacion = {
  params: Joi.object({
    id: commonSchemas.id,
    ubicacionId: commonSchemas.id
  })
};

/**
 * Schema para obtener ubicaciones disponibles para asignar
 * GET /usuarios/:id/ubicaciones-disponibles
 */
const ubicacionesDisponibles = {
  params: Joi.object({
    id: commonSchemas.id
  })
};

module.exports = {
  listarUbicaciones,
  asignarUbicacion,
  actualizarAsignacion,
  desasignarUbicacion,
  ubicacionesDisponibles
};
