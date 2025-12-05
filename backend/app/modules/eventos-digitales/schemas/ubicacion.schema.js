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

const ubicacionesSchemas = {
    /**
     * POST /eventos/:eventoId/ubicaciones
     */
    crearUbicacion: {
        params: Joi.object({
            eventoId: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            nombre: Joi.string().max(100).required(),
            tipo: Joi.string().valid(...tiposUbicacion).default('ceremonia'),
            direccion: Joi.string().max(500).allow(null, ''),
            latitud: Joi.number().min(-90).max(90).allow(null),
            longitud: Joi.number().min(-180).max(180).allow(null),
            google_maps_url: Joi.string().uri().max(500).allow(null, ''),
            hora_inicio: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).allow(null, ''),
            hora_fin: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).allow(null, ''),
            codigo_vestimenta: Joi.string().max(100).allow(null, ''),
            notas: Joi.string().max(1000).allow(null, ''),
            orden: Joi.number().integer().min(0).default(0)
        })
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
        }),
        body: Joi.object({
            nombre: Joi.string().max(100),
            tipo: Joi.string().valid(...tiposUbicacion),
            direccion: Joi.string().max(500).allow(null, ''),
            latitud: Joi.number().min(-90).max(90).allow(null),
            longitud: Joi.number().min(-180).max(180).allow(null),
            google_maps_url: Joi.string().uri().max(500).allow(null, ''),
            hora_inicio: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).allow(null, ''),
            hora_fin: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).allow(null, ''),
            codigo_vestimenta: Joi.string().max(100).allow(null, ''),
            notas: Joi.string().max(1000).allow(null, ''),
            orden: Joi.number().integer().min(0),
            activo: Joi.boolean()
        }).min(1)
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
