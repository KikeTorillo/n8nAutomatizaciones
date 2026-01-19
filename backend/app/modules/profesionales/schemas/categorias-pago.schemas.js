/**
 * @fileoverview Schemas de Validación - Categorías de Pago
 * @description Validaciones Joi para endpoints de categorías de nómina
 * @version 1.0.0
 * @date Enero 2026
 *
 * GAP-004 vs Odoo 19: Clasificación de empleados para nómina
 */

const Joi = require('joi');
const { commonSchemas } = require('../../../middleware/validation');
const { fields } = require('../../../schemas/shared');

/**
 * Schema para listar categorías de pago
 * GET /categorias-pago
 */
const listar = {
  query: Joi.object({
    activas: Joi.boolean().optional(),
    ordenar_por: Joi.string().valid('nombre', 'nivel').optional()
  })
};

/**
 * Schema para obtener categoría por ID
 * GET /categorias-pago/:id
 */
const obtenerPorId = {
  params: Joi.object({
    id: commonSchemas.id
  })
};

/**
 * Schema para crear categoría de pago
 * POST /categorias-pago
 */
const crear = {
  body: Joi.object({
    codigo: Joi.string()
      .max(20)
      .pattern(/^[A-Z0-9_]+$/)
      .optional()
      .allow(null, '')
      .messages({
        'string.pattern.base': 'codigo debe contener solo mayúsculas, números y guiones bajos'
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
    nivel_salarial: Joi.number().integer().min(1).max(10).default(1),

    // Configuración de compensación
    permite_comisiones: Joi.boolean().default(true),
    permite_bonos: Joi.boolean().default(false),
    permite_viaticos: Joi.boolean().default(false),
    permite_horas_extra: Joi.boolean().default(true),
    exento_impuestos: Joi.boolean().default(false),

    // Rangos salariales
    salario_minimo: Joi.number().precision(2).min(0).optional().allow(null),
    salario_maximo: Joi.number().precision(2).min(0).optional().allow(null),
    moneda: Joi.string().length(3).default('MXN'),

    // Beneficios
    dias_vacaciones_extra: Joi.number().integer().min(0).default(0),
    porcentaje_aguinaldo: Joi.number().precision(2).min(0).max(100).default(15.0),
    fondo_ahorro: Joi.number().precision(2).min(0).max(100).default(0),

    // UI
    color: fields.colorHex.default('#753572'),
    icono: Joi.string().max(50).default('wallet'),
    orden: Joi.number().integer().min(0).default(0),
    metadata: Joi.object().optional().allow(null)
  }).custom((value, helpers) => {
    // Validar que salario_minimo <= salario_maximo
    if (value.salario_minimo && value.salario_maximo && value.salario_minimo > value.salario_maximo) {
      return helpers.error('any.custom', { message: 'salario_minimo no puede ser mayor que salario_maximo' });
    }
    return value;
  })
};

/**
 * Schema para actualizar categoría de pago
 * PUT /categorias-pago/:id
 */
const actualizar = {
  params: Joi.object({
    id: commonSchemas.id
  }),
  body: Joi.object({
    codigo: Joi.string().max(20).pattern(/^[A-Z0-9_]+$/).allow(null, ''),
    nombre: Joi.string().min(3).max(100),
    descripcion: Joi.string().max(500).allow(null, ''),
    nivel_salarial: Joi.number().integer().min(1).max(10),

    permite_comisiones: Joi.boolean(),
    permite_bonos: Joi.boolean(),
    permite_viaticos: Joi.boolean(),
    permite_horas_extra: Joi.boolean(),
    exento_impuestos: Joi.boolean(),

    salario_minimo: Joi.number().precision(2).min(0).allow(null),
    salario_maximo: Joi.number().precision(2).min(0).allow(null),
    moneda: Joi.string().length(3),

    dias_vacaciones_extra: Joi.number().integer().min(0),
    porcentaje_aguinaldo: Joi.number().precision(2).min(0).max(100),
    fondo_ahorro: Joi.number().precision(2).min(0).max(100),

    color: fields.colorHex,
    icono: Joi.string().max(50),
    orden: Joi.number().integer().min(0),
    metadata: Joi.object().allow(null),
    activo: Joi.boolean()
  }).min(1)
};

/**
 * Schema para eliminar categoría de pago
 * DELETE /categorias-pago/:id
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
