/**
 * ====================================================================
 * SCHEMAS: FELICITACIONES (LIBRO DE VISITAS)
 * ====================================================================
 * Validación Joi para endpoints de felicitaciones.
 *
 * Fecha creación: 4 Diciembre 2025
 */

const Joi = require('joi');

const felicitacionesSchemas = {
    /**
     * POST /eventos/:eventoId/felicitaciones
     */
    crearFelicitacion: {
        params: Joi.object({
            eventoId: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            invitado_id: Joi.number().integer().positive().allow(null),
            nombre_autor: Joi.string().max(100).required(),
            mensaje: Joi.string().max(2000).required(),
            aprobado: Joi.boolean().default(true)
        })
    },

    /**
     * GET /eventos/:eventoId/felicitaciones
     */
    listarFelicitaciones: {
        params: Joi.object({
            eventoId: Joi.number().integer().positive().required()
        }),
        query: Joi.object({
            aprobadas: Joi.string().valid('true', 'false'),
            limit: Joi.number().integer().min(1).max(500).default(100),
            offset: Joi.number().integer().min(0).default(0)
        })
    },

    /**
     * GET /felicitaciones/:id
     */
    obtenerFelicitacion: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    },

    /**
     * PUT /felicitaciones/:id/aprobar
     * PUT /felicitaciones/:id/rechazar
     */
    cambiarAprobacion: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    },

    /**
     * DELETE /felicitaciones/:id
     */
    eliminarFelicitacion: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    },

    /**
     * POST /public/evento/:slug/:token/felicitacion
     * Crear felicitación pública
     */
    crearFelicitacionPublica: {
        params: Joi.object({
            slug: Joi.string().pattern(/^[a-z0-9-]+$/).max(100).required(),
            token: Joi.string().length(64).required()
        }),
        body: Joi.object({
            nombre_autor: Joi.string().max(100).required(),
            mensaje: Joi.string().max(2000).required()
        })
    },

    /**
     * GET /public/evento/:slug/felicitaciones
     */
    obtenerFelicitacionesPublicas: {
        params: Joi.object({
            slug: Joi.string().pattern(/^[a-z0-9-]+$/).max(100).required()
        }),
        query: Joi.object({
            limit: Joi.number().integer().min(1).max(100).default(50)
        })
    }
};

module.exports = felicitacionesSchemas;
