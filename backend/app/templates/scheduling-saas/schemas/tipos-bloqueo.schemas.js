const Joi = require('joi');
const { commonSchemas } = require('../../../middleware/validation');

/**
 * Schema para listar tipos de bloqueo
 * GET /tipos-bloqueo
 */
const listar = {
  query: Joi.object({
    solo_sistema: Joi.boolean().optional(),
    solo_personalizados: Joi.boolean().optional()
  })
};

/**
 * Schema para obtener tipo por ID
 * GET /tipos-bloqueo/:id
 */
const obtenerPorId = {
  params: Joi.object({
    id: commonSchemas.id
  })
};

/**
 * Schema para crear tipo de bloqueo
 * POST /tipos-bloqueo
 */
const crear = {
  body: Joi.object({
    codigo: Joi.string()
      .min(3)
      .max(50)
      .pattern(/^[a-z0-9_]+$/)
      .required()
      .messages({
        'string.pattern.base': 'codigo debe contener solo minúsculas, números y guiones bajos',
        'any.required': 'codigo es requerido'
      }),
    nombre: Joi.string()
      .min(3)
      .max(100)
      .required()
      .messages({
        'any.required': 'nombre es requerido',
        'string.min': 'nombre debe tener al menos 3 caracteres'
      }),
    descripcion: Joi.string().max(500).optional().allow(null, ''),
    permite_todo_el_dia: Joi.boolean().default(true),
    permite_horario_especifico: Joi.boolean().default(true),
    requiere_aprobacion: Joi.boolean().default(false),
    orden_display: Joi.number().integer().min(0).default(0),
    metadata: Joi.object().optional().allow(null)
  })
};

/**
 * Schema para actualizar tipo de bloqueo
 * PUT /tipos-bloqueo/:id
 */
const actualizar = {
  params: Joi.object({
    id: commonSchemas.id
  }),
  body: Joi.object({
    nombre: Joi.string().min(3).max(100),
    descripcion: Joi.string().max(500).allow(null, ''),
    permite_todo_el_dia: Joi.boolean(),
    permite_horario_especifico: Joi.boolean(),
    requiere_aprobacion: Joi.boolean(),
    orden_display: Joi.number().integer().min(0),
    metadata: Joi.object().allow(null)
  }).min(1)
};

/**
 * Schema para eliminar tipo de bloqueo
 * DELETE /tipos-bloqueo/:id
 */
const eliminar = {
  params: Joi.object({
    id: commonSchemas.id
  })
};

module.exports = {
  listar,
  obtenerPorId,
  crear,
  actualizar,
  eliminar
};
