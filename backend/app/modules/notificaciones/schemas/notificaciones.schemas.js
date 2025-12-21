/**
 * Schemas de validacion para Notificaciones
 *
 * @module modules/notificaciones/schemas/notificaciones.schemas
 */

const Joi = require('joi');

// Categorias validas
const CATEGORIAS = [
  'citas', 'inventario', 'pagos', 'clientes', 'profesionales',
  'marketplace', 'sistema', 'eventos', 'comisiones', 'suscripcion'
];

// Niveles validos
const NIVELES = ['info', 'success', 'warning', 'error'];

/**
 * Schema para listar notificaciones
 */
const listSchema = {
  query: Joi.object({
    solo_no_leidas: Joi.boolean().default(false),
    categoria: Joi.string().valid(...CATEGORIAS).optional(),
    limit: Joi.number().integer().min(1).max(100).default(20),
    offset: Joi.number().integer().min(0).default(0)
  })
};

/**
 * Schema para obtener notificacion por ID
 */
const getByIdSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required()
  })
};

/**
 * Schema para marcar como leida
 */
const marcarLeidaSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required()
  })
};

/**
 * Schema para archivar
 */
const archivarSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required()
  })
};

/**
 * Schema para eliminar
 */
const deleteSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required()
  })
};

/**
 * Schema para crear notificacion (uso interno/admin)
 */
const createSchema = {
  body: Joi.object({
    usuario_id: Joi.number().integer().positive().required(),
    tipo: Joi.string().max(50).required(),
    categoria: Joi.string().valid(...CATEGORIAS).required(),
    titulo: Joi.string().max(200).required(),
    mensaje: Joi.string().required(),
    nivel: Joi.string().valid(...NIVELES).default('info'),
    icono: Joi.string().max(50).allow(null, '').optional(),
    accion_url: Joi.string().max(500).allow(null, '').optional(),
    accion_texto: Joi.string().max(50).allow(null, '').optional(),
    entidad_tipo: Joi.string().max(50).allow(null, '').optional(),
    entidad_id: Joi.number().integer().positive().allow(null).optional(),
    expira_en: Joi.date().iso().allow(null).optional()
  })
};

/**
 * Schema para actualizar preferencias
 */
const updatePreferenciasSchema = {
  body: Joi.object({
    preferencias: Joi.array().items(
      Joi.object({
        tipo: Joi.string().max(50).required(),
        in_app: Joi.boolean().required(),
        email: Joi.boolean().required(),
        push: Joi.boolean().default(false),
        whatsapp: Joi.boolean().default(false)
      })
    ).min(1).required()
  })
};

/**
 * Schema para crear plantilla (admin)
 */
const createPlantillaSchema = {
  body: Joi.object({
    tipo_notificacion: Joi.string().max(50).required(),
    nombre: Joi.string().max(100).required(),
    titulo_template: Joi.string().max(200).required(),
    mensaje_template: Joi.string().required(),
    icono: Joi.string().max(50).allow(null, '').optional(),
    nivel: Joi.string().valid(...NIVELES).default('info'),
    activo: Joi.boolean().default(true)
  })
};

/**
 * Schema para actualizar plantilla
 */
const updatePlantillaSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required()
  }),
  body: Joi.object({
    nombre: Joi.string().max(100).optional(),
    titulo_template: Joi.string().max(200).optional(),
    mensaje_template: Joi.string().optional(),
    icono: Joi.string().max(50).allow(null, '').optional(),
    nivel: Joi.string().valid(...NIVELES).optional(),
    activo: Joi.boolean().optional()
  }).min(1)
};

module.exports = {
  listSchema,
  getByIdSchema,
  marcarLeidaSchema,
  archivarSchema,
  deleteSchema,
  createSchema,
  updatePreferenciasSchema,
  createPlantillaSchema,
  updatePlantillaSchema,
  CATEGORIAS,
  NIVELES
};
