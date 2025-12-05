/**
 * ====================================================================
 * SCHEMAS: UBICACIONES DE EVENTOS DIGITALES
 * ====================================================================
 * Validación Joi para endpoints de ubicaciones.
 *
 * Fecha creación: 4 Diciembre 2025
 */

const Joi = require('joi');

const tiposUbicacion = ['ceremonia', 'recepcion', 'fiesta', 'after', 'otro'];

// Mensajes personalizados en español
const mensajesEspanol = {
    'string.empty': 'El campo {#label} no puede estar vacío',
    'string.max': 'El campo {#label} no puede tener más de {#limit} caracteres',
    'string.uri': 'El campo {#label} debe ser una URL válida',
    'string.pattern.base': 'El campo {#label} tiene un formato inválido',
    'number.base': 'El campo {#label} debe ser un número',
    'number.min': 'El campo {#label} debe ser mayor o igual a {#limit}',
    'number.max': 'El campo {#label} debe ser menor o igual a {#limit}',
    'number.integer': 'El campo {#label} debe ser un número entero',
    'number.positive': 'El campo {#label} debe ser un número positivo',
    'any.required': 'El campo {#label} es requerido',
    'any.only': 'El campo {#label} debe ser uno de: {#valids}'
};

const ubicacionesSchemas = {
    /**
     * POST /eventos/:eventoId/ubicaciones
     */
    crearUbicacion: {
        params: Joi.object({
            eventoId: Joi.number().integer().positive().required()
                .messages({
                    'number.base': 'El ID del evento debe ser un número',
                    'number.positive': 'El ID del evento debe ser positivo',
                    'any.required': 'El ID del evento es requerido'
                })
        }),
        body: Joi.object({
            nombre: Joi.string().max(100).required()
                .label('nombre')
                .messages({
                    'string.empty': 'El nombre de la ubicación es requerido',
                    'string.max': 'El nombre no puede tener más de 100 caracteres',
                    'any.required': 'El nombre de la ubicación es requerido'
                }),
            tipo: Joi.string().valid(...tiposUbicacion).default('ceremonia')
                .label('tipo')
                .messages({
                    'any.only': 'El tipo debe ser: ceremonia, recepcion, fiesta, after u otro'
                }),
            direccion: Joi.string().max(500).allow(null, '')
                .label('dirección')
                .messages({
                    'string.max': 'La dirección no puede tener más de 500 caracteres'
                }),
            latitud: Joi.number().min(-90).max(90).allow(null)
                .label('latitud')
                .messages({
                    'number.min': 'La latitud debe ser mayor o igual a -90',
                    'number.max': 'La latitud debe ser menor o igual a 90'
                }),
            longitud: Joi.number().min(-180).max(180).allow(null)
                .label('longitud')
                .messages({
                    'number.min': 'La longitud debe ser mayor o igual a -180',
                    'number.max': 'La longitud debe ser menor o igual a 180'
                }),
            google_maps_url: Joi.string().uri().max(500).allow(null, '')
                .label('URL de Google Maps')
                .messages({
                    'string.uri': 'La URL de Google Maps no es válida',
                    'string.max': 'La URL no puede tener más de 500 caracteres'
                }),
            hora_inicio: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).allow(null, '')
                .label('hora de inicio')
                .messages({
                    'string.pattern.base': 'La hora de inicio debe tener formato HH:MM (ej: 14:30)'
                }),
            hora_fin: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).allow(null, '')
                .label('hora de fin')
                .messages({
                    'string.pattern.base': 'La hora de fin debe tener formato HH:MM (ej: 18:00)'
                }),
            codigo_vestimenta: Joi.string().max(100).allow(null, '')
                .label('código de vestimenta')
                .messages({
                    'string.max': 'El código de vestimenta no puede tener más de 100 caracteres'
                }),
            notas: Joi.string().max(1000).allow(null, '')
                .label('notas')
                .messages({
                    'string.max': 'Las notas no pueden tener más de 1000 caracteres'
                }),
            orden: Joi.number().integer().min(0).default(0)
                .label('orden')
                .messages({
                    'number.min': 'El orden debe ser mayor o igual a 0'
                })
        }).messages(mensajesEspanol)
    },

    /**
     * GET /eventos/:eventoId/ubicaciones
     */
    listarUbicaciones: {
        params: Joi.object({
            eventoId: Joi.number().integer().positive().required()
        })
    },

    /**
     * GET /ubicaciones/:id
     */
    obtenerUbicacion: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    },

    /**
     * PUT /ubicaciones/:id
     */
    actualizarUbicacion: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
                .messages({
                    'number.base': 'El ID de la ubicación debe ser un número',
                    'number.positive': 'El ID de la ubicación debe ser positivo',
                    'any.required': 'El ID de la ubicación es requerido'
                })
        }),
        body: Joi.object({
            nombre: Joi.string().max(100)
                .label('nombre')
                .messages({
                    'string.empty': 'El nombre de la ubicación no puede estar vacío',
                    'string.max': 'El nombre no puede tener más de 100 caracteres'
                }),
            tipo: Joi.string().valid(...tiposUbicacion)
                .label('tipo')
                .messages({
                    'any.only': 'El tipo debe ser: ceremonia, recepcion, fiesta, after u otro'
                }),
            direccion: Joi.string().max(500).allow(null, '')
                .label('dirección')
                .messages({
                    'string.max': 'La dirección no puede tener más de 500 caracteres'
                }),
            latitud: Joi.number().min(-90).max(90).allow(null)
                .label('latitud')
                .messages({
                    'number.min': 'La latitud debe ser mayor o igual a -90',
                    'number.max': 'La latitud debe ser menor o igual a 90'
                }),
            longitud: Joi.number().min(-180).max(180).allow(null)
                .label('longitud')
                .messages({
                    'number.min': 'La longitud debe ser mayor o igual a -180',
                    'number.max': 'La longitud debe ser menor o igual a 180'
                }),
            google_maps_url: Joi.string().uri().max(500).allow(null, '')
                .label('URL de Google Maps')
                .messages({
                    'string.uri': 'La URL de Google Maps no es válida',
                    'string.max': 'La URL no puede tener más de 500 caracteres'
                }),
            hora_inicio: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).allow(null, '')
                .label('hora de inicio')
                .messages({
                    'string.pattern.base': 'La hora de inicio debe tener formato HH:MM (ej: 14:30)'
                }),
            hora_fin: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).allow(null, '')
                .label('hora de fin')
                .messages({
                    'string.pattern.base': 'La hora de fin debe tener formato HH:MM (ej: 18:00)'
                }),
            codigo_vestimenta: Joi.string().max(100).allow(null, '')
                .label('código de vestimenta')
                .messages({
                    'string.max': 'El código de vestimenta no puede tener más de 100 caracteres'
                }),
            notas: Joi.string().max(1000).allow(null, '')
                .label('notas')
                .messages({
                    'string.max': 'Las notas no pueden tener más de 1000 caracteres'
                }),
            orden: Joi.number().integer().min(0)
                .label('orden')
                .messages({
                    'number.min': 'El orden debe ser mayor o igual a 0'
                }),
            activo: Joi.boolean()
                .label('activo')
        }).min(1).messages({
            ...mensajesEspanol,
            'object.min': 'Debe enviar al menos un campo para actualizar'
        })
    },

    /**
     * DELETE /ubicaciones/:id
     */
    eliminarUbicacion: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    },

    /**
     * PUT /eventos/:eventoId/ubicaciones/reordenar
     */
    reordenarUbicaciones: {
        params: Joi.object({
            eventoId: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            orden: Joi.array().items(Joi.number().integer().positive()).required()
        })
    }
};

module.exports = ubicacionesSchemas;
