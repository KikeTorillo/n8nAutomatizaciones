/**
 * @fileoverview Schemas de validación para Roles
 * @version 1.0.0
 * @date Enero 2026
 */

const Joi = require('joi');
const { commonSchemas } = require('../../../middleware/validation');
const { fields } = require('../../../schemas/shared');

/**
 * Schema para crear un rol
 */
const crear = {
  body: Joi.object({
    codigo: Joi.string()
      .min(2)
      .max(50)
      .pattern(/^[a-z][a-z0-9_]*$/)
      .required()
      .trim()
      .messages({
        'string.pattern.base': 'El código debe empezar con letra y contener solo letras minúsculas, números y guiones bajos'
      }),
    nombre: fields.nombre.required(),
    descripcion: fields.descripcion.optional(),
    nivel_jerarquia: Joi.number()
      .integer()
      .min(1)
      .max(89) // 90+ reservado para admin/propietario
      .default(10)
      .optional(),
    bypass_permisos: Joi.boolean()
      .default(false)
      .optional(),
    puede_crear_usuarios: Joi.boolean()
      .default(false)
      .optional(),
    puede_modificar_permisos: Joi.boolean()
      .default(false)
      .optional(),
    color: fields.colorHex.optional(),
    icono: fields.icono.optional(),
    activo: fields.activo.optional()
  })
};

/**
 * Schema para listar roles
 */
const listar = {
  query: Joi.object({
    incluir_sistema: Joi.string()
      .valid('true', 'false')
      .optional(),
    activo: Joi.string()
      .valid('true', 'false')
      .optional(),
    page: Joi.number()
      .integer()
      .min(1)
      .default(1),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(50),
    order_by: Joi.string()
      .valid('nombre', 'codigo', 'nivel_jerarquia', 'creado_en')
      .default('nivel_jerarquia'),
    order_direction: Joi.string()
      .valid('ASC', 'DESC')
      .default('DESC')
  })
};

/**
 * Schema para obtener un rol por ID
 */
const obtenerPorId = {
  params: Joi.object({
    id: commonSchemas.id
  })
};

/**
 * Schema para actualizar un rol
 */
const actualizar = {
  params: Joi.object({
    id: commonSchemas.id
  }),
  body: Joi.object({
    codigo: Joi.string()
      .min(2)
      .max(50)
      .pattern(/^[a-z][a-z0-9_]*$/)
      .trim()
      .optional()
      .messages({
        'string.pattern.base': 'El código debe empezar con letra y contener solo letras minúsculas, números y guiones bajos'
      }),
    nombre: fields.nombre.optional(),
    descripcion: fields.descripcion.optional().allow(null),
    nivel_jerarquia: Joi.number()
      .integer()
      .min(1)
      .max(89)
      .optional(),
    bypass_permisos: Joi.boolean().optional(),
    puede_crear_usuarios: Joi.boolean().optional(),
    puede_modificar_permisos: Joi.boolean().optional(),
    color: fields.colorHex.optional(),
    icono: fields.icono.optional(),
    activo: Joi.boolean().optional()
  })
};

/**
 * Schema para eliminar un rol
 */
const eliminar = {
  params: Joi.object({
    id: commonSchemas.id
  })
};

/**
 * Schema para copiar permisos entre roles
 */
const copiarPermisos = {
  params: Joi.object({
    id: commonSchemas.id
  }),
  body: Joi.object({
    rol_origen_id: commonSchemas.id
  })
};

/**
 * Schema para obtener permisos de un rol
 */
const obtenerPermisos = {
  params: Joi.object({
    id: commonSchemas.id
  })
};

/**
 * Schema para actualizar permiso de un rol
 */
const actualizarPermiso = {
  params: Joi.object({
    id: commonSchemas.id,
    permisoId: commonSchemas.id
  }),
  body: Joi.object({
    valor: Joi.alternatives()
      .try(
        Joi.boolean(),
        Joi.number(),
        Joi.string().max(500)
      )
      .required()
  })
};

/**
 * Schema para actualizar múltiples permisos de un rol
 */
const actualizarPermisosBatch = {
  params: Joi.object({
    id: commonSchemas.id
  }),
  body: Joi.object({
    permisos: Joi.array()
      .items(
        Joi.object({
          permiso_id: commonSchemas.id,
          valor: Joi.alternatives()
            .try(
              Joi.boolean(),
              Joi.number(),
              Joi.string().max(500)
            )
            .required()
        })
      )
      .min(1)
      .max(200)
      .required()
  })
};

module.exports = {
  crear,
  listar,
  obtenerPorId,
  actualizar,
  eliminar,
  copiarPermisos,
  obtenerPermisos,
  actualizarPermiso,
  actualizarPermisosBatch
};
