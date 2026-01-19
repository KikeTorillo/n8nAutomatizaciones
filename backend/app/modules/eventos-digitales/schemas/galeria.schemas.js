/**
 * ====================================================================
 * SCHEMAS: GALERÍA COMPARTIDA
 * ====================================================================
 * Validación Joi para endpoints de galería de fotos.
 *
 * Fecha creación: 14 Diciembre 2025
 */

const Joi = require('joi');

const galeriaSchemas = {
    /**
     * POST /eventos/:eventoId/galeria
     */
    subirFoto: {
        params: Joi.object({
            eventoId: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            url: Joi.string().uri().max(500).required(),
            thumbnail_url: Joi.string().uri().max(500).allow(null, ''),
            invitado_id: Joi.number().integer().positive().allow(null),
            nombre_autor: Joi.string().max(100).allow(null, ''),
            caption: Joi.string().max(200).allow(null, ''),
            tamanio_bytes: Joi.number().integer().positive().allow(null),
            tipo_mime: Joi.string().max(50).allow(null, '')
        })
    },

    /**
     * GET /eventos/:eventoId/galeria
     */
    listarFotos: {
        params: Joi.object({
            eventoId: Joi.number().integer().positive().required()
        }),
        query: Joi.object({
            estado: Joi.string().valid('visible', 'oculta'),
            limit: Joi.number().integer().min(1).max(500).default(100),
            offset: Joi.number().integer().min(0).default(0)
        })
    },

    /**
     * GET /galeria/:id
     */
    obtenerFoto: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    },

    /**
     * PUT /galeria/:id/estado
     */
    cambiarEstado: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            estado: Joi.string().valid('visible', 'oculta').required()
        })
    },

    /**
     * DELETE /galeria/:id
     * DELETE /galeria/:id/permanente
     */
    eliminarFoto: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    },

    /**
     * POST /public/evento/:slug/:token/galeria
     * Subir foto como invitado
     */
    subirFotoPublica: {
        params: Joi.object({
            slug: Joi.string().pattern(/^[a-z0-9-]+$/).max(100).required(),
            token: Joi.string().length(64).required()
        }),
        body: Joi.object({
            url: Joi.string().uri().max(500).required(),
            thumbnail_url: Joi.string().uri().max(500).allow(null, ''),
            caption: Joi.string().max(200).allow(null, ''),
            tamanio_bytes: Joi.number().integer().positive().allow(null),
            tipo_mime: Joi.string().max(50).allow(null, '')
        })
    },

    /**
     * GET /public/evento/:slug/galeria
     */
    obtenerGaleriaPublica: {
        params: Joi.object({
            slug: Joi.string().pattern(/^[a-z0-9-]+$/).max(100).required()
        }),
        query: Joi.object({
            limit: Joi.number().integer().min(1).max(200).default(100)
        })
    },

    /**
     * POST /public/galeria/:id/reportar
     */
    reportarFoto: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            motivo: Joi.string().max(500).required()
        })
    }
};

module.exports = galeriaSchemas;
