/**
 * Schemas de validación - Inventario en Consignación
 * @module inventario/schemas/consigna.schemas
 */

const Joi = require('joi');

const consignaSchemas = {
    /**
     * Schema para crear acuerdo de consignacion
     * POST /api/v1/inventario/consigna/acuerdos
     */
    crearAcuerdoConsigna: {
        body: Joi.object({
            proveedor_id: Joi.number().integer().positive().required().messages({
                'any.required': 'El proveedor es requerido',
                'number.positive': 'El ID de proveedor debe ser positivo'
            }),
            porcentaje_comision: Joi.number().min(0).max(100).precision(2).required().messages({
                'any.required': 'El porcentaje de comision es requerido',
                'number.min': 'El porcentaje no puede ser negativo',
                'number.max': 'El porcentaje no puede ser mayor a 100'
            }),
            dias_liquidacion: Joi.number().integer().min(1).max(365).default(30).messages({
                'number.min': 'Los dias de liquidacion deben ser al menos 1'
            }),
            dias_devolucion: Joi.number().integer().min(1).max(365).default(90).messages({
                'number.min': 'Los dias de devolucion deben ser al menos 1'
            }),
            sucursal_id: Joi.number().integer().positive().optional().allow(null),
            ubicacion_consigna_id: Joi.number().integer().positive().optional().allow(null),
            fecha_inicio: Joi.date().iso().optional(),
            fecha_fin: Joi.date().iso().greater(Joi.ref('fecha_inicio')).optional().allow(null).messages({
                'date.greater': 'La fecha fin debe ser posterior a la fecha inicio'
            }),
            notas: Joi.string().max(1000).optional().allow(null, '')
        })
    },

    /**
     * Schema para actualizar acuerdo de consignacion
     * PUT /api/v1/inventario/consigna/acuerdos/:id
     */
    actualizarAcuerdoConsigna: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            porcentaje_comision: Joi.number().min(0).max(100).precision(2).optional(),
            dias_liquidacion: Joi.number().integer().min(1).max(365).optional(),
            dias_devolucion: Joi.number().integer().min(1).max(365).optional(),
            sucursal_id: Joi.number().integer().positive().optional().allow(null),
            ubicacion_consigna_id: Joi.number().integer().positive().optional().allow(null),
            fecha_fin: Joi.date().iso().optional().allow(null),
            notas: Joi.string().max(1000).optional().allow(null, '')
        }).min(1).messages({
            'object.min': 'Debe proporcionar al menos un campo para actualizar'
        })
    },

    /**
     * Schema para agregar producto al acuerdo de consignacion
     * POST /api/v1/inventario/consigna/acuerdos/:id/productos
     */
    agregarProductoConsigna: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            producto_id: Joi.number().integer().positive().required().messages({
                'any.required': 'El producto es requerido',
                'number.positive': 'El ID de producto debe ser positivo'
            }),
            variante_id: Joi.number().integer().positive().optional().allow(null),
            precio_consigna: Joi.number().positive().precision(2).required().messages({
                'any.required': 'El precio de consigna es requerido',
                'number.positive': 'El precio debe ser mayor a 0'
            }),
            precio_venta_sugerido: Joi.number().positive().precision(2).optional().allow(null),
            cantidad_minima: Joi.number().integer().min(0).default(0),
            cantidad_maxima: Joi.number().integer().positive().optional().allow(null)
        })
    },

    /**
     * Schema para actualizar producto del acuerdo
     * PUT /api/v1/inventario/consigna/acuerdos/:id/productos/:productoId
     */
    actualizarProductoConsigna: {
        params: Joi.object({
            id: Joi.number().integer().positive().required(),
            productoId: Joi.number().integer().positive().required()
        }),
        query: Joi.object({
            variante_id: Joi.number().integer().positive().optional().allow(null)
        }),
        body: Joi.object({
            precio_consigna: Joi.number().positive().precision(2).optional(),
            precio_venta_sugerido: Joi.number().positive().precision(2).optional().allow(null),
            cantidad_minima: Joi.number().integer().min(0).optional(),
            cantidad_maxima: Joi.number().integer().positive().optional().allow(null),
            activo: Joi.boolean().optional()
        }).min(1)
    },

    /**
     * Schema para recibir mercancia en consignacion
     * POST /api/v1/inventario/consigna/acuerdos/:id/recibir
     */
    recibirMercanciaConsigna: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            items: Joi.array().items(Joi.object({
                producto_id: Joi.number().integer().positive().required().messages({
                    'any.required': 'El producto es requerido'
                }),
                variante_id: Joi.number().integer().positive().optional().allow(null),
                cantidad: Joi.number().integer().positive().required().messages({
                    'any.required': 'La cantidad es requerida',
                    'number.positive': 'La cantidad debe ser mayor a 0'
                }),
                numero_serie_id: Joi.number().integer().positive().optional().allow(null),
                lote: Joi.string().max(50).optional().allow(null, ''),
                ubicacion_id: Joi.number().integer().positive().optional().allow(null),
                notas: Joi.string().max(500).optional().allow(null, ''),
                // Numeros de serie para productos que lo requieren (31 Dic 2025)
                numeros_serie: Joi.array().items(Joi.object({
                    numero_serie: Joi.string().max(100).required().messages({
                        'any.required': 'El numero de serie es requerido'
                    }),
                    lote: Joi.string().max(50).optional().allow(null, ''),
                    fecha_vencimiento: Joi.string().isoDate().optional().allow(null)
                })).optional()
            })).min(1).required().messages({
                'any.required': 'Debe incluir al menos un item',
                'array.min': 'Debe incluir al menos un item'
            }),
            notas: Joi.string().max(500).optional().allow(null, '')
        })
    },

    /**
     * Schema para devolver mercancia en consignacion
     * POST /api/v1/inventario/consigna/acuerdos/:id/devolver
     */
    devolverMercanciaConsigna: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            items: Joi.array().items(Joi.object({
                producto_id: Joi.number().integer().positive().required(),
                variante_id: Joi.number().integer().positive().optional().allow(null),
                cantidad: Joi.number().integer().positive().required(),
                sucursal_id: Joi.number().integer().positive().optional().allow(null),
                numero_serie_id: Joi.number().integer().positive().optional().allow(null),
                lote: Joi.string().max(50).optional().allow(null, ''),
                notas: Joi.string().max(500).optional().allow(null, '')
            })).min(1).required()
        })
    },

    /**
     * Schema para ajustar stock consigna
     * POST /api/v1/inventario/consigna/stock/:id/ajuste
     */
    ajustarStockConsigna: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            cantidad: Joi.number().integer().required().messages({
                'any.required': 'La cantidad de ajuste es requerida'
            }),
            motivo: Joi.string().max(500).required().messages({
                'any.required': 'El motivo del ajuste es requerido'
            })
        })
    },

    /**
     * Schema para generar liquidacion
     * POST /api/v1/inventario/consigna/liquidaciones
     */
    generarLiquidacion: {
        body: Joi.object({
            acuerdo_id: Joi.number().integer().positive().required().messages({
                'any.required': 'El acuerdo es requerido'
            }),
            fecha_desde: Joi.date().iso().required().messages({
                'any.required': 'La fecha desde es requerida'
            }),
            fecha_hasta: Joi.date().iso().required().messages({
                'any.required': 'La fecha hasta es requerida'
            })
        })
    },

    /**
     * Schema para pagar liquidacion
     * POST /api/v1/inventario/consigna/liquidaciones/:id/pagar
     */
    pagarLiquidacion: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            fecha_pago: Joi.date().iso().optional(),
            metodo_pago: Joi.string().max(50).optional().allow(null, ''),
            referencia_pago: Joi.string().max(100).optional().allow(null, '')
        })
    }
};

module.exports = consignaSchemas;
