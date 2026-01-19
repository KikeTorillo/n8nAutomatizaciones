/**
 * @fileoverview Schemas de Validación - Ubicaciones de Trabajo
 * @description Validaciones Joi para endpoints de ubicaciones
 * @version 1.0.0
 * @date Enero 2026
 *
 * GAP-003 vs Odoo 19: Soporte para trabajo híbrido
 */

const Joi = require('joi');
const { commonSchemas } = require('../../../middleware/validation');
const { fields } = require('../../../schemas/shared');

/**
 * Schema para listar ubicaciones de trabajo
 * GET /ubicaciones-trabajo
 */
const listar = {
  query: Joi.object({
    activas: Joi.boolean().optional(),
    es_remoto: Joi.boolean().optional(),
    es_oficina_principal: Joi.boolean().optional(),
    sucursal_id: Joi.number().integer().positive().optional()
  })
};

/**
 * Schema para obtener ubicación por ID
 * GET /ubicaciones-trabajo/:id
 */
const obtenerPorId = {
  params: Joi.object({
    id: commonSchemas.id
  })
};

/**
 * Schema para crear ubicación de trabajo
 * POST /ubicaciones-trabajo
 */
const crear = {
  body: Joi.object({
    codigo: Joi.string()
      .max(20)
      .optional()
      .allow(null, ''),
    nombre: Joi.string()
      .min(3)
      .max(100)
      .required()
      .messages({
        'any.required': 'nombre es requerido',
        'string.min': 'nombre debe tener al menos 3 caracteres'
      }),
    descripcion: Joi.string().max(500).optional().allow(null, ''),

    // Ubicación física
    direccion: Joi.string().max(500).optional().allow(null, ''),
    ciudad: Joi.string().max(100).optional().allow(null, ''),
    estado: Joi.string().max(100).optional().allow(null, ''),
    codigo_postal: Joi.string().max(10).optional().allow(null, ''),
    pais: Joi.string().max(100).default('México'),

    // Coordenadas
    latitud: Joi.number().min(-90).max(90).optional().allow(null),
    longitud: Joi.number().min(-180).max(180).optional().allow(null),

    // Tipo de ubicación
    es_remoto: Joi.boolean().default(false),
    es_cliente: Joi.boolean().default(false),
    es_oficina_principal: Joi.boolean().default(false),
    es_sucursal: Joi.boolean().default(false),
    sucursal_id: Joi.number().integer().positive().optional().allow(null),

    // Contacto
    telefono: Joi.string().max(20).optional().allow(null, ''),
    email: fields.email.optional().allow(null, ''),
    responsable: Joi.string().max(100).optional().allow(null, ''),

    // Horario
    horario_apertura: Joi.string()
      .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
      .optional()
      .allow(null, '')
      .messages({
        'string.pattern.base': 'horario_apertura debe tener formato HH:MM o HH:MM:SS'
      }),
    horario_cierre: Joi.string()
      .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
      .optional()
      .allow(null, '')
      .messages({
        'string.pattern.base': 'horario_cierre debe tener formato HH:MM o HH:MM:SS'
      }),
    dias_operacion: Joi.array()
      .items(Joi.string().valid('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'))
      .optional()
      .allow(null),

    // UI
    color: fields.colorHex.default('#753572'),
    icono: Joi.string().max(50).default('building-2'),
    orden: Joi.number().integer().min(0).default(0),
    metadata: Joi.object().optional().allow(null)
  })
};

/**
 * Schema para actualizar ubicación de trabajo
 * PUT /ubicaciones-trabajo/:id
 */
const actualizar = {
  params: Joi.object({
    id: commonSchemas.id
  }),
  body: Joi.object({
    codigo: Joi.string().max(20).allow(null, ''),
    nombre: Joi.string().min(3).max(100),
    descripcion: Joi.string().max(500).allow(null, ''),

    direccion: Joi.string().max(500).allow(null, ''),
    ciudad: Joi.string().max(100).allow(null, ''),
    estado: Joi.string().max(100).allow(null, ''),
    codigo_postal: Joi.string().max(10).allow(null, ''),
    pais: Joi.string().max(100),

    latitud: Joi.number().min(-90).max(90).allow(null),
    longitud: Joi.number().min(-180).max(180).allow(null),

    es_remoto: Joi.boolean(),
    es_cliente: Joi.boolean(),
    es_oficina_principal: Joi.boolean(),
    es_sucursal: Joi.boolean(),
    sucursal_id: Joi.number().integer().positive().allow(null),

    telefono: Joi.string().max(20).allow(null, ''),
    email: fields.email.allow(null, ''),
    responsable: Joi.string().max(100).allow(null, ''),

    horario_apertura: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).allow(null, ''),
    horario_cierre: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).allow(null, ''),
    dias_operacion: Joi.array().items(Joi.string().valid('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo')).allow(null),

    color: fields.colorHex,
    icono: Joi.string().max(50),
    orden: Joi.number().integer().min(0),
    metadata: Joi.object().allow(null),
    activo: Joi.boolean()
  }).min(1)
};

/**
 * Schema para eliminar ubicación de trabajo
 * DELETE /ubicaciones-trabajo/:id
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
