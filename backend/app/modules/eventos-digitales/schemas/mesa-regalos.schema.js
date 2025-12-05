/**
 * ====================================================================
 * SCHEMAS: MESA DE REGALOS
 * ====================================================================
 * Validación Joi para endpoints de mesa de regalos.
 *
 * Fecha creación: 4 Diciembre 2025
 */

const Joi = require('joi');

const tiposRegalo = ['producto', 'sobre_digital', 'link_externo'];

const mesaRegalosSchemas = {
    /**
     * POST /eventos/:eventoId/mesa-regalos
     */
    crearRegalo: {
        params: Joi.object({
            eventoId: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            tipo: Joi.string().valid(...tiposRegalo).required(),
            nombre: Joi.string().max(200).required(),
            descripcion: Joi.string().max(1000).allow(null, ''),
            precio: Joi.number().precision(2).min(0).allow(null),
            imagen_url: Joi.string().uri().max(500).allow(null, ''),
            url_externa: Joi.string().uri().max(500).allow(null, ''),
            orden: Joi.number().integer().min(0).default(0)
        })
    },

    /**
     * GET /eventos/:eventoId/mesa-regalos
     */
    listarRegalos: {
        params: Joi.object({
            eventoId: Joi.number().integer().positive().required()
        }),
        query: Joi.object({
            disponibles: Joi.string().valid('true', 'false')
        })
    },

    /**
     * GET /mesa-regalos/:id
     */
    obtenerRegalo: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    },

    /**
     * PUT /mesa-regalos/:id
     */
    actualizarRegalo: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            tipo: Joi.string().valid(...tiposRegalo),
            nombre: Joi.string().max(200),
            descripcion: Joi.string().max(1000).allow(null, ''),
            precio: Joi.number().precision(2).min(0).allow(null),
            imagen_url: Joi.string().uri().max(500).allow(null, ''),
            url_externa: Joi.string().uri().max(500).allow(null, ''),
            orden: Joi.number().integer().min(0),
            activo: Joi.boolean()
        }).min(1)
    },

    /**
     * PUT /mesa-regalos/:id/comprar
     */
    marcarComprado: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            comprado_por: Joi.string().max(200).required()
        })
    },

    /**
     * DELETE /mesa-regalos/:id
     */
    eliminarRegalo: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    },

    /**
     * GET /eventos/:eventoId/mesa-regalos/estadisticas
     */
    estadisticasRegalos: {
        params: Joi.object({
            eventoId: Joi.number().integer().positive().required()
        })
    }
};

module.exports = mesaRegalosSchemas;
