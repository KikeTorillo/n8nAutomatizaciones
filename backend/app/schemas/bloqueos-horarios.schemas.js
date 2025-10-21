/**
 * Schemas de Validación Joi para Bloqueos de Horarios
 * Valida todos los endpoints del módulo de bloqueos
 */

const Joi = require('joi');
const { commonSchemas } = require('../middleware/validation');

/**
 * Schema para crear bloqueo
 * POST /bloqueos-horarios
 */
const crear = {
    body: Joi.object({
        organizacion_id: commonSchemas.id.optional(), // Solo super_admin lo envía
        profesional_id: commonSchemas.id.optional().allow(null),
        servicio_id: commonSchemas.id.optional().allow(null),
        tipo_bloqueo_id: commonSchemas.id.required()
            .messages({
                'any.required': 'tipo_bloqueo_id es requerido',
                'number.base': 'tipo_bloqueo_id debe ser un número entero válido'
            }),
        titulo: Joi.string()
            .min(3)
            .max(200)
            .required()
            .messages({
                'any.required': 'titulo es requerido',
                'string.min': 'titulo debe tener al menos 3 caracteres',
                'string.max': 'titulo no puede exceder 200 caracteres'
            }),
        descripcion: Joi.string().max(1000).optional().allow(null),
        fecha_inicio: Joi.string()
            .pattern(/^\d{4}-\d{2}-\d{2}$/)
            .required()
            .messages({
                'any.required': 'fecha_inicio es requerida',
                'string.pattern.base': 'fecha_inicio debe estar en formato YYYY-MM-DD'
            }),
        fecha_fin: Joi.string()
            .pattern(/^\d{4}-\d{2}-\d{2}$/)
            .required()
            .custom((value, helpers) => {
                const fecha_inicio = helpers.state.ancestors[0].fecha_inicio;
                if (fecha_inicio && value < fecha_inicio) {
                    return helpers.error('custom.fecha_fin_posterior');
                }
                return value;
            })
            .messages({
                'any.required': 'fecha_fin es requerida',
                'string.pattern.base': 'fecha_fin debe estar en formato YYYY-MM-DD',
                'custom.fecha_fin_posterior': 'fecha_fin debe ser igual o posterior a fecha_inicio'
            }),
        hora_inicio: commonSchemas.time.optional().allow(null),
        hora_fin: commonSchemas.time.optional().allow(null)
            .custom((value, helpers) => {
                const hora_inicio = helpers.state.ancestors[0].hora_inicio;
                if (hora_inicio && value && value <= hora_inicio) {
                    return helpers.error('custom.hora_fin_posterior');
                }
                return value;
            })
            .messages({
                'custom.hora_fin_posterior': 'hora_fin debe ser posterior a hora_inicio'
            }),
        zona_horaria: Joi.string().max(50).default('America/Mexico_City'),
        es_recurrente: Joi.boolean().default(false),
        patron_recurrencia: Joi.object().optional().allow(null),
        fecha_fin_recurrencia: Joi.string()
            .pattern(/^\d{4}-\d{2}-\d{2}$/)
            .optional()
            .allow(null),
        color_display: Joi.string()
            .pattern(/^#[0-9A-Fa-f]{6}$/)
            .default('#FF6B6B')
            .messages({
                'string.pattern.base': 'color_display debe ser un código hexadecimal válido (#RRGGBB)'
            }),
        icono: Joi.string().max(50).default('calendar-x'),
        activo: Joi.boolean().default(true),
        auto_generado: Joi.boolean().default(false),
        origen_bloqueo: Joi.string().max(100).default('manual'),
        notificar_afectados: Joi.boolean().default(true),
        dias_aviso_previo: Joi.number().integer().min(0).max(365).default(7),
        mensaje_clientes: Joi.string().max(500).optional().allow(null),
        calcular_impacto: Joi.boolean().default(true),
        ingresos_perdidos: commonSchemas.price.default(0.00),
        metadata: Joi.object().optional().allow(null),
        notas_internas: Joi.string().max(2000).optional().allow(null)
    })
};

/**
 * Schema para actualizar bloqueo
 * PUT /bloqueos-horarios/:id
 */
const actualizar = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        titulo: Joi.string().min(3).max(200),
        descripcion: Joi.string().max(1000).allow(null),
        fecha_inicio: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
        fecha_fin: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
        hora_inicio: commonSchemas.time.allow(null),
        hora_fin: commonSchemas.time.allow(null),
        zona_horaria: Joi.string().max(50),
        tipo_bloqueo_id: commonSchemas.id.optional(),
        color_display: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/),
        icono: Joi.string().max(50),
        notificar_afectados: Joi.boolean(),
        dias_aviso_previo: Joi.number().integer().min(0).max(365),
        mensaje_clientes: Joi.string().max(500).allow(null),
        metadata: Joi.object().allow(null),
        notas_internas: Joi.string().max(2000).allow(null)
    }).min(1)
        .custom((value, helpers) => {
            // Validar fecha_fin >= fecha_inicio
            if (value.fecha_inicio && value.fecha_fin && value.fecha_fin < value.fecha_inicio) {
                return helpers.error('custom.fecha_fin_posterior');
            }
            // Validar hora_fin > hora_inicio
            if (value.hora_inicio && value.hora_fin && value.hora_fin <= value.hora_inicio) {
                return helpers.error('custom.hora_fin_posterior');
            }
            return value;
        })
        .messages({
            'custom.fecha_fin_posterior': 'fecha_fin debe ser igual o posterior a fecha_inicio',
            'custom.hora_fin_posterior': 'hora_fin debe ser posterior a hora_inicio'
        }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional() // Solo super_admin
    })
};

/**
 * Schema para obtener bloqueos
 * GET /bloqueos-horarios
 * GET /bloqueos-horarios/:id
 */
const obtener = {
    params: Joi.object({
        id: commonSchemas.id.optional()
    }).optional(),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional(), // Solo super_admin
        id: commonSchemas.id.optional(),
        profesional_id: commonSchemas.id.optional(),
        tipo_bloqueo_id: commonSchemas.id.optional(),
        fecha_inicio: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
        fecha_fin: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
        solo_organizacionales: Joi.boolean().optional(),
        limite: Joi.number().integer().min(1).max(100).default(50),
        offset: Joi.number().integer().min(0).default(0)
    })
};

/**
 * Schema para eliminar bloqueo
 * DELETE /bloqueos-horarios/:id
 */
const eliminar = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional() // Solo super_admin
    })
};

module.exports = {
    crear,
    actualizar,
    obtener,
    eliminar
};
