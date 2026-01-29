/**
 * Schemas de validación - Movimientos de Inventario
 * @module inventario/schemas/movimientos.schemas
 */

const Joi = require('joi');
const { withPagination, idOptional } = require('../../../schemas/shared');

const movimientosSchemas = {
    /**
     * Schema para registrar movimiento
     * POST /api/v1/inventario/movimientos
     * Ene 2026: Agregados campos ubicación y tipos transferencia para consolidación de stock
     */
    registrarMovimiento: {
        body: Joi.object({
            producto_id: Joi.number().integer().positive().required().messages({
                'any.required': 'El producto_id es requerido'
            }),

            tipo_movimiento: Joi.string()
                .valid(
                    'entrada_compra', 'entrada_devolucion', 'entrada_ajuste',
                    'entrada_transferencia',
                    'salida_venta', 'salida_uso_servicio', 'salida_merma',
                    'salida_robo', 'salida_devolucion', 'salida_ajuste',
                    'salida_transferencia'
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
            sucursal_id: Joi.number().integer().positive().optional().allow(null),
            // FEATURE: Consolidación stock - ubicaciones WMS
            ubicacion_id: Joi.number().integer().positive().optional().allow(null),
            ubicacion_origen_id: Joi.number().integer().positive().optional().allow(null),
            ubicacion_destino_id: Joi.number().integer().positive().optional().allow(null),
            // FEATURE: Variantes de producto
            variante_id: Joi.number().integer().positive().optional().allow(null)
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
     * Ene 2026: Agregados tipos transferencia para consolidación de stock
     */
    listarMovimientos: {
        query: withPagination({
            tipo_movimiento: Joi.string().valid(
                'entrada_compra', 'entrada_devolucion', 'entrada_ajuste',
                'entrada_transferencia',
                'salida_venta', 'salida_uso_servicio', 'salida_merma',
                'salida_robo', 'salida_devolucion', 'salida_ajuste',
                'salida_transferencia'
            ).optional(),
            categoria: Joi.string().valid('entrada', 'salida').optional(),
            producto_id: idOptional,
            proveedor_id: idOptional,
            // FEATURE: Multi-sucursal
            sucursal_id: idOptional,
            fecha_desde: Joi.string().isoDate().optional(),
            fecha_hasta: Joi.string().isoDate().optional()
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
        query: withPagination({
            tipo_movimiento: Joi.string().optional(),
            fecha_desde: Joi.string().isoDate().optional(),
            fecha_hasta: Joi.string().isoDate().optional(),
            proveedor_id: idOptional
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
