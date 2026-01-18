/**
 * Schemas de validación - Movimientos de Inventario
 * @module inventario/schemas/movimientos.schemas
 */

const Joi = require('joi');

const movimientosSchemas = {
    /**
     * Schema para registrar movimiento
     * POST /api/v1/inventario/movimientos
     */
    registrarMovimiento: {
        body: Joi.object({
            producto_id: Joi.number().integer().positive().required().messages({
                'any.required': 'El producto_id es requerido'
            }),

            tipo_movimiento: Joi.string()
                .valid(
                    'entrada_compra', 'entrada_devolucion', 'entrada_ajuste',
                    'salida_venta', 'salida_uso_servicio', 'salida_merma',
                    'salida_robo', 'salida_devolucion', 'salida_ajuste'
                )
                .required()
                .messages({
                    'any.required': 'El tipo_movimiento es requerido',
                    'any.only': 'tipo_movimiento inválido'
                }),

            cantidad: Joi.number().integer().required().messages({
                'any.required': 'La cantidad es requerida'
            }),

            costo_unitario: Joi.number().min(0).optional().allow(null),
            proveedor_id: Joi.number().integer().positive().optional().allow(null),
            venta_pos_id: Joi.number().integer().positive().optional().allow(null),
            cita_id: Joi.number().integer().positive().optional().allow(null),
            usuario_id: Joi.number().integer().positive().optional().allow(null),

            referencia: Joi.string().max(100).optional().allow(null, ''),
            motivo: Joi.string().max(500).optional().allow(null, ''),
            fecha_vencimiento: Joi.date().iso().optional().allow(null),
            lote: Joi.string().max(50).optional().allow(null, ''),
            // FEATURE: Multi-sucursal
            sucursal_id: Joi.number().integer().positive().optional().allow(null)
        }).custom((value, helpers) => {
            // Validación: Las entradas deben tener cantidad positiva
            if (value.tipo_movimiento?.startsWith('entrada') && value.cantidad <= 0) {
                return helpers.error('any.custom', {
                    message: 'Las entradas deben tener cantidad positiva'
                });
            }

            // Validación: Las salidas deben tener cantidad negativa
            if (value.tipo_movimiento?.startsWith('salida') && value.cantidad >= 0) {
                return helpers.error('any.custom', {
                    message: 'Las salidas deben tener cantidad negativa'
                });
            }

            return value;
        })
    },

    /**
     * Schema para listar movimientos
     * GET /api/v1/inventario/movimientos
     */
    listarMovimientos: {
        query: Joi.object({
            tipo_movimiento: Joi.string().valid(
                'entrada_compra', 'entrada_devolucion', 'entrada_ajuste',
                'salida_venta', 'salida_uso_servicio', 'salida_merma',
                'salida_robo', 'salida_devolucion', 'salida_ajuste'
            ).optional(),
            categoria: Joi.string().valid('entrada', 'salida').optional(),
            producto_id: Joi.number().integer().positive().optional(),
            proveedor_id: Joi.number().integer().positive().optional(),
            // FEATURE: Multi-sucursal
            sucursal_id: Joi.number().integer().positive().optional(),
            fecha_desde: Joi.string().isoDate().optional(),
            fecha_hasta: Joi.string().isoDate().optional(),
            limit: Joi.number().integer().min(1).max(100).optional().default(50),
            offset: Joi.number().integer().min(0).optional().default(0)
        })
    },

    /**
     * Schema para obtener kardex de producto
     * GET /api/v1/inventario/movimientos/kardex/:producto_id
     */
    obtenerKardex: {
        params: Joi.object({
            producto_id: Joi.number().integer().positive().required()
        }),
        query: Joi.object({
            tipo_movimiento: Joi.string().optional(),
            fecha_desde: Joi.string().isoDate().optional(),
            fecha_hasta: Joi.string().isoDate().optional(),
            proveedor_id: Joi.number().integer().positive().optional(),
            limit: Joi.number().integer().min(1).max(200).optional().default(100),
            offset: Joi.number().integer().min(0).optional().default(0)
        })
    },

    /**
     * Schema para obtener estadísticas de movimientos
     * GET /api/v1/inventario/movimientos/estadisticas
     */
    obtenerEstadisticasMovimientos: {
        query: Joi.object({
            fecha_desde: Joi.string().isoDate().required().messages({
                'any.required': 'fecha_desde es requerida'
            }),
            fecha_hasta: Joi.string().isoDate().required().messages({
                'any.required': 'fecha_hasta es requerida'
            })
        })
    }
};

module.exports = movimientosSchemas;
