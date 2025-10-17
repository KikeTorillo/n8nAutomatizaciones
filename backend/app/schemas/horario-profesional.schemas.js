const Joi = require('joi');
const { commonSchemas } = require('../middleware/validation');

/**
 * Schemas de validación para Horarios Profesionales
 * Plataforma SaaS Multi-Tenant para Automatización de Agendamiento
 */

const horarioProfesionalSchemas = {
    /**
     * Schema para crear horario
     * POST /api/v1/horarios-profesionales
     */
    crear: {
        body: Joi.object({
            profesional_id: commonSchemas.id.required()
                .messages({
                    'any.required': 'El ID del profesional es requerido',
                    'number.base': 'El ID del profesional debe ser un número'
                }),

            dia_semana: Joi.number().integer().min(0).max(6).required()
                .messages({
                    'any.required': 'El día de la semana es requerido',
                    'number.base': 'El día de la semana debe ser un número',
                    'number.min': 'El día debe estar entre 0 (Domingo) y 6 (Sábado)',
                    'number.max': 'El día debe estar entre 0 (Domingo) y 6 (Sábado)'
                }),

            hora_inicio: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).required()
                .messages({
                    'any.required': 'La hora de inicio es requerida',
                    'string.pattern.base': 'La hora de inicio debe estar en formato HH:MM o HH:MM:SS'
                }),

            hora_fin: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).required()
                .messages({
                    'any.required': 'La hora de fin es requerida',
                    'string.pattern.base': 'La hora de fin debe estar en formato HH:MM o HH:MM:SS'
                }),

            zona_horaria: Joi.string().max(50).default('America/Mexico_City')
                .messages({
                    'string.max': 'La zona horaria no puede exceder 50 caracteres'
                }),

            tipo_horario: Joi.string().valid('regular', 'break', 'almuerzo', 'premium').default('regular')
                .messages({
                    'any.only': 'El tipo de horario debe ser: regular, break, almuerzo o premium'
                }),

            nombre_horario: Joi.string().max(50).allow(null)
                .messages({
                    'string.max': 'El nombre del horario no puede exceder 50 caracteres'
                }),

            descripcion: Joi.string().allow(null)
                .messages({
                    'string.base': 'La descripción debe ser texto'
                }),

            permite_citas: Joi.boolean().default(true)
                .messages({
                    'boolean.base': 'El campo permite_citas debe ser verdadero o falso'
                }),

            precio_premium: Joi.number().min(0).max(999.99).precision(2).default(0.00)
                .messages({
                    'number.min': 'El precio premium no puede ser negativo',
                    'number.max': 'El precio premium no puede exceder 999.99'
                }),

            permite_descuentos: Joi.boolean().default(true)
                .messages({
                    'boolean.base': 'El campo permite_descuentos debe ser verdadero o falso'
                }),

            fecha_inicio: Joi.date().iso().default(() => new Date().toISOString().split('T')[0])
                .messages({
                    'date.base': 'La fecha de inicio debe ser una fecha válida',
                    'date.format': 'La fecha de inicio debe estar en formato ISO (YYYY-MM-DD)'
                }),

            fecha_fin: Joi.date().iso().allow(null).min(Joi.ref('fecha_inicio'))
                .messages({
                    'date.base': 'La fecha de fin debe ser una fecha válida',
                    'date.format': 'La fecha de fin debe estar en formato ISO (YYYY-MM-DD)',
                    'date.min': 'La fecha de fin debe ser mayor o igual a la fecha de inicio'
                }),

            motivo_vigencia: Joi.string().allow(null)
                .messages({
                    'string.base': 'El motivo de vigencia debe ser texto'
                }),

            capacidad_maxima: Joi.number().integer().min(0).max(50).default(1)
                .messages({
                    'number.min': 'La capacidad máxima no puede ser negativa',
                    'number.max': 'La capacidad máxima no puede exceder 50'
                }),

            configuracion_especial: Joi.object().default({})
                .messages({
                    'object.base': 'La configuración especial debe ser un objeto JSON'
                }),

            prioridad: Joi.number().integer().default(0)
                .messages({
                    'number.base': 'La prioridad debe ser un número entero'
                })
        })
    },

    /**
     * Schema para crear horarios semanales estándar
     * POST /api/v1/horarios-profesionales/semanales-estandar
     */
    crearSemanalesEstandar: {
        body: Joi.object({
            profesional_id: commonSchemas.id.required()
                .messages({
                    'any.required': 'El ID del profesional es requerido'
                }),

            dias: Joi.array().items(
                Joi.number().integer().min(0).max(6)
            ).min(1).default([1, 2, 3, 4, 5])
                .messages({
                    'array.min': 'Debe especificar al menos un día',
                    'number.min': 'Los días deben estar entre 0 (Domingo) y 6 (Sábado)',
                    'number.max': 'Los días deben estar entre 0 (Domingo) y 6 (Sábado)'
                }),

            hora_inicio: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).default('09:00:00')
                .messages({
                    'string.pattern.base': 'La hora de inicio debe estar en formato HH:MM o HH:MM:SS'
                }),

            hora_fin: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).default('18:00:00')
                .messages({
                    'string.pattern.base': 'La hora de fin debe estar en formato HH:MM o HH:MM:SS'
                }),

            tipo_horario: Joi.string().valid('regular', 'premium').default('regular')
                .messages({
                    'any.only': 'El tipo de horario debe ser: regular o premium'
                }),

            nombre_horario: Joi.string().max(50).default('Horario Laboral')
                .messages({
                    'string.max': 'El nombre del horario no puede exceder 50 caracteres'
                }),

            fecha_inicio: Joi.date().iso().default(() => new Date().toISOString().split('T')[0])
                .messages({
                    'date.base': 'La fecha de inicio debe ser una fecha válida'
                })
        })
    },

    /**
     * Schema para listar horarios
     * GET /api/v1/horarios-profesionales
     */
    listar: {
        query: Joi.object({
            profesional_id: commonSchemas.id.required()
                .messages({
                    'any.required': 'El parámetro profesional_id es requerido'
                }),

            dia_semana: Joi.number().integer().min(0).max(6)
                .messages({
                    'number.min': 'El día debe estar entre 0 (Domingo) y 6 (Sábado)',
                    'number.max': 'El día debe estar entre 0 (Domingo) y 6 (Sábado)'
                }),

            tipo_horario: Joi.string().valid('regular', 'break', 'almuerzo', 'premium')
                .messages({
                    'any.only': 'El tipo de horario debe ser: regular, break, almuerzo o premium'
                }),

            solo_permite_citas: Joi.string().valid('true', 'false')
                .messages({
                    'any.only': 'El parámetro solo_permite_citas debe ser "true" o "false"'
                }),

            incluir_inactivos: Joi.string().valid('true', 'false')
                .messages({
                    'any.only': 'El parámetro incluir_inactivos debe ser "true" o "false"'
                }),

            fecha_vigencia: Joi.date().iso()
                .messages({
                    'date.base': 'La fecha de vigencia debe ser una fecha válida'
                }),

            limite: Joi.number().integer().min(1).max(100).default(50)
                .messages({
                    'number.min': 'El límite debe ser al menos 1',
                    'number.max': 'El límite no puede exceder 100'
                }),
            offset: Joi.number().integer().min(0).default(0)
                .messages({
                    'number.min': 'El offset no puede ser negativo'
                })
        })
    },

    /**
     * Schema para obtener horario por ID
     * GET /api/v1/horarios-profesionales/:id
     */
    obtenerPorId: {
        params: Joi.object({
            id: commonSchemas.id.required()
                .messages({
                    'any.required': 'El ID del horario es requerido'
                })
        })
    },

    /**
     * Schema para actualizar horario
     * PUT /api/v1/horarios-profesionales/:id
     */
    actualizar: {
        params: Joi.object({
            id: commonSchemas.id.required()
                .messages({
                    'any.required': 'El ID del horario es requerido'
                })
        }),
        body: Joi.object({
            dia_semana: Joi.number().integer().min(0).max(6)
                .messages({
                    'number.min': 'El día debe estar entre 0 (Domingo) y 6 (Sábado)',
                    'number.max': 'El día debe estar entre 0 (Domingo) y 6 (Sábado)'
                }),

            hora_inicio: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
                .messages({
                    'string.pattern.base': 'La hora de inicio debe estar en formato HH:MM o HH:MM:SS'
                }),

            hora_fin: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
                .messages({
                    'string.pattern.base': 'La hora de fin debe estar en formato HH:MM o HH:MM:SS'
                }),

            zona_horaria: Joi.string().max(50)
                .messages({
                    'string.max': 'La zona horaria no puede exceder 50 caracteres'
                }),

            tipo_horario: Joi.string().valid('regular', 'break', 'almuerzo', 'premium')
                .messages({
                    'any.only': 'El tipo de horario debe ser: regular, break, almuerzo o premium'
                }),

            nombre_horario: Joi.string().max(50).allow(null)
                .messages({
                    'string.max': 'El nombre del horario no puede exceder 50 caracteres'
                }),

            descripcion: Joi.string().allow(null),

            permite_citas: Joi.boolean()
                .messages({
                    'boolean.base': 'El campo permite_citas debe ser verdadero o falso'
                }),

            precio_premium: Joi.number().min(0).max(999.99).precision(2)
                .messages({
                    'number.min': 'El precio premium no puede ser negativo',
                    'number.max': 'El precio premium no puede exceder 999.99'
                }),

            permite_descuentos: Joi.boolean(),

            fecha_inicio: Joi.date().iso()
                .messages({
                    'date.base': 'La fecha de inicio debe ser una fecha válida'
                }),

            fecha_fin: Joi.date().iso().allow(null)
                .messages({
                    'date.base': 'La fecha de fin debe ser una fecha válida'
                }),

            motivo_vigencia: Joi.string().allow(null),

            capacidad_maxima: Joi.number().integer().min(0).max(50)
                .messages({
                    'number.min': 'La capacidad máxima no puede ser negativa',
                    'number.max': 'La capacidad máxima no puede exceder 50'
                }),

            configuracion_especial: Joi.object(),

            activo: Joi.boolean()
                .messages({
                    'boolean.base': 'El campo activo debe ser verdadero o falso'
                }),

            prioridad: Joi.number().integer()
        }).min(1)
            .messages({
                'object.min': 'Debe proporcionar al menos un campo para actualizar'
            })
    },

    /**
     * Schema para eliminar horario
     * DELETE /api/v1/horarios-profesionales/:id
     */
    eliminar: {
        params: Joi.object({
            id: commonSchemas.id.required()
                .messages({
                    'any.required': 'El ID del horario es requerido'
                })
        })
    },

    /**
     * Schema para validar configuración de horarios
     * GET /api/v1/horarios-profesionales/validar/:profesional_id
     */
    validarConfiguracion: {
        params: Joi.object({
            profesional_id: commonSchemas.id.required()
                .messages({
                    'any.required': 'El ID del profesional es requerido'
                })
        })
    }
};

module.exports = horarioProfesionalSchemas;
