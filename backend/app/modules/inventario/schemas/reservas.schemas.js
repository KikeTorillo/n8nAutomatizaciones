/**
 * Schemas de validación - Reservas de Stock
 * @module inventario/schemas/reservas.schemas
 */

const Joi = require('joi');
const { withPagination, idOptional } = require('../../../schemas/shared');

const reservasSchemas = {
    /**
     * Schema para crear reserva de stock
     * POST /api/v1/inventario/reservas
     */
    crearReserva: {
        body: Joi.object({
            producto_id: Joi.number().integer().positive().required().messages({
                'any.required': 'El producto_id es requerido',
                'number.positive': 'producto_id debe ser un número positivo'
            }),

            cantidad: Joi.number().integer().min(1).required().messages({
                'any.required': 'La cantidad es requerida',
                'number.min': 'La cantidad debe ser al menos 1'
            }),

            tipo_origen: Joi.string()
                .valid('venta_pos', 'orden_venta', 'cita_servicio', 'transferencia')
                .required()
                .messages({
                    'any.required': 'El tipo_origen es requerido',
                    'any.only': 'tipo_origen debe ser: venta_pos, orden_venta, cita_servicio o transferencia'
                }),

            origen_id: Joi.number().integer().positive().optional().allow(null),
            sucursal_id: Joi.number().integer().positive().optional().allow(null),
            minutos_expiracion: Joi.number().integer().min(1).max(120).optional().default(15)
        })
    },

    /**
     * Schema para crear múltiples reservas
     * POST /api/v1/inventario/reservas/multiple
     */
    crearReservaMultiple: {
        body: Joi.object({
            items: Joi.array().items(
                Joi.object({
                    producto_id: Joi.number().integer().positive().required(),
                    cantidad: Joi.number().integer().min(1).required()
                })
            ).min(1).max(50).required().messages({
                'any.required': 'El array de items es requerido',
                'array.min': 'Debe incluir al menos 1 item',
                'array.max': 'No puede reservar más de 50 items a la vez'
            }),

            tipo_origen: Joi.string()
                .valid('venta_pos', 'orden_venta', 'cita_servicio', 'transferencia')
                .required(),

            origen_id: Joi.number().integer().positive().optional().allow(null),
            sucursal_id: Joi.number().integer().positive().optional().allow(null)
        })
    },

    /**
     * Schema para listar reservas
     * GET /api/v1/inventario/reservas
     */
    listarReservas: {
        query: withPagination({
            estado: Joi.string().valid('activa', 'confirmada', 'expirada', 'cancelada').optional(),
            producto_id: idOptional,
            sucursal_id: idOptional,
            tipo_origen: Joi.string().valid('venta_pos', 'orden_venta', 'cita_servicio', 'transferencia').optional(),
            origen_id: idOptional
        })
    },

    /**
     * Schema para confirmar reserva
     * PATCH /api/v1/inventario/reservas/:id/confirmar
     */
    confirmarReserva: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    },

    /**
     * Schema para confirmar múltiples reservas
     * POST /api/v1/inventario/reservas/confirmar-multiple
     */
    confirmarReservaMultiple: {
        body: Joi.object({
            reserva_ids: Joi.array()
                .items(Joi.number().integer().positive())
                .min(1)
                .max(50)
                .required()
                .messages({
                    'any.required': 'reserva_ids es requerido',
                    'array.min': 'Debe incluir al menos un ID de reserva',
                    'array.max': 'No puede confirmar más de 50 reservas a la vez'
                })
        })
    },

    /**
     * Schema para cancelar reserva
     * DELETE /api/v1/inventario/reservas/:id
     */
    cancelarReserva: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    },

    /**
     * Schema para cancelar reservas por origen
     * DELETE /api/v1/inventario/reservas/origen/:tipoOrigen/:origenId
     */
    cancelarReservaPorOrigen: {
        params: Joi.object({
            tipoOrigen: Joi.string()
                .valid('venta_pos', 'orden_venta', 'cita_servicio', 'transferencia')
                .required(),
            origenId: Joi.number().integer().positive().required()
        })
    },

    /**
     * Schema para obtener stock disponible de un producto
     * GET /api/v1/inventario/productos/:id/stock-disponible
     */
    stockDisponible: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),
        query: Joi.object({
            sucursal_id: Joi.number().integer().positive().optional()
        })
    },

    /**
     * Schema para obtener stock disponible de múltiples productos
     * POST /api/v1/inventario/productos/stock-disponible
     */
    stockDisponibleMultiple: {
        body: Joi.object({
            producto_ids: Joi.array()
                .items(Joi.number().integer().positive())
                .min(1)
                .max(100)
                .required()
                .messages({
                    'any.required': 'producto_ids es requerido',
                    'array.min': 'Debe incluir al menos un ID de producto',
                    'array.max': 'No puede consultar más de 100 productos a la vez'
                }),
            sucursal_id: Joi.number().integer().positive().optional().allow(null)
        })
    },

    /**
     * Schema para verificar disponibilidad
     * GET /api/v1/inventario/productos/:id/verificar-disponibilidad
     */
    verificarDisponibilidad: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),
        query: Joi.object({
            cantidad: Joi.number().integer().min(1).required().messages({
                'any.required': 'La cantidad es requerida',
                'number.min': 'La cantidad debe ser al menos 1'
            }),
            sucursal_id: Joi.number().integer().positive().optional()
        })
    },

    /**
     * Schema para extender reserva
     * PATCH /api/v1/inventario/reservas/:id/extender
     */
    extenderReserva: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            minutos_adicionales: Joi.number().integer().min(1).max(60).optional().default(15)
        })
    }
};

module.exports = reservasSchemas;
