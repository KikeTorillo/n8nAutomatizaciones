/**
 * @fileoverview Schemas de Validación - Motivos de Salida
 * @description Validaciones Joi para endpoints de motivos de terminación
 * @version 1.0.0
 * @date Enero 2026
 *
 * Catálogo dinámico de razones de terminación
 */

const Joi = require('joi');
const { commonSchemas } = require('../../../middleware/validation');
const { fields } = require('../../../schemas/shared');

/**
 * Schema para listar motivos de salida
 * GET /motivos-salida
 */
const listar = {
  query: Joi.object({
    solo_sistema: Joi.boolean().optional(),
    solo_personalizados: Joi.boolean().optional(),
    activos: Joi.boolean().optional()
  })
};

/**
 * Schema para obtener motivo por ID
 * GET /motivos-salida/:id
 */
const obtenerPorId = {
  params: Joi.object({
    id: commonSchemas.id
  })
};

/**
 * Schema para obtener motivo por código
 * GET /motivos-salida/codigo/:codigo
 */
const obtenerPorCodigo = {
  params: Joi.object({
    codigo: Joi.string().min(3).max(50).required()
  })
};

/**
 * Schema para crear motivo de salida
 * POST /motivos-salida
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
    requiere_documentacion: Joi.boolean().default(false),
    requiere_aprobacion: Joi.boolean().default(false),
    afecta_finiquito: Joi.boolean().default(true),
    color: fields.colorHex.default('#6B7280'),
    icono: Joi.string().max(50).default('log-out'),
    orden_display: Joi.number().integer().min(0).default(0),
    metadata: Joi.object().optional().allow(null)
  })
};

/**
 * Schema para actualizar motivo de salida
 * PUT /motivos-salida/:id
 */
const actualizar = {
  params: Joi.object({
    id: commonSchemas.id
  }),
  body: Joi.object({
    nombre: Joi.string().min(3).max(100),
    descripcion: Joi.string().max(500).allow(null, ''),
    requiere_documentacion: Joi.boolean(),
    requiere_aprobacion: Joi.boolean(),
    afecta_finiquito: Joi.boolean(),
    color: fields.colorHex,
    icono: Joi.string().max(50),
    orden_display: Joi.number().integer().min(0),
    metadata: Joi.object().allow(null),
    activo: Joi.boolean()
  }).min(1)
};

/**
 * Schema para eliminar motivo de salida
 * DELETE /motivos-salida/:id
 */
const eliminar = {
  params: Joi.object({
    id: commonSchemas.id
  })
};

module.exports = {
  listar,
  obtenerPorId,
  obtenerPorCodigo,
  crear,
  actualizar,
  eliminar
};
