/**
 * Schemas de validacion - Monedas y Tasas de Cambio
 * @module core/schemas/monedas.schemas
 */

const Joi = require('joi');
const { fields } = require('../../../schemas/shared');

const monedasSchemas = {
    /**
     * Schema para listar monedas
     * GET /api/v1/core/monedas
     */
    listar: {
        query: Joi.object({
            activo: fields.activoQuery,
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(20)
        })
    },

    /**
     * Schema para obtener moneda por codigo
     * GET /api/v1/core/monedas/:codigo
     */
    obtenerPorCodigo: {
        params: Joi.object({
            codigo: Joi.string().trim().length(3).uppercase().required().messages({
                'string.length': 'El codigo de moneda debe tener 3 caracteres (ISO 4217)'
            })
        })
    },

    /**
     * Schema para obtener tasa de cambio actual
     * GET /api/v1/core/monedas/tasa/:codigoOrigen/:codigoDestino
     */
    obtenerTasa: {
        params: Joi.object({
            codigoOrigen: Joi.string().trim().length(3).uppercase().required(),
            codigoDestino: Joi.string().trim().length(3).uppercase().required()
        })
    },

    /**
     * Schema para historial de tasas
     * GET /api/v1/core/monedas/historial/:codigoOrigen/:codigoDestino
     */
    historialTasas: {
        params: Joi.object({
            codigoOrigen: Joi.string().trim().length(3).uppercase().required(),
            codigoDestino: Joi.string().trim().length(3).uppercase().required()
        }),
        query: Joi.object({
            fecha_inicio: fields.fecha.required(),
            fecha_fin: fields.fecha.required(),
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(50)
        })
    },

    /**
     * Schema para guardar tasa de cambio manualmente
     * POST /api/v1/core/monedas/tasas
     */
    guardarTasa: {
        body: Joi.object({
            moneda_origen_codigo: Joi.string().trim().length(3).uppercase().required(),
            moneda_destino_codigo: Joi.string().trim().length(3).uppercase().required(),
            tasa: Joi.number().positive().precision(8).required().messages({
                'number.positive': 'La tasa debe ser un numero positivo'
            }),
            fecha_vigencia: fields.fecha.default(() => new Date().toISOString().split('T')[0]),
            fuente: Joi.string().trim().max(50).default('manual')
        })
    },

    /**
     * Schema para convertir montos
     * POST /api/v1/core/monedas/convertir
     */
    convertir: {
        body: Joi.object({
            monto: Joi.number().min(0).precision(2).required(),
            moneda_origen: Joi.string().trim().length(3).uppercase().required(),
            moneda_destino: Joi.string().trim().length(3).uppercase().required(),
            fecha: fields.fecha.optional()
        })
    }
};

module.exports = monedasSchemas;
