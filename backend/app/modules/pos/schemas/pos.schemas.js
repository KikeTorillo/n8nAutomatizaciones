/**
 * ====================================================================
 * SCHEMAS DE VALIDACIÓN - PUNTO DE VENTA (POS)
 * ====================================================================
 *
 * Schemas Joi para validación de requests del módulo POS.
 */

const Joi = require('joi');

const posSchemas = {
    // ========================================================================
    // VENTAS POS
    // ========================================================================

    /**
     * Schema para crear venta con items
     * POST /api/v1/pos/ventas
     */
    crearVenta: {
        body: Joi.object({
            tipo_venta: Joi.string()
                .valid('directa', 'cita', 'apartado', 'cotizacion')
                .optional()
                .default('directa')
                .messages({
                    'any.only': 'tipo_venta debe ser: directa, cita, apartado o cotizacion'
                }),

            cliente_id: Joi.number().integer().positive().optional().allow(null).messages({
                'number.base': 'cliente_id debe ser un número',
                'number.positive': 'cliente_id debe ser positivo'
            }),

            cita_id: Joi.number().integer().positive().optional().allow(null).messages({
                'number.base': 'cita_id debe ser un número',
                'number.positive': 'cita_id debe ser positivo'
            }),

            profesional_id: Joi.number().integer().positive().optional().allow(null).messages({
                'number.base': 'profesional_id debe ser un número',
                'number.positive': 'profesional_id debe ser positivo'
            }),

            usuario_id: Joi.number().integer().positive().required().messages({
                'any.required': 'usuario_id es requerido',
                'number.base': 'usuario_id debe ser un número'
            }),

            // ✅ FEATURE: Multi-sucursal
            sucursal_id: Joi.number().integer().positive().optional().allow(null).messages({
                'number.base': 'sucursal_id debe ser un número',
                'number.positive': 'sucursal_id debe ser positivo'
            }),

            items: Joi.array()
                .min(1)
                .max(100)
                .items(
                    Joi.object({
                        producto_id: Joi.number().integer().positive().required().messages({
                            'any.required': 'producto_id es requerido en cada item'
                        }),

                        cantidad: Joi.number().integer().min(1).required().messages({
                            'any.required': 'cantidad es requerida en cada item',
                            'number.min': 'cantidad debe ser al menos 1'
                        }),

                        precio_unitario: Joi.number().min(0).optional().messages({
                            'number.min': 'precio_unitario no puede ser negativo'
                        }),

                        descuento_porcentaje: Joi.number().min(0).max(100).optional().default(0).messages({
                            'number.min': 'descuento_porcentaje no puede ser negativo',
                            'number.max': 'descuento_porcentaje no puede exceder 100'
                        }),

                        descuento_monto: Joi.number().min(0).optional().default(0).messages({
                            'number.min': 'descuento_monto no puede ser negativo'
                        }),

                        aplica_comision: Joi.boolean().optional().default(true),

                        notas: Joi.string().max(500).optional().allow(null, '')
                    })
                )
                .required()
                .messages({
                    'any.required': 'items es requerido',
                    'array.min': 'Debe incluir al menos 1 item',
                    'array.max': 'No se pueden agregar más de 100 items'
                }),

            descuento_porcentaje: Joi.number().min(0).max(100).optional().default(0),
            descuento_monto: Joi.number().min(0).optional().default(0),
            impuestos: Joi.number().min(0).optional().default(0),

            metodo_pago: Joi.string()
                .valid('efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia', 'mixto', 'qr_mercadopago')
                .required()
                .messages({
                    'any.required': 'metodo_pago es requerido',
                    'any.only': 'metodo_pago inválido'
                }),

            monto_pagado: Joi.number().min(0).optional().messages({
                'number.min': 'monto_pagado no puede ser negativo'
            }),

            fecha_apartado: Joi.date().iso().optional().allow(null),
            fecha_vencimiento_apartado: Joi.date().iso().optional().allow(null),

            notas: Joi.string().max(1000).optional().allow(null, '')
        }).custom((value, helpers) => {
            // Validación: Si es apartado, debe tener fechas
            if (value.tipo_venta === 'apartado') {
                if (!value.fecha_apartado) {
                    return helpers.error('any.custom', {
                        message: 'fecha_apartado es requerida para tipo_venta apartado'
                    });
                }
                if (!value.fecha_vencimiento_apartado) {
                    return helpers.error('any.custom', {
                        message: 'fecha_vencimiento_apartado es requerida para tipo_venta apartado'
                    });
                }
            }

            // Validación: Si es venta de cita, debe incluir cita_id
            if (value.tipo_venta === 'cita' && !value.cita_id) {
                return helpers.error('any.custom', {
                    message: 'cita_id es requerida para tipo_venta cita'
                });
            }

            return value;
        })
    },

    /**
     * Schema para listar ventas
     * GET /api/v1/pos/ventas
     */
    listarVentas: {
        query: Joi.object({
            estado: Joi.string()
                .valid('cotizacion', 'apartado', 'completada', 'cancelada')
                .optional(),

            estado_pago: Joi.string()
                .valid('pendiente', 'parcial', 'pagado')
                .optional(),

            tipo_venta: Joi.string()
                .valid('directa', 'cita', 'apartado', 'cotizacion')
                .optional(),

            cliente_id: Joi.number().integer().positive().optional(),
            profesional_id: Joi.number().integer().positive().optional(),

            metodo_pago: Joi.string()
                .valid('efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia', 'mixto', 'qr_mercadopago')
                .optional(),

            fecha_desde: Joi.string().isoDate().optional(),
            fecha_hasta: Joi.string().isoDate().optional(),

            folio: Joi.string().max(50).optional(),

            // ✅ FEATURE: Multi-sucursal
            sucursal_id: Joi.number().integer().positive().optional(),

            limit: Joi.number().integer().min(1).max(100).optional().default(50),
            offset: Joi.number().integer().min(0).optional().default(0)
        })
    },

    /**
     * Schema para actualizar estado de venta
     * PATCH /api/v1/pos/ventas/:id/estado
     */
    actualizarEstado: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),

        body: Joi.object({
            estado: Joi.string()
                .valid('cotizacion', 'apartado', 'completada', 'cancelada')
                .required()
                .messages({
                    'any.required': 'estado es requerido',
                    'any.only': 'estado inválido'
                })
        })
    },

    /**
     * Schema para registrar pago
     * POST /api/v1/pos/ventas/:id/pago
     */
    registrarPago: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),

        body: Joi.object({
            monto_pago: Joi.number().min(0.01).required().messages({
                'any.required': 'monto_pago es requerido',
                'number.min': 'monto_pago debe ser mayor a 0'
            }),

            metodo_pago: Joi.string()
                .valid('efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia', 'mixto', 'qr_mercadopago')
                .required()
                .messages({
                    'any.required': 'metodo_pago es requerido'
                }),

            pago_id: Joi.number().integer().positive().optional().allow(null).messages({
                'number.base': 'pago_id debe ser un número'
            })
        })
    },

    /**
     * Schema para cancelar venta
     * POST /api/v1/pos/ventas/:id/cancelar
     */
    cancelarVenta: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),

        body: Joi.object({
            motivo: Joi.string().max(500).optional().allow(null, '').messages({
                'string.max': 'El motivo no puede exceder 500 caracteres'
            }),

            usuario_id: Joi.number().integer().positive().required().messages({
                'any.required': 'usuario_id es requerido'
            })
        })
    },

    /**
     * Schema para procesar devolución de items
     * POST /api/v1/pos/ventas/:id/devolver
     */
    devolverItems: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),

        body: Joi.object({
            items_devueltos: Joi.array()
                .min(1)
                .items(
                    Joi.object({
                        item_id: Joi.number().integer().positive().required().messages({
                            'any.required': 'item_id es requerido en cada devolución'
                        }),

                        cantidad_devolver: Joi.number().integer().min(1).required().messages({
                            'any.required': 'cantidad_devolver es requerida',
                            'number.min': 'cantidad_devolver debe ser al menos 1'
                        })
                    })
                )
                .required()
                .messages({
                    'any.required': 'items_devueltos es requerido',
                    'array.min': 'Debe incluir al menos 1 item para devolver'
                }),

            motivo: Joi.string().max(500).optional().allow(null, '').messages({
                'string.max': 'El motivo no puede exceder 500 caracteres'
            }),

            usuario_id: Joi.number().integer().positive().required().messages({
                'any.required': 'usuario_id es requerido'
            })
        })
    },

    /**
     * Schema para obtener corte de caja
     * GET /api/v1/pos/corte-caja
     */
    corteCaja: {
        query: Joi.object({
            fecha_inicio: Joi.string().isoDate().required().messages({
                'any.required': 'fecha_inicio es requerida'
            }),

            fecha_fin: Joi.string().isoDate().required().messages({
                'any.required': 'fecha_fin es requerida'
            }),

            usuario_id: Joi.number().integer().positive().optional()
        })
    },

    /**
     * Schema genérico para obtener por ID
     * GET /api/v1/pos/ventas/:id
     */
    obtenerPorId: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    },

    /**
     * Schema para agregar items a venta existente
     * POST /api/v1/pos/ventas/:id/items
     */
    agregarItems: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),

        body: Joi.object({
            items: Joi.array()
                .min(1)
                .max(50)
                .items(
                    Joi.object({
                        producto_id: Joi.number().integer().positive().required().messages({
                            'any.required': 'producto_id es requerido en cada item'
                        }),

                        cantidad: Joi.number().integer().min(1).required().messages({
                            'any.required': 'cantidad es requerida en cada item',
                            'number.min': 'cantidad debe ser al menos 1'
                        }),

                        precio_unitario: Joi.number().min(0).optional(),
                        descuento_porcentaje: Joi.number().min(0).max(100).optional().default(0),
                        descuento_monto: Joi.number().min(0).optional().default(0),
                        aplica_comision: Joi.boolean().optional().default(true),
                        notas: Joi.string().max(500).optional().allow(null, '')
                    })
                )
                .required()
                .messages({
                    'any.required': 'items es requerido',
                    'array.min': 'Debe incluir al menos 1 item',
                    'array.max': 'No se pueden agregar más de 50 items'
                })
        })
    },

    /**
     * Schema para actualizar venta completa
     * PUT /api/v1/pos/ventas/:id
     */
    actualizarVenta: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),

        body: Joi.object({
            tipo_venta: Joi.string()
                .valid('directa', 'cita', 'apartado', 'cotizacion')
                .optional(),

            cliente_id: Joi.number().integer().positive().optional().allow(null),
            profesional_id: Joi.number().integer().positive().optional().allow(null),
            descuento_porcentaje: Joi.number().min(0).max(100).optional(),
            descuento_monto: Joi.number().min(0).optional(),
            impuestos: Joi.number().min(0).optional(),
            metodo_pago: Joi.string()
                .valid('efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia', 'mixto', 'qr_mercadopago')
                .optional(),
            fecha_apartado: Joi.date().iso().optional().allow(null),
            fecha_vencimiento_apartado: Joi.date().iso().optional().allow(null),
            notas: Joi.string().max(1000).optional().allow(null, '')
        }).min(1)
    },

    /**
     * Schema para eliminar venta
     * DELETE /api/v1/pos/ventas/:id
     */
    eliminarVenta: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),

        body: Joi.object({
            motivo: Joi.string().max(500).required().messages({
                'any.required': 'El motivo de eliminación es requerido'
            }),

            usuario_id: Joi.number().integer().positive().required().messages({
                'any.required': 'usuario_id es requerido'
            })
        })
    },

    // ========================================================================
    // REPORTES POS
    // ========================================================================

    /**
     * Schema para reporte de ventas diarias
     * GET /api/v1/pos/reportes/ventas-diarias
     */
    reporteVentasDiarias: {
        query: Joi.object({
            fecha: Joi.string().isoDate().required().messages({
                'any.required': 'fecha es requerida (formato YYYY-MM-DD)'
            }),

            profesional_id: Joi.number().integer().positive().optional(),
            usuario_id: Joi.number().integer().positive().optional()
        })
    }
};

module.exports = posSchemas;
