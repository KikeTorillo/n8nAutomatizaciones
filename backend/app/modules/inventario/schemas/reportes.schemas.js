/**
 * Schemas de validación - Reportes de Inventario
 * @module inventario/schemas/reportes.schemas
 */

const Joi = require('joi');

const reportesSchemas = {
    /**
     * Schema para reporte de análisis ABC
     * GET /api/v1/inventario/reportes/analisis-abc
     */
    reporteAnalisisABC: {
        query: Joi.object({
            fecha_desde: Joi.string().isoDate().required().messages({
                'any.required': 'fecha_desde es requerida'
            }),
            fecha_hasta: Joi.string().isoDate().required().messages({
                'any.required': 'fecha_hasta es requerida'
            }),
            categoria_id: Joi.number().integer().positive().optional()
        })
    },

    /**
     * Schema para reporte de rotación de inventario
     * GET /api/v1/inventario/reportes/rotacion
     */
    reporteRotacion: {
        query: Joi.object({
            fecha_desde: Joi.string().isoDate().required().messages({
                'any.required': 'fecha_desde es requerida'
            }),
            fecha_hasta: Joi.string().isoDate().required().messages({
                'any.required': 'fecha_hasta es requerida'
            }),
            categoria_id: Joi.number().integer().positive().optional(),
            top: Joi.number().integer().min(1).max(100).optional().default(20)
        })
    }
};

module.exports = reportesSchemas;
