/**
 * Schemas de validación - Órdenes de Compra
 * @module inventario/schemas/ordenes-compra.schemas
 */

const Joi = require('joi');
const { withPagination, idOptional, estadoOrdenCompra } = require('../../../schemas/shared');

const ordenesCompraSchemas = {
    /**
     * Schema para crear orden de compra
     * POST /api/v1/inventario/ordenes-compra
     */
    crearOrdenCompra: {
        body: Joi.object({
            proveedor_id: Joi.number().integer().positive().required().messages({
                'any.required': 'El proveedor_id es requerido',
                'number.positive': 'proveedor_id debe ser un número positivo'
            }),

            fecha_entrega_esperada: Joi.string().isoDate().optional().allow(null),

            descuento_porcentaje: Joi.number().min(0).max(100).optional().default(0),
            descuento_monto: Joi.number().min(0).optional().default(0),
            impuestos: Joi.number().min(0).optional().default(0),
            dias_credito: Joi.number().integer().min(0).optional(),

            notas: Joi.string().max(1000).optional().allow(null, ''),
            referencia_proveedor: Joi.string().max(100).optional().allow(null, ''),

            // Items opcionales al crear
            items: Joi.array().items(
                Joi.object({
                    producto_id: Joi.number().integer().positive().required(),
                    cantidad_ordenada: Joi.number().integer().min(1).required(),
                    precio_unitario: Joi.number().min(0).optional(),
                    fecha_vencimiento: Joi.string().isoDate().optional().allow(null),
                    notas: Joi.string().max(500).optional().allow(null, '')
                })
            ).optional().max(100)
        }).custom((value, helpers) => {
            // Solo un tipo de descuento
            if (value.descuento_porcentaje > 0 && value.descuento_monto > 0) {
                return helpers.error('any.custom', {
                    message: 'Solo puede especificar descuento_porcentaje O descuento_monto, no ambos'
                });
            }
            return value;
        })
    },

    /**
     * Schema para actualizar orden de compra
     * PUT /api/v1/inventario/ordenes-compra/:id
     */
    actualizarOrdenCompra: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),

        body: Joi.object({
            proveedor_id: Joi.number().integer().positive().optional(),
            fecha_entrega_esperada: Joi.string().isoDate().optional().allow(null),
            descuento_porcentaje: Joi.number().min(0).max(100).optional(),
            descuento_monto: Joi.number().min(0).optional(),
            impuestos: Joi.number().min(0).optional(),
            dias_credito: Joi.number().integer().min(0).optional(),
            notas: Joi.string().max(1000).optional().allow(null, ''),
            referencia_proveedor: Joi.string().max(100).optional().allow(null, '')
        }).min(1)
    },

    /**
     * Schema para listar órdenes de compra
     * GET /api/v1/inventario/ordenes-compra
     */
    listarOrdenesCompra: {
        query: withPagination({
            proveedor_id: idOptional,
            estado: estadoOrdenCompra.optional(),
            estado_pago: Joi.string().valid('pendiente', 'parcial', 'pagado').optional(),
            fecha_desde: Joi.string().isoDate().optional(),
            fecha_hasta: Joi.string().isoDate().optional(),
            folio: Joi.string().max(20).optional()
        })
    },

    /**
     * Schema para agregar items a orden
     * POST /api/v1/inventario/ordenes-compra/:id/items
     */
    agregarItemsOrdenCompra: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),

        body: Joi.object({
            items: Joi.array().items(
                Joi.object({
                    producto_id: Joi.number().integer().positive().required().messages({
                        'any.required': 'producto_id es requerido'
                    }),
                    cantidad_ordenada: Joi.number().integer().min(1).required().messages({
                        'any.required': 'cantidad_ordenada es requerida',
                        'number.min': 'cantidad_ordenada debe ser al menos 1'
                    }),
                    precio_unitario: Joi.number().min(0).optional(),
                    fecha_vencimiento: Joi.string().isoDate().optional().allow(null),
                    notas: Joi.string().max(500).optional().allow(null, '')
                })
            ).min(1).max(100).required().messages({
                'any.required': 'Debe incluir al menos un item',
                'array.min': 'Debe incluir al menos un item',
                'array.max': 'No puede agregar más de 100 items a la vez'
            })
        })
    },

    /**
     * Schema para actualizar item de orden
     * PUT /api/v1/inventario/ordenes-compra/:id/items/:itemId
     */
    actualizarItemOrdenCompra: {
        params: Joi.object({
            id: Joi.number().integer().positive().required(),
            itemId: Joi.number().integer().positive().required()
        }),

        body: Joi.object({
            cantidad_ordenada: Joi.number().integer().min(1).optional(),
            precio_unitario: Joi.number().min(0).optional(),
            fecha_vencimiento: Joi.string().isoDate().optional().allow(null),
            notas: Joi.string().max(500).optional().allow(null, '')
        }).min(1)
    },

    /**
     * Schema para eliminar item de orden
     * DELETE /api/v1/inventario/ordenes-compra/:id/items/:itemId
     */
    eliminarItemOrdenCompra: {
        params: Joi.object({
            id: Joi.number().integer().positive().required(),
            itemId: Joi.number().integer().positive().required()
        })
    },

    /**
     * Schema para enviar orden
     * PATCH /api/v1/inventario/ordenes-compra/:id/enviar
     */
    enviarOrdenCompra: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    },

    /**
     * Schema para cancelar orden
     * PATCH /api/v1/inventario/ordenes-compra/:id/cancelar
     */
    cancelarOrdenCompra: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),

        body: Joi.object({
            motivo: Joi.string().max(500).optional().allow(null, '')
        })
    },

    /**
     * Schema para recibir mercancía
     * POST /api/v1/inventario/ordenes-compra/:id/recibir
     */
    recibirMercanciaOrdenCompra: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),

        body: Joi.object({
            recepciones: Joi.array().items(
                Joi.object({
                    item_id: Joi.number().integer().positive().required().messages({
                        'any.required': 'item_id es requerido'
                    }),
                    producto_id: Joi.number().integer().positive().optional(),
                    cantidad: Joi.number().integer().min(1).required().messages({
                        'any.required': 'cantidad es requerida',
                        'number.min': 'cantidad debe ser al menos 1'
                    }),
                    precio_unitario_real: Joi.number().min(0).optional(),
                    fecha_vencimiento: Joi.string().isoDate().optional().allow(null),
                    lote: Joi.string().max(50).optional().allow(null, ''),
                    notas: Joi.string().max(500).optional().allow(null, ''),
                    // Números de serie para productos que lo requieren (Dic 2025 - INV-5)
                    numeros_serie: Joi.array().items(
                        Joi.object({
                            numero_serie: Joi.string().max(100).required().messages({
                                'any.required': 'El número de serie es requerido'
                            }),
                            lote: Joi.string().max(50).optional().allow(null, ''),
                            fecha_vencimiento: Joi.string().isoDate().optional().allow(null)
                        })
                    ).optional()
                })
            ).min(1).max(100).required().messages({
                'any.required': 'Debe incluir al menos una recepción',
                'array.min': 'Debe incluir al menos una recepción'
            })
        })
    },

    /**
     * Schema para registrar pago
     * POST /api/v1/inventario/ordenes-compra/:id/pago
     */
    registrarPagoOrdenCompra: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),

        body: Joi.object({
            monto: Joi.number().positive().required().messages({
                'any.required': 'El monto es requerido',
                'number.positive': 'El monto debe ser mayor a 0'
            })
        })
    },

    /**
     * Schema para estadísticas por proveedor
     * GET /api/v1/inventario/ordenes-compra/reportes/por-proveedor
     */
    estadisticasComprasPorProveedor: {
        query: Joi.object({
            fecha_desde: Joi.string().isoDate().optional(),
            fecha_hasta: Joi.string().isoDate().optional()
        })
    },

    /**
     * Schema para obtener orden por ID
     * GET /api/v1/inventario/ordenes-compra/:id
     */
    obtenerOrdenCompraPorId: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    },

    /**
     * Schema para generar OC desde producto
     * POST /api/v1/inventario/ordenes-compra/generar-desde-producto/:productoId
     */
    generarOCDesdeProducto: {
        params: Joi.object({
            productoId: Joi.number().integer().positive().required().messages({
                'any.required': 'El productoId es requerido',
                'number.positive': 'productoId debe ser un número positivo'
            })
        })
    }
};

module.exports = ordenesCompraSchemas;
