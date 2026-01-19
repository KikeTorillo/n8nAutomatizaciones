/**
 * Schemas de validación para Custom Fields
 *
 * @module modules/custom-fields/schemas/custom-fields.schemas
 */

const Joi = require('joi');
const { fields } = require('../../../schemas/shared');

// Tipos de datos soportados
const TIPOS_DATO = [
  'texto',
  'texto_largo',
  'numero',
  'fecha',
  'hora',
  'booleano',
  'select',
  'multiselect',
  'email',
  'telefono',
  'url',
  'archivo'
];

// Tipos de entidad soportados
const ENTIDAD_TIPOS = [
  'cliente',
  'profesional',
  'servicio',
  'producto',
  'cita',
  'evento_digital',
  'invitado_evento'
];

/**
 * Schema para crear definición de campo
 */
const createDefinicionSchema = {
  body: Joi.object({
    nombre: Joi.string()
      .min(1)
      .max(100)
      .required()
      .messages({
        'string.empty': 'El nombre es requerido',
        'string.max': 'El nombre no puede exceder 100 caracteres'
      }),
    nombre_clave: Joi.string()
      .max(50)
      .pattern(/^[a-z][a-z0-9_]*$/)
      .allow(null, '')
      .optional()
      .messages({
        'string.pattern.base': 'El nombre clave debe iniciar con letra y solo contener letras minúsculas, números y guiones bajos'
      }),
    descripcion: Joi.string()
      .max(500)
      .allow(null, '')
      .optional(),
    entidad_tipo: Joi.string()
      .valid(...ENTIDAD_TIPOS)
      .required()
      .messages({
        'any.only': `El tipo de entidad debe ser uno de: ${ENTIDAD_TIPOS.join(', ')}`
      }),
    tipo_dato: Joi.string()
      .valid(...TIPOS_DATO)
      .required()
      .messages({
        'any.only': `El tipo de dato debe ser uno de: ${TIPOS_DATO.join(', ')}`
      }),
    opciones: Joi.when('tipo_dato', {
      is: Joi.valid('select', 'multiselect'),
      then: Joi.array()
        .items(Joi.object({
          value: Joi.string().required(),
          label: Joi.string().required(),
          color: fields.colorHex.optional()
        }))
        .min(1)
        .required()
        .messages({
          'array.min': 'Debe proporcionar al menos una opción para campos select/multiselect'
        }),
      otherwise: Joi.any().strip()
    }),
    valor_defecto: Joi.any().optional(),
    requerido: Joi.boolean().default(false),
    placeholder: Joi.string().max(200).allow(null, '').optional(),
    tooltip: Joi.string().max(500).allow(null, '').optional(),
    seccion: Joi.string().max(100).allow(null, '').optional(),
    orden: Joi.number().integer().min(0).default(0),
    ancho_columnas: Joi.number().integer().min(1).max(12).default(12),
    icono: Joi.string().max(50).allow(null, '').optional(),
    visible_en_formulario: Joi.boolean().default(true),
    visible_en_listado: Joi.boolean().default(false),
    buscable: Joi.boolean().default(false),
    longitud_minima: Joi.when('tipo_dato', {
      is: Joi.valid('texto', 'texto_largo'),
      then: Joi.number().integer().min(0).optional(),
      otherwise: Joi.any().strip()
    }),
    longitud_maxima: Joi.when('tipo_dato', {
      is: Joi.valid('texto', 'texto_largo'),
      then: Joi.number().integer().min(1).optional(),
      otherwise: Joi.any().strip()
    }),
    valor_minimo: Joi.when('tipo_dato', {
      is: 'numero',
      then: Joi.number().optional(),
      otherwise: Joi.any().strip()
    }),
    valor_maximo: Joi.when('tipo_dato', {
      is: 'numero',
      then: Joi.number().optional(),
      otherwise: Joi.any().strip()
    }),
    patron_regex: Joi.string().max(500).allow(null, '').optional(),
    mensaje_error: Joi.string().max(200).allow(null, '').optional()
  })
};

/**
 * Schema para actualizar definición de campo
 */
const updateDefinicionSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required()
  }),
  body: Joi.object({
    nombre: Joi.string().min(1).max(100).optional(),
    descripcion: Joi.string().max(500).allow(null, '').optional(),
    opciones: Joi.array()
      .items(Joi.object({
        value: Joi.string().required(),
        label: Joi.string().required(),
        color: fields.colorHex.optional()
      }))
      .optional(),
    valor_defecto: Joi.any().optional(),
    requerido: Joi.boolean().optional(),
    placeholder: Joi.string().max(200).allow(null, '').optional(),
    tooltip: Joi.string().max(500).allow(null, '').optional(),
    seccion: Joi.string().max(100).allow(null, '').optional(),
    orden: Joi.number().integer().min(0).optional(),
    ancho_columnas: Joi.number().integer().min(1).max(12).optional(),
    icono: Joi.string().max(50).allow(null, '').optional(),
    visible_en_formulario: Joi.boolean().optional(),
    visible_en_listado: Joi.boolean().optional(),
    buscable: Joi.boolean().optional(),
    activo: Joi.boolean().optional(),
    longitud_minima: Joi.number().integer().min(0).allow(null).optional(),
    longitud_maxima: Joi.number().integer().min(1).allow(null).optional(),
    valor_minimo: Joi.number().allow(null).optional(),
    valor_maximo: Joi.number().allow(null).optional(),
    patron_regex: Joi.string().max(500).allow(null, '').optional(),
    mensaje_error: Joi.string().max(200).allow(null, '').optional()
  }).min(1)
};

/**
 * Schema para obtener definición por ID
 */
const getDefinicionSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required()
  })
};

/**
 * Schema para listar definiciones
 */
const listDefinicionesSchema = {
  query: Joi.object({
    entidad_tipo: Joi.string()
      .valid(...ENTIDAD_TIPOS)
      .optional(),
    activo: Joi.boolean().optional(),
    seccion: Joi.string().max(100).optional(),
    visible_en_formulario: Joi.boolean().optional(),
    visible_en_listado: Joi.boolean().optional(),
    limit: Joi.number().integer().min(1).max(100).default(50),
    offset: Joi.number().integer().min(0).default(0)
  })
};

/**
 * Schema para eliminar definición
 */
const deleteDefinicionSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required()
  })
};

/**
 * Schema para reordenar definiciones
 */
const reorderDefinicionesSchema = {
  body: Joi.object({
    entidad_tipo: Joi.string()
      .valid(...ENTIDAD_TIPOS)
      .required(),
    orden: Joi.array()
      .items(Joi.object({
        id: Joi.number().integer().positive().required(),
        orden: Joi.number().integer().min(0).required()
      }))
      .min(1)
      .required()
  })
};

/**
 * Schema para obtener valores de una entidad
 */
const getValoresSchema = {
  params: Joi.object({
    entidad_tipo: Joi.string()
      .valid(...ENTIDAD_TIPOS)
      .required(),
    entidad_id: Joi.number().integer().positive().required()
  })
};

/**
 * Schema para guardar valores de una entidad
 */
const saveValoresSchema = {
  params: Joi.object({
    entidad_tipo: Joi.string()
      .valid(...ENTIDAD_TIPOS)
      .required(),
    entidad_id: Joi.number().integer().positive().required()
  }),
  body: Joi.object()
    .pattern(
      Joi.string(), // nombre_clave
      Joi.any()     // valor (se valida en el backend con la función SQL)
    )
};

/**
 * Schema para validar valores
 */
const validateValoresSchema = {
  params: Joi.object({
    entidad_tipo: Joi.string()
      .valid(...ENTIDAD_TIPOS)
      .required()
  }),
  body: Joi.object()
    .pattern(
      Joi.string(),
      Joi.any()
    )
};

module.exports = {
  createDefinicionSchema,
  updateDefinicionSchema,
  getDefinicionSchema,
  listDefinicionesSchema,
  deleteDefinicionSchema,
  reorderDefinicionesSchema,
  getValoresSchema,
  saveValoresSchema,
  validateValoresSchema,
  TIPOS_DATO,
  ENTIDAD_TIPOS
};
