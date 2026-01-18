/**
 * Schemas de validación - Reorden Automático
 * @module inventario/schemas/reorden.schemas
 */

const Joi = require('joi');
const { withPagination, idOptional } = require('../../../schemas/shared');

const reordenSchemas = {
    /**
     * Schema para crear regla de reabastecimiento
     * POST /api/v1/inventario/reorden/reglas
     */
    crearReglaReorden: {
        body: Joi.object({
            nombre: Joi.string().max(100).required().messages({
                'any.required': 'El nombre de la regla es requerido',
                'string.max': 'El nombre no puede exceder 100 caracteres'
            }),

            descripcion: Joi.string().max(500).optional().allow(null, ''),

            // Aplicacion (solo uno puede estar definido)
            producto_id: Joi.number().integer().positive().optional().allow(null),
            categoria_id: Joi.number().integer().positive().optional().allow(null),
            sucursal_id: Joi.number().integer().positive().optional().allow(null),

            // Ruta de operacion a usar
            ruta_id: Joi.number().integer().positive().required().messages({
                'any.required': 'La ruta de operacion es requerida'
            }),

            // Condiciones de activacion
            stock_minimo_trigger: Joi.number().integer().min(0).required().messages({
                'any.required': 'El stock minimo trigger es requerido',
                'number.min': 'El stock minimo trigger debe ser mayor o igual a 0'
            }),
            usar_stock_proyectado: Joi.boolean().optional().default(true),

            // Cantidad a ordenar
            cantidad_fija: Joi.number().integer().min(1).optional().allow(null),
            cantidad_hasta_maximo: Joi.boolean().optional().default(false),
            cantidad_minima: Joi.number().integer().min(1).optional().default(1),
            cantidad_maxima: Joi.number().integer().min(1).optional().allow(null),
            multiplo_de: Joi.number().integer().min(1).optional().default(1),

            // Programacion
            dias_semana: Joi.array()
                .items(Joi.number().integer().min(1).max(7))
                .optional()
                .default([1, 2, 3, 4, 5])
                .messages({
                    'array.includes': 'Los dias deben ser numeros entre 1 (Lunes) y 7 (Domingo)'
                }),
            hora_ejecucion: Joi.string()
                .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
                .optional()
                .default('08:00:00'),
            frecuencia_horas: Joi.number().integer().min(1).max(168).optional().default(24),

            activo: Joi.boolean().optional().default(true),
            prioridad: Joi.number().integer().min(0).optional().default(0)
        }).custom((value, helpers) => {
            // Validar que no tenga producto_id Y categoria_id a la vez
            if (value.producto_id && value.categoria_id) {
                return helpers.error('any.custom', {
                    message: 'No puede especificar producto_id y categoria_id a la vez'
                });
            }
            return value;
        })
    },

    /**
     * Schema para actualizar regla de reabastecimiento
     * PUT /api/v1/inventario/reorden/reglas/:id
     */
    actualizarReglaReorden: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),

        body: Joi.object({
            nombre: Joi.string().max(100).optional(),
            descripcion: Joi.string().max(500).optional().allow(null, ''),
            ruta_id: Joi.number().integer().positive().optional(),
            stock_minimo_trigger: Joi.number().integer().min(0).optional(),
            usar_stock_proyectado: Joi.boolean().optional(),
            cantidad_fija: Joi.number().integer().min(1).optional().allow(null),
            cantidad_hasta_maximo: Joi.boolean().optional(),
            cantidad_minima: Joi.number().integer().min(1).optional(),
            cantidad_maxima: Joi.number().integer().min(1).optional().allow(null),
            multiplo_de: Joi.number().integer().min(1).optional(),
            dias_semana: Joi.array().items(Joi.number().integer().min(1).max(7)).optional(),
            frecuencia_horas: Joi.number().integer().min(1).max(168).optional(),
            activo: Joi.boolean().optional(),
            prioridad: Joi.number().integer().min(0).optional()
        }).min(1)
    },

    /**
     * Schema para listar reglas de reabastecimiento
     * GET /api/v1/inventario/reorden/reglas
     */
    listarReglasReorden: {
        query: Joi.object({
            activo: Joi.boolean().optional(),
            producto_id: Joi.number().integer().positive().optional()
        })
    },

    /**
     * Schema para listar logs de reorden
     * GET /api/v1/inventario/reorden/logs
     */
    listarLogsReorden: {
        query: withPagination({
            tipo: Joi.string().valid('job_cron', 'manual').optional(),
            fecha_desde: Joi.date().iso().optional(),
            fecha_hasta: Joi.date().iso().optional()
        })
    },

    /**
     * Schema para listar productos bajo minimo
     * GET /api/v1/inventario/reorden/productos-bajo-minimo
     */
    listarProductosBajoMinimo: {
        query: Joi.object({
            solo_sin_oc: Joi.boolean().optional().default(true),
            categoria_id: Joi.number().integer().positive().optional(),
            proveedor_id: Joi.number().integer().positive().optional(),
            limit: Joi.number().integer().min(1).max(500).optional().default(100)
        })
    }
};

module.exports = reordenSchemas;
