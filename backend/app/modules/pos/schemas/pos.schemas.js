/**
 * ====================================================================
 * SCHEMAS DE VALIDACIÓN - PUNTO DE VENTA (POS)
 * ====================================================================
 *
 * Schemas Joi para validación de requests del módulo POS.
 */

const Joi = require('joi');
const { fields, withPagination } = require('../../../schemas/shared');

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

                        // Dic 2025: Soporte para variantes de producto
                        variante_id: Joi.number().integer().positive().optional().allow(null).messages({
                            'number.base': 'variante_id debe ser un número',
                            'number.positive': 'variante_id debe ser positivo'
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

                        notas: Joi.string().max(500).optional().allow(null, ''),

                        // Dic 2025: Reserva de stock (INV-5)
                        reserva_id: Joi.number().integer().positive().optional().allow(null).messages({
                            'number.base': 'reserva_id debe ser un número',
                            'number.positive': 'reserva_id debe ser positivo'
                        }),

                        // Dic 2025: Número de serie para trazabilidad (INV-5)
                        numero_serie_id: Joi.number().integer().positive().optional().allow(null).messages({
                            'number.base': 'numero_serie_id debe ser un número',
                            'number.positive': 'numero_serie_id debe ser positivo'
                        }),

                        numero_serie: Joi.string().max(100).optional().allow(null, '').messages({
                            'string.max': 'numero_serie no puede exceder 100 caracteres'
                        })
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

            // Ene 2026: Opcional para soportar pago split (se asigna 'mixto' cuando hay múltiples pagos)
            metodo_pago: Joi.string()
                .valid('efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia', 'mixto', 'qr_mercadopago')
                .optional()
                .messages({
                    'any.only': 'metodo_pago inválido'
                }),

            monto_pagado: Joi.number().min(0).optional().messages({
                'number.min': 'monto_pagado no puede ser negativo'
            }),

            fecha_apartado: Joi.date().iso().optional().allow(null),
            fecha_vencimiento_apartado: Joi.date().iso().optional().allow(null),

            notas: Joi.string().max(1000).optional().allow(null, ''),

            // Ene 2026: Cupones de descuento
            cupon_id: Joi.number().integer().positive().optional().allow(null).messages({
                'number.base': 'cupon_id debe ser un número',
                'number.positive': 'cupon_id debe ser positivo'
            }),
            descuento_cupon: Joi.number().min(0).optional().default(0).messages({
                'number.min': 'descuento_cupon no puede ser negativo'
            }),

            // Ene 2026: Promociones automáticas
            promociones_aplicadas: Joi.array().items(
                Joi.object({
                    promocion_id: Joi.number().integer().positive().required(),
                    descuento: Joi.number().min(0).required()
                })
            ).optional().default([]),
            descuento_promociones: Joi.number().min(0).optional().default(0).messages({
                'number.min': 'descuento_promociones no puede ser negativo'
            }),

            // Ene 2026: Canje de puntos de lealtad
            puntos_canjeados: Joi.number().integer().min(0).optional().default(0).messages({
                'number.base': 'puntos_canjeados debe ser un número',
                'number.min': 'puntos_canjeados no puede ser negativo'
            }),
            descuento_puntos: Joi.number().min(0).optional().default(0).messages({
                'number.min': 'descuento_puntos no puede ser negativo'
            })
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
    },

    // ========================================================================
    // SESIONES DE CAJA (Ene 2026)
    // ========================================================================

    /**
     * Schema para abrir sesión de caja
     * POST /api/v1/pos/sesiones-caja/abrir
     */
    abrirSesionCaja: {
        body: Joi.object({
            sucursal_id: Joi.number().integer().positive().optional().messages({
                'number.base': 'sucursal_id debe ser un número',
                'number.positive': 'sucursal_id debe ser positivo'
            }),

            monto_inicial: Joi.number().min(0).optional().default(0).messages({
                'number.min': 'monto_inicial no puede ser negativo'
            }),

            nota_apertura: Joi.string().max(500).optional().allow(null, '').messages({
                'string.max': 'nota_apertura no puede exceder 500 caracteres'
            })
        })
    },

    /**
     * Schema para cerrar sesión de caja
     * POST /api/v1/pos/sesiones-caja/cerrar
     */
    cerrarSesionCaja: {
        body: Joi.object({
            sesion_id: Joi.number().integer().positive().required().messages({
                'any.required': 'sesion_id es requerido',
                'number.base': 'sesion_id debe ser un número'
            }),

            monto_contado: Joi.number().min(0).required().messages({
                'any.required': 'monto_contado es requerido',
                'number.min': 'monto_contado no puede ser negativo'
            }),

            nota_cierre: Joi.string().max(500).optional().allow(null, '').messages({
                'string.max': 'nota_cierre no puede exceder 500 caracteres'
            }),

            desglose: Joi.object({
                billetes_1000: Joi.number().integer().min(0).optional().default(0),
                billetes_500: Joi.number().integer().min(0).optional().default(0),
                billetes_200: Joi.number().integer().min(0).optional().default(0),
                billetes_100: Joi.number().integer().min(0).optional().default(0),
                billetes_50: Joi.number().integer().min(0).optional().default(0),
                billetes_20: Joi.number().integer().min(0).optional().default(0),
                monedas_10: Joi.number().integer().min(0).optional().default(0),
                monedas_5: Joi.number().integer().min(0).optional().default(0),
                monedas_2: Joi.number().integer().min(0).optional().default(0),
                monedas_1: Joi.number().integer().min(0).optional().default(0),
                monedas_050: Joi.number().integer().min(0).optional().default(0)
            }).optional()
        })
    },

    /**
     * Schema para registrar movimiento de caja
     * POST /api/v1/pos/sesiones-caja/:id/movimiento
     */
    registrarMovimientoCaja: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),

        body: Joi.object({
            tipo: Joi.string().valid('entrada', 'salida').required().messages({
                'any.required': 'tipo es requerido',
                'any.only': 'tipo debe ser "entrada" o "salida"'
            }),

            monto: Joi.number().min(0.01).required().messages({
                'any.required': 'monto es requerido',
                'number.min': 'monto debe ser mayor a 0'
            }),

            motivo: Joi.string().min(3).max(500).required().messages({
                'any.required': 'motivo es requerido',
                'string.min': 'motivo debe tener al menos 3 caracteres',
                'string.max': 'motivo no puede exceder 500 caracteres'
            })
        })
    },

    /**
     * Schema para obtener sesión activa
     * GET /api/v1/pos/sesiones-caja/activa
     */
    obtenerSesionActiva: {
        query: Joi.object({
            sucursal_id: Joi.number().integer().positive().optional()
        })
    },

    /**
     * Schema para listar sesiones de caja
     * GET /api/v1/pos/sesiones-caja
     */
    listarSesionesCaja: {
        query: Joi.object({
            sucursal_id: Joi.number().integer().positive().optional(),
            usuario_id: Joi.number().integer().positive().optional(),
            estado: Joi.string().valid('abierta', 'cerrada').optional(),
            fecha_desde: Joi.string().isoDate().optional(),
            fecha_hasta: Joi.string().isoDate().optional(),
            limit: Joi.number().integer().min(1).max(100).optional().default(50),
            offset: Joi.number().integer().min(0).optional().default(0)
        })
    },

    /**
     * Schema genérico para obtener sesión por ID
     * GET /api/v1/pos/sesiones-caja/:id
     */
    obtenerSesionPorId: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    },

    // ========================================================================
    // PAGO SPLIT (Ene 2026)
    // ========================================================================

    /**
     * Schema para registrar pagos split (múltiples métodos de pago)
     * POST /api/v1/pos/ventas/:id/pagos-split
     */
    registrarPagosSplit: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),

        body: Joi.object({
            pagos: Joi.array()
                .min(1)
                .max(5)
                .items(
                    Joi.object({
                        metodo_pago: Joi.string()
                            .valid('efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia', 'qr_mercadopago', 'cuenta_cliente')
                            .required()
                            .messages({
                                'any.required': 'metodo_pago es requerido en cada pago',
                                'any.only': 'metodo_pago inválido'
                            }),

                        monto: Joi.number().min(0.01).required().messages({
                            'any.required': 'monto es requerido en cada pago',
                            'number.min': 'monto debe ser mayor a 0'
                        }),

                        monto_recibido: Joi.number().min(0).optional().allow(null).messages({
                            'number.min': 'monto_recibido no puede ser negativo'
                        }),

                        referencia: Joi.string().max(100).optional().allow(null, '').messages({
                            'string.max': 'referencia no puede exceder 100 caracteres'
                        })
                    }).custom((value, helpers) => {
                        // Validar que efectivo tenga monto_recibido
                        if (value.metodo_pago === 'efectivo' && !value.monto_recibido) {
                            value.monto_recibido = value.monto; // Default: pago exacto
                        }
                        // Validar que monto_recibido >= monto para efectivo
                        if (value.metodo_pago === 'efectivo' && value.monto_recibido < value.monto) {
                            return helpers.error('any.custom', {
                                message: 'Para efectivo, monto_recibido debe ser >= monto'
                            });
                        }
                        return value;
                    })
                )
                .required()
                .messages({
                    'any.required': 'pagos es requerido',
                    'array.min': 'Debe incluir al menos 1 pago',
                    'array.max': 'No se pueden agregar más de 5 métodos de pago'
                }),

            cliente_id: Joi.number().integer().positive().optional().allow(null).messages({
                'number.base': 'cliente_id debe ser un número'
            })
        })
    },

    /**
     * Schema para obtener pagos de una venta
     * GET /api/v1/pos/ventas/:id/pagos
     */
    obtenerPagosVenta: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    },

    // ========================================================================
    // CUPONES DE DESCUENTO (Ene 2026)
    // ========================================================================

    /**
     * Schema para crear cupón
     * POST /api/v1/pos/cupones
     */
    crearCupon: {
        body: Joi.object({
            codigo: Joi.string()
                .min(3)
                .max(50)
                .pattern(/^[A-Z0-9_-]+$/i)
                .required()
                .messages({
                    'any.required': 'código es requerido',
                    'string.min': 'código debe tener al menos 3 caracteres',
                    'string.max': 'código no puede exceder 50 caracteres',
                    'string.pattern.base': 'código solo puede contener letras, números, guiones y guiones bajos'
                }),

            nombre: Joi.string()
                .min(3)
                .max(200)
                .required()
                .messages({
                    'any.required': 'nombre es requerido',
                    'string.min': 'nombre debe tener al menos 3 caracteres',
                    'string.max': 'nombre no puede exceder 200 caracteres'
                }),

            descripcion: Joi.string().max(1000).optional().allow(null, ''),

            tipo_descuento: Joi.string()
                .valid('porcentaje', 'monto_fijo')
                .required()
                .messages({
                    'any.required': 'tipo_descuento es requerido',
                    'any.only': 'tipo_descuento debe ser "porcentaje" o "monto_fijo"'
                }),

            valor: Joi.number()
                .positive()
                .required()
                .messages({
                    'any.required': 'valor es requerido',
                    'number.positive': 'valor debe ser positivo'
                }),

            monto_minimo: Joi.number().min(0).optional().default(0),
            monto_maximo_descuento: Joi.number().min(0).optional().allow(null),

            fecha_inicio: Joi.date().iso().optional(),
            fecha_fin: Joi.date().iso().optional().allow(null),

            usos_maximos: Joi.number().integer().positive().optional().allow(null),
            usos_por_cliente: Joi.number().integer().positive().optional().default(1),

            solo_primera_compra: Joi.boolean().optional().default(false),
            categorias_ids: Joi.array().items(Joi.number().integer().positive()).optional().allow(null),
            productos_ids: Joi.array().items(Joi.number().integer().positive()).optional().allow(null),

            activo: Joi.boolean().optional().default(true)
        }).custom((value, helpers) => {
            // Validar que porcentaje no exceda 100
            if (value.tipo_descuento === 'porcentaje' && value.valor > 100) {
                return helpers.error('any.custom', {
                    message: 'Para descuento en porcentaje, el valor no puede exceder 100'
                });
            }
            // Validar fechas
            if (value.fecha_fin && value.fecha_inicio && value.fecha_fin < value.fecha_inicio) {
                return helpers.error('any.custom', {
                    message: 'fecha_fin debe ser posterior a fecha_inicio'
                });
            }
            return value;
        })
    },

    /**
     * Schema para actualizar cupón
     * PUT /api/v1/pos/cupones/:id
     */
    actualizarCupon: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),

        body: Joi.object({
            codigo: Joi.string()
                .min(3)
                .max(50)
                .pattern(/^[A-Z0-9_-]+$/i)
                .optional(),

            nombre: Joi.string().min(3).max(200).optional(),
            descripcion: Joi.string().max(1000).optional().allow(null, ''),

            tipo_descuento: Joi.string()
                .valid('porcentaje', 'monto_fijo')
                .optional(),

            valor: Joi.number().positive().optional(),

            monto_minimo: Joi.number().min(0).optional(),
            monto_maximo_descuento: Joi.number().min(0).optional().allow(null),

            fecha_inicio: Joi.date().iso().optional(),
            fecha_fin: Joi.date().iso().optional().allow(null),

            usos_maximos: Joi.number().integer().positive().optional().allow(null),
            usos_por_cliente: Joi.number().integer().positive().optional(),

            solo_primera_compra: Joi.boolean().optional(),
            categorias_ids: Joi.array().items(Joi.number().integer().positive()).optional().allow(null),
            productos_ids: Joi.array().items(Joi.number().integer().positive()).optional().allow(null),

            activo: Joi.boolean().optional()
        }).min(1)
    },

    /**
     * Schema para listar cupones
     * GET /api/v1/pos/cupones
     */
    listarCupones: {
        query: withPagination({
            busqueda: Joi.string().min(2).max(100).optional(),
            activo: Joi.string().valid('true', 'false').optional(),
            vigente: Joi.string().valid('true', 'false').optional(),
            ordenPor: Joi.string().valid('creado_en', 'codigo', 'nombre', 'fecha_inicio', 'fecha_fin', 'usos_actuales').optional(),
            orden: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').optional()
        })
    },

    /**
     * Schema para obtener cupón por ID
     * GET /api/v1/pos/cupones/:id
     */
    obtenerCupon: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    },

    /**
     * Schema para eliminar cupón
     * DELETE /api/v1/pos/cupones/:id
     */
    eliminarCupon: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    },

    /**
     * Schema para validar cupón (sin aplicar)
     * POST /api/v1/pos/cupones/validar
     */
    validarCupon: {
        body: Joi.object({
            codigo: Joi.string().max(50).required().messages({
                'any.required': 'código es requerido'
            }),

            subtotal: Joi.number().min(0).required().messages({
                'any.required': 'subtotal es requerido',
                'number.min': 'subtotal no puede ser negativo'
            }),

            cliente_id: Joi.number().integer().positive().optional().allow(null),
            productos_ids: Joi.array().items(Joi.number().integer().positive()).optional().allow(null)
        })
    },

    /**
     * Schema para aplicar cupón a una venta
     * POST /api/v1/pos/cupones/aplicar
     */
    aplicarCupon: {
        body: Joi.object({
            cupon_id: Joi.number().integer().positive().required().messages({
                'any.required': 'cupon_id es requerido'
            }),

            venta_pos_id: Joi.number().integer().positive().required().messages({
                'any.required': 'venta_pos_id es requerido'
            }),

            cliente_id: Joi.number().integer().positive().optional().allow(null),
            subtotal_antes: Joi.number().min(0).optional().allow(null)
        })
    },

    /**
     * Schema para obtener historial de uso de cupón
     * GET /api/v1/pos/cupones/:id/historial
     */
    historialCupon: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),
        query: Joi.object({
            limit: Joi.number().integer().min(1).max(100).optional().default(50),
            offset: Joi.number().integer().min(0).optional().default(0)
        })
    },

    /**
     * Schema para cambiar estado de cupón
     * PATCH /api/v1/pos/cupones/:id/estado
     */
    cambiarEstadoCupon: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            activo: Joi.boolean().required().messages({
                'any.required': 'activo es requerido'
            })
        })
    },

    // ========================================================================
    // PROMOCIONES AUTOMATICAS (Ene 2026 - Fase 3)
    // ========================================================================

    /**
     * Schema para crear promocion
     * POST /api/v1/pos/promociones
     */
    crearPromocion: {
        body: Joi.object({
            codigo: Joi.string()
                .min(3)
                .max(50)
                .pattern(/^[A-Z0-9_-]+$/i)
                .required()
                .messages({
                    'any.required': 'codigo es requerido',
                    'string.min': 'codigo debe tener al menos 3 caracteres',
                    'string.max': 'codigo no puede exceder 50 caracteres',
                    'string.pattern.base': 'codigo solo puede contener letras, numeros, guiones y guiones bajos'
                }),

            nombre: Joi.string()
                .min(3)
                .max(200)
                .required()
                .messages({
                    'any.required': 'nombre es requerido',
                    'string.min': 'nombre debe tener al menos 3 caracteres',
                    'string.max': 'nombre no puede exceder 200 caracteres'
                }),

            descripcion: Joi.string().max(1000).optional().allow(null, ''),

            tipo: Joi.string()
                .valid('cantidad', 'porcentaje', 'monto_fijo', 'precio_especial', 'regalo')
                .required()
                .messages({
                    'any.required': 'tipo es requerido',
                    'any.only': 'tipo debe ser: cantidad, porcentaje, monto_fijo, precio_especial o regalo'
                }),

            reglas: Joi.object().optional().default({}),

            valor_descuento: Joi.number().min(0).optional().allow(null),

            fecha_inicio: Joi.date().iso().optional(),
            fecha_fin: Joi.date().iso().optional().allow(null),
            hora_inicio: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).optional().allow(null),
            hora_fin: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).optional().allow(null),
            dias_semana: Joi.array().items(Joi.number().integer().min(0).max(6)).optional().allow(null),

            prioridad: Joi.number().integer().min(0).optional().default(0),
            exclusiva: Joi.boolean().optional().default(false),
            acumulable_cupones: Joi.boolean().optional().default(true),

            usos_maximos: Joi.number().integer().positive().optional().allow(null),
            usos_por_cliente: Joi.number().integer().positive().optional().allow(null),

            monto_minimo: Joi.number().min(0).optional().default(0),
            monto_maximo_descuento: Joi.number().min(0).optional().allow(null),
            solo_primera_compra: Joi.boolean().optional().default(false),
            sucursales_ids: Joi.array().items(Joi.number().integer().positive()).optional().allow(null),

            activo: Joi.boolean().optional().default(true)
        }).custom((value, helpers) => {
            // Validar que porcentaje no exceda 100
            if (value.tipo === 'porcentaje' && value.valor_descuento > 100) {
                return helpers.error('any.custom', {
                    message: 'Para descuento en porcentaje, el valor no puede exceder 100'
                });
            }
            // Validar fechas
            if (value.fecha_fin && value.fecha_inicio && value.fecha_fin < value.fecha_inicio) {
                return helpers.error('any.custom', {
                    message: 'fecha_fin debe ser posterior a fecha_inicio'
                });
            }
            return value;
        })
    },

    /**
     * Schema para actualizar promocion
     * PUT /api/v1/pos/promociones/:id
     */
    actualizarPromocion: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),

        body: Joi.object({
            codigo: Joi.string().min(3).max(50).pattern(/^[A-Z0-9_-]+$/i).optional(),
            nombre: Joi.string().min(3).max(200).optional(),
            descripcion: Joi.string().max(1000).optional().allow(null, ''),
            tipo: Joi.string().valid('cantidad', 'porcentaje', 'monto_fijo', 'precio_especial', 'regalo').optional(),
            reglas: Joi.object().optional(),
            valor_descuento: Joi.number().min(0).optional().allow(null),
            fecha_inicio: Joi.date().iso().optional(),
            fecha_fin: Joi.date().iso().optional().allow(null),
            hora_inicio: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).optional().allow(null),
            hora_fin: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).optional().allow(null),
            dias_semana: Joi.array().items(Joi.number().integer().min(0).max(6)).optional().allow(null),
            prioridad: Joi.number().integer().min(0).optional(),
            exclusiva: Joi.boolean().optional(),
            acumulable_cupones: Joi.boolean().optional(),
            usos_maximos: Joi.number().integer().positive().optional().allow(null),
            usos_por_cliente: Joi.number().integer().positive().optional().allow(null),
            monto_minimo: Joi.number().min(0).optional(),
            monto_maximo_descuento: Joi.number().min(0).optional().allow(null),
            solo_primera_compra: Joi.boolean().optional(),
            sucursales_ids: Joi.array().items(Joi.number().integer().positive()).optional().allow(null),
            activo: Joi.boolean().optional()
        }).min(1)
    },

    /**
     * Schema para listar promociones
     * GET /api/v1/pos/promociones
     */
    listarPromociones: {
        query: withPagination({
            busqueda: Joi.string().min(2).max(100).optional(),
            activo: Joi.string().valid('true', 'false').optional(),
            vigente: Joi.string().valid('true', 'false').optional(),
            tipo: Joi.string().valid('cantidad', 'porcentaje', 'monto_fijo', 'precio_especial', 'regalo').optional(),
            ordenPor: Joi.string().valid('prioridad', 'creado_en', 'codigo', 'nombre', 'fecha_inicio', 'fecha_fin', 'usos_actuales', 'tipo').optional(),
            orden: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').optional()
        })
    },

    /**
     * Schema para obtener promocion por ID
     * GET /api/v1/pos/promociones/:id
     */
    obtenerPromocion: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    },

    /**
     * Schema para eliminar promocion
     * DELETE /api/v1/pos/promociones/:id
     */
    eliminarPromocion: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    },

    /**
     * Schema para evaluar promociones del carrito
     * POST /api/v1/pos/promociones/evaluar
     */
    evaluarPromociones: {
        body: Joi.object({
            items: Joi.array()
                .min(1)
                .items(
                    Joi.object({
                        producto_id: Joi.number().integer().positive().required(),
                        categoria_id: Joi.number().integer().positive().optional().allow(null),
                        cantidad: Joi.number().integer().min(1).required(),
                        precio_unitario: Joi.number().min(0).required()
                    })
                )
                .required()
                .messages({
                    'any.required': 'items es requerido',
                    'array.min': 'Debe incluir al menos 1 item'
                }),

            subtotal: Joi.number().min(0).required().messages({
                'any.required': 'subtotal es requerido'
            }),

            cliente_id: Joi.number().integer().positive().optional().allow(null),
            sucursal_id: Joi.number().integer().positive().optional().allow(null)
        })
    },

    /**
     * Schema para aplicar promocion a una venta
     * POST /api/v1/pos/promociones/aplicar
     */
    aplicarPromocion: {
        body: Joi.object({
            promocion_id: Joi.number().integer().positive().required().messages({
                'any.required': 'promocion_id es requerido'
            }),

            venta_pos_id: Joi.number().integer().positive().required().messages({
                'any.required': 'venta_pos_id es requerido'
            }),

            cliente_id: Joi.number().integer().positive().optional().allow(null),
            descuento_total: Joi.number().min(0).required().messages({
                'any.required': 'descuento_total es requerido'
            }),
            productos_aplicados: Joi.array().items(Joi.object()).optional().allow(null)
        })
    },

    /**
     * Schema para obtener historial de uso de promocion
     * GET /api/v1/pos/promociones/:id/historial
     */
    historialPromocion: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),
        query: Joi.object({
            limit: Joi.number().integer().min(1).max(100).optional().default(50),
            offset: Joi.number().integer().min(0).optional().default(0)
        })
    },

    /**
     * Schema para cambiar estado de promocion
     * PATCH /api/v1/pos/promociones/:id/estado
     */
    cambiarEstadoPromocion: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            activo: Joi.boolean().required().messages({
                'any.required': 'activo es requerido'
            })
        })
    },

    /**
     * Schema para duplicar promocion
     * POST /api/v1/pos/promociones/:id/duplicar
     */
    duplicarPromocion: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    },

    /**
     * Schema para listar promociones vigentes
     * GET /api/v1/pos/promociones/vigentes
     */
    listarPromocionesVigentes: {
        query: Joi.object({
            sucursal_id: Joi.number().integer().positive().optional()
        })
    },

    // ========================================================================
    // PROGRAMA DE LEALTAD (Ene 2026 - Fase 3)
    // ========================================================================

    /**
     * Schema para guardar configuración de lealtad
     * PUT /api/v1/pos/lealtad/configuracion
     */
    configuracionLealtad: {
        body: Joi.object({
            activo: Joi.boolean().optional().default(true),

            puntos_por_peso: Joi.number().min(0).optional().default(1).messages({
                'number.min': 'puntos_por_peso no puede ser negativo'
            }),

            puntos_por_peso_descuento: Joi.number().min(0.01).optional().default(100).messages({
                'number.min': 'puntos_por_peso_descuento debe ser mayor a 0'
            }),

            meses_expiracion: Joi.number().integer().min(1).max(60).optional().default(12).messages({
                'number.min': 'meses_expiracion debe ser al menos 1',
                'number.max': 'meses_expiracion no puede exceder 60'
            }),

            minimo_puntos_canje: Joi.number().integer().min(0).optional().default(100).messages({
                'number.min': 'minimo_puntos_canje no puede ser negativo'
            }),

            maximo_porcentaje_descuento: Joi.number().min(1).max(100).optional().default(50).messages({
                'number.min': 'maximo_porcentaje_descuento debe ser al menos 1',
                'number.max': 'maximo_porcentaje_descuento no puede exceder 100'
            }),

            puntos_por_registro: Joi.number().integer().min(0).optional().default(0).messages({
                'number.min': 'puntos_por_registro no puede ser negativo'
            }),

            puntos_cumpleanos: Joi.number().integer().min(0).optional().default(0).messages({
                'number.min': 'puntos_cumpleanos no puede ser negativo'
            }),

            acumular_con_cupon: Joi.boolean().optional().default(false),
            redondeo: Joi.string().valid('floor', 'ceil', 'round').optional().default('floor')
        })
    },

    /**
     * Schema para crear nivel de lealtad
     * POST /api/v1/pos/lealtad/niveles
     */
    crearNivelLealtad: {
        body: Joi.object({
            nombre: Joi.string()
                .min(2)
                .max(50)
                .required()
                .messages({
                    'any.required': 'nombre es requerido',
                    'string.min': 'nombre debe tener al menos 2 caracteres',
                    'string.max': 'nombre no puede exceder 50 caracteres'
                }),

            codigo: Joi.string()
                .min(2)
                .max(20)
                .pattern(/^[A-Z0-9_]+$/i)
                .required()
                .messages({
                    'any.required': 'codigo es requerido',
                    'string.pattern.base': 'codigo solo puede contener letras, numeros y guion bajo'
                }),

            color: fields.colorHex.optional().default('#6B7280'),

            icono: Joi.string().max(50).optional().allow(null, ''),

            puntos_minimos: Joi.number().integer().min(0).required().messages({
                'any.required': 'puntos_minimos es requerido',
                'number.min': 'puntos_minimos no puede ser negativo'
            }),

            puntos_maximos: Joi.number().integer().min(0).optional().allow(null).messages({
                'number.min': 'puntos_maximos no puede ser negativo'
            }),

            multiplicador_puntos: Joi.number().min(1).max(10).optional().default(1).messages({
                'number.min': 'multiplicador_puntos debe ser al menos 1',
                'number.max': 'multiplicador_puntos no puede exceder 10'
            }),

            beneficios: Joi.object().optional().default({}),
            orden: Joi.number().integer().min(0).optional().default(0),
            activo: Joi.boolean().optional().default(true)
        }).custom((value, helpers) => {
            // Validar que puntos_maximos >= puntos_minimos si está definido
            if (value.puntos_maximos !== null && value.puntos_maximos !== undefined) {
                if (value.puntos_maximos < value.puntos_minimos) {
                    return helpers.error('any.custom', {
                        message: 'puntos_maximos debe ser mayor o igual a puntos_minimos'
                    });
                }
            }
            return value;
        })
    },

    /**
     * Schema para actualizar nivel de lealtad
     * PUT /api/v1/pos/lealtad/niveles/:id
     */
    actualizarNivelLealtad: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),

        body: Joi.object({
            nombre: Joi.string().min(2).max(50).optional(),
            codigo: Joi.string().min(2).max(20).pattern(/^[A-Z0-9_]+$/i).optional(),
            color: fields.colorHex.optional(),
            icono: Joi.string().max(50).optional().allow(null, ''),
            puntos_minimos: Joi.number().integer().min(0).optional(),
            puntos_maximos: Joi.number().integer().min(0).optional().allow(null),
            multiplicador_puntos: Joi.number().min(1).max(10).optional(),
            beneficios: Joi.object().optional(),
            orden: Joi.number().integer().min(0).optional(),
            activo: Joi.boolean().optional()
        }).min(1)
    },

    /**
     * Schema para eliminar nivel de lealtad
     * DELETE /api/v1/pos/lealtad/niveles/:id
     */
    eliminarNivelLealtad: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    },

    /**
     * Schema para obtener puntos de un cliente
     * GET /api/v1/pos/lealtad/clientes/:clienteId/puntos
     */
    obtenerPuntosCliente: {
        params: Joi.object({
            clienteId: Joi.number().integer().positive().required()
        })
    },

    /**
     * Schema para historial de puntos
     * GET /api/v1/pos/lealtad/clientes/:clienteId/historial
     */
    historialPuntos: {
        params: Joi.object({
            clienteId: Joi.number().integer().positive().required()
        }),
        query: Joi.object({
            limit: Joi.number().integer().min(1).max(100).optional().default(50),
            offset: Joi.number().integer().min(0).optional().default(0),
            tipo: Joi.string().valid('acumulacion', 'canje', 'ajuste', 'expiracion', 'registro', 'cumpleanos').optional(),
            fecha_desde: Joi.string().isoDate().optional(),
            fecha_hasta: Joi.string().isoDate().optional()
        })
    },

    /**
     * Schema para listar clientes con puntos
     * GET /api/v1/pos/lealtad/clientes
     */
    listarClientesPuntos: {
        query: Joi.object({
            limit: Joi.number().integer().min(1).max(100).optional().default(50),
            offset: Joi.number().integer().min(0).optional().default(0),
            busqueda: Joi.string().min(2).max(100).optional(),
            nivel_id: Joi.number().integer().positive().optional(),
            orden: Joi.string().valid('puntos_asc', 'puntos_desc', 'nombre_asc', 'nombre_desc').optional().default('puntos_desc')
        })
    },

    /**
     * Schema para calcular puntos que ganaría una venta (preview)
     * POST /api/v1/pos/lealtad/calcular
     */
    calcularPuntosVenta: {
        body: Joi.object({
            cliente_id: Joi.number().integer().positive().optional().allow(null),
            monto: Joi.number().min(0).required().messages({
                'any.required': 'monto es requerido',
                'number.min': 'monto no puede ser negativo'
            }),
            tiene_cupon: Joi.boolean().optional().default(false)
        })
    },

    /**
     * Schema para validar canje de puntos (preview)
     * POST /api/v1/pos/lealtad/validar-canje
     */
    validarCanjePuntos: {
        body: Joi.object({
            cliente_id: Joi.number().integer().positive().required().messages({
                'any.required': 'cliente_id es requerido'
            }),
            puntos: Joi.number().integer().positive().required().messages({
                'any.required': 'puntos es requerido',
                'number.positive': 'puntos debe ser mayor a 0'
            }),
            total_venta: Joi.number().min(0).required().messages({
                'any.required': 'total_venta es requerido'
            })
        })
    },

    /**
     * Schema para canjear puntos por descuento
     * POST /api/v1/pos/lealtad/canjear
     */
    canjearPuntos: {
        body: Joi.object({
            cliente_id: Joi.number().integer().positive().required().messages({
                'any.required': 'cliente_id es requerido'
            }),
            venta_id: Joi.number().integer().positive().optional().allow(null),
            puntos: Joi.number().integer().positive().required().messages({
                'any.required': 'puntos es requerido',
                'number.positive': 'puntos debe ser mayor a 0'
            }),
            descuento: Joi.number().min(0.01).required().messages({
                'any.required': 'descuento es requerido',
                'number.min': 'descuento debe ser mayor a 0'
            }),
            descripcion: Joi.string().max(500).optional().allow(null, '')
        })
    },

    /**
     * Schema para acumular puntos por una venta
     * POST /api/v1/pos/lealtad/acumular
     */
    acumularPuntos: {
        body: Joi.object({
            cliente_id: Joi.number().integer().positive().required().messages({
                'any.required': 'cliente_id es requerido'
            }),
            venta_id: Joi.number().integer().positive().required().messages({
                'any.required': 'venta_id es requerido'
            }),
            monto: Joi.number().min(0).required().messages({
                'any.required': 'monto es requerido'
            }),
            descripcion: Joi.string().max(500).optional().allow(null, '')
        })
    },

    /**
     * Schema para ajuste manual de puntos (admin)
     * POST /api/v1/pos/lealtad/ajustar
     */
    ajustarPuntos: {
        body: Joi.object({
            cliente_id: Joi.number().integer().positive().required().messages({
                'any.required': 'cliente_id es requerido'
            }),
            puntos: Joi.number().integer().required().messages({
                'any.required': 'puntos es requerido'
            }),
            motivo: Joi.string().min(3).max(500).required().messages({
                'any.required': 'motivo es requerido',
                'string.min': 'motivo debe tener al menos 3 caracteres'
            })
        })
    },

    /**
     * Schema para obtener estadísticas del programa
     * GET /api/v1/pos/lealtad/estadisticas
     */
    estadisticasLealtad: {
        query: Joi.object({
            fecha_desde: Joi.string().isoDate().optional(),
            fecha_hasta: Joi.string().isoDate().optional()
        })
    },

    // ========================================================================
    // COMBOS / PAQUETES (Ene 2026 - Fase 3)
    // ========================================================================

    /**
     * Schema para crear combo
     * POST /api/v1/pos/combos
     */
    crearCombo: {
        body: Joi.object({
            producto_id: Joi.number().integer().positive().required().messages({
                'any.required': 'producto_id es requerido'
            }),

            tipo_precio: Joi.string()
                .valid('fijo', 'suma_componentes', 'descuento_porcentaje')
                .optional()
                .default('fijo'),

            descuento_porcentaje: Joi.number()
                .min(0)
                .max(100)
                .optional()
                .default(0),

            manejo_stock: Joi.string()
                .valid('descontar_componentes', 'descontar_combo')
                .optional()
                .default('descontar_componentes'),

            componentes: Joi.array()
                .min(1)
                .items(
                    Joi.object({
                        producto_id: Joi.number().integer().positive().required(),
                        cantidad: Joi.number().integer().min(1).optional().default(1),
                        precio_unitario: Joi.number().min(0).optional().allow(null)
                    })
                )
                .required()
                .messages({
                    'any.required': 'componentes es requerido',
                    'array.min': 'Debe incluir al menos 1 componente'
                }),

            // Para verificación de permisos
            sucursal_id: Joi.number().integer().positive().optional()
        })
    },

    /**
     * Schema para actualizar combo
     * PUT /api/v1/pos/combos/:productoId
     */
    actualizarCombo: {
        params: Joi.object({
            productoId: Joi.number().integer().positive().required()
        }),

        body: Joi.object({
            tipo_precio: Joi.string()
                .valid('fijo', 'suma_componentes', 'descuento_porcentaje')
                .optional(),

            descuento_porcentaje: Joi.number().min(0).max(100).optional(),

            manejo_stock: Joi.string()
                .valid('descontar_componentes', 'descontar_combo')
                .optional(),

            activo: Joi.boolean().optional(),

            componentes: Joi.array()
                .min(1)
                .items(
                    Joi.object({
                        producto_id: Joi.number().integer().positive().required(),
                        cantidad: Joi.number().integer().min(1).optional().default(1),
                        precio_unitario: Joi.number().min(0).optional().allow(null)
                    })
                )
                .optional(),

            // Para verificación de permisos
            sucursal_id: Joi.number().integer().positive().optional()
        }).min(1)
    },

    // ========================================================================
    // MODIFICADORES (Ene 2026 - Fase 3)
    // ========================================================================

    /**
     * Schema para crear grupo de modificadores
     * POST /api/v1/pos/modificadores/grupos
     */
    crearGrupoModificadores: {
        body: Joi.object({
            nombre: Joi.string()
                .min(2)
                .max(100)
                .required()
                .messages({
                    'any.required': 'nombre es requerido',
                    'string.min': 'nombre debe tener al menos 2 caracteres'
                }),

            codigo: Joi.string()
                .max(50)
                .pattern(/^[A-Z0-9_-]+$/i)
                .optional(),

            descripcion: Joi.string().max(500).optional().allow(null, ''),

            tipo_seleccion: Joi.string()
                .valid('unico', 'multiple')
                .optional()
                .default('unico'),

            requerido: Joi.boolean().optional().default(false),
            minimo_seleccion: Joi.number().integer().min(0).optional().default(0),
            maximo_seleccion: Joi.number().integer().min(1).optional().allow(null),
            orden: Joi.number().integer().min(0).optional().default(0),

            modificadores: Joi.array()
                .items(
                    Joi.object({
                        nombre: Joi.string().min(1).max(100).required(),
                        codigo: Joi.string().max(50).optional(),
                        prefijo: Joi.string().max(20).optional().allow(null),
                        precio_adicional: Joi.number().optional().default(0),
                        es_default: Joi.boolean().optional().default(false)
                    })
                )
                .optional()
        })
    },

    /**
     * Schema para actualizar grupo de modificadores
     * PUT /api/v1/pos/modificadores/grupos/:id
     */
    actualizarGrupoModificadores: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),

        body: Joi.object({
            nombre: Joi.string().min(2).max(100).optional(),
            codigo: Joi.string().max(50).pattern(/^[A-Z0-9_-]+$/i).optional(),
            descripcion: Joi.string().max(500).optional().allow(null, ''),
            tipo_seleccion: Joi.string().valid('unico', 'multiple').optional(),
            requerido: Joi.boolean().optional(),
            minimo_seleccion: Joi.number().integer().min(0).optional(),
            maximo_seleccion: Joi.number().integer().min(1).optional().allow(null),
            orden: Joi.number().integer().min(0).optional(),
            activo: Joi.boolean().optional()
        }).min(1)
    },

    /**
     * Schema para crear modificador
     * POST /api/v1/pos/modificadores
     */
    crearModificador: {
        body: Joi.object({
            grupo_id: Joi.number().integer().positive().required().messages({
                'any.required': 'grupo_id es requerido'
            }),

            nombre: Joi.string()
                .min(1)
                .max(100)
                .required()
                .messages({
                    'any.required': 'nombre es requerido'
                }),

            codigo: Joi.string().max(50).optional(),
            descripcion: Joi.string().max(500).optional().allow(null, ''),
            prefijo: Joi.string().max(20).optional().allow(null),
            precio_adicional: Joi.number().optional().default(0),
            producto_id: Joi.number().integer().positive().optional().allow(null),
            es_default: Joi.boolean().optional().default(false),
            orden: Joi.number().integer().min(0).optional().default(0)
        })
    },

    /**
     * Schema para actualizar modificador
     * PUT /api/v1/pos/modificadores/:id
     */
    actualizarModificador: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),

        body: Joi.object({
            nombre: Joi.string().min(1).max(100).optional(),
            codigo: Joi.string().max(50).optional(),
            descripcion: Joi.string().max(500).optional().allow(null, ''),
            prefijo: Joi.string().max(20).optional().allow(null),
            precio_adicional: Joi.number().optional(),
            producto_id: Joi.number().integer().positive().optional().allow(null),
            es_default: Joi.boolean().optional(),
            orden: Joi.number().integer().min(0).optional(),
            activo: Joi.boolean().optional()
        }).min(1)
    },

    /**
     * Schema para asignar grupo a producto/categoría
     * POST /api/v1/pos/productos/:productoId/grupos
     * POST /api/v1/pos/categorias/:categoriaId/grupos
     */
    asignarGrupo: {
        body: Joi.object({
            grupo_id: Joi.number().integer().positive().required().messages({
                'any.required': 'grupo_id es requerido'
            }),
            requerido: Joi.boolean().optional().allow(null),
            orden: Joi.number().integer().min(0).optional().default(0)
        })
    }
};

module.exports = posSchemas;
