/**
 * Schemas de validación - Productos
 * @module inventario/schemas/productos.schemas
 */

const Joi = require('joi');
const { precioMonedaSchema } = require('./shared.schemas');
const { withPagination, idOptional } = require('../../../schemas/shared');

const productosSchemas = {
    /**
     * Schema para crear producto
     * POST /api/v1/inventario/productos
     */
    crearProducto: {
        body: Joi.object({
            nombre: Joi.string().max(200).required().messages({
                'any.required': 'El nombre es requerido',
                'string.max': 'El nombre no puede exceder 200 caracteres'
            }),

            descripcion: Joi.string().max(1000).optional().allow(null, ''),

            sku: Joi.string().max(50).optional().allow(null, ''),

            codigo_barras: Joi.string().max(50).optional().allow(null, '').regex(/^[0-9]{8,13}$/).messages({
                'string.pattern.base': 'Código de barras inválido (formato EAN8/EAN13 esperado: 8-13 dígitos)'
            }),

            categoria_id: Joi.number().integer().positive().optional().allow(null),
            proveedor_id: Joi.number().integer().positive().optional().allow(null),

            precio_compra: Joi.number().min(0).optional().default(0),
            precio_venta: Joi.number().min(0.01).required().messages({
                'any.required': 'El precio_venta es requerido',
                'number.min': 'El precio_venta debe ser mayor a 0'
            }),
            // Dic 2025: precio_mayoreo eliminado, usar listas_precios

            stock_actual: Joi.number().integer().min(0).optional().default(0),
            stock_minimo: Joi.number().integer().min(0).optional().default(5),
            stock_maximo: Joi.number().integer().min(1).optional().default(100),

            unidad_medida: Joi.string().max(20).optional().default('unidad'),
            alerta_stock_minimo: Joi.boolean().optional().default(true),

            es_perecedero: Joi.boolean().optional().default(false),
            dias_vida_util: Joi.number().integer().min(1).optional().allow(null),

            permite_venta: Joi.boolean().optional().default(true),
            permite_uso_servicio: Joi.boolean().optional().default(true),

            notas: Joi.string().max(500).optional().allow(null, ''),
            imagen_url: Joi.string().uri().max(500).optional().allow(null, ''),
            activo: Joi.boolean().optional().default(true),

            // Dic 2025: Números de serie / Lotes
            requiere_numero_serie: Joi.boolean().optional().default(false),

            // Dic 2025: Variantes de producto
            tiene_variantes: Joi.boolean().optional().default(false),

            // Dic 2025: Dropshipping - Fase 1 Gaps
            ruta_preferida: Joi.string().valid('normal', 'dropship', 'fabricar').optional().default('normal'),

            // Dic 2025: Auto-generación OC - Fase 2 Gaps
            auto_generar_oc: Joi.boolean().optional().default(false),
            cantidad_oc_sugerida: Joi.number().integer().min(1).optional().default(50),

            // Precios multi-moneda (Fase 4)
            precios_moneda: Joi.array().items(precioMonedaSchema).max(10).optional()
        }).custom((value, helpers) => {
            // Validación: stock_maximo debe ser mayor o igual que stock_minimo
            if (value.stock_minimo > value.stock_maximo) {
                return helpers.error('any.custom', {
                    message: 'stock_minimo no puede ser mayor que stock_maximo'
                });
            }

            return value;
        })
    },

    /**
     * Schema para actualizar producto
     * PUT /api/v1/inventario/productos/:id
     */
    actualizarProducto: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),

        body: Joi.object({
            nombre: Joi.string().max(200).optional(),
            descripcion: Joi.string().max(1000).optional().allow(null, ''),
            sku: Joi.string().max(50).optional().allow(null, ''),
            codigo_barras: Joi.string().max(50).optional().allow(null, ''),
            categoria_id: Joi.number().integer().positive().optional().allow(null),
            proveedor_id: Joi.number().integer().positive().optional().allow(null),
            precio_compra: Joi.number().min(0).optional(),
            precio_venta: Joi.number().min(0.01).optional(),
            // Dic 2025: precio_mayoreo eliminado, usar listas_precios
            stock_minimo: Joi.number().integer().min(0).optional(),
            stock_maximo: Joi.number().integer().min(1).optional(),
            unidad_medida: Joi.string().max(20).optional(),
            alerta_stock_minimo: Joi.boolean().optional(),
            es_perecedero: Joi.boolean().optional(),
            dias_vida_util: Joi.number().integer().min(1).optional().allow(null),
            permite_venta: Joi.boolean().optional(),
            permite_uso_servicio: Joi.boolean().optional(),
            notas: Joi.string().max(500).optional().allow(null, ''),
            imagen_url: Joi.string().uri().max(500).optional().allow(null, ''),
            activo: Joi.boolean().optional(),

            // Dic 2025: Números de serie / Lotes
            requiere_numero_serie: Joi.boolean().optional(),

            // Dic 2025: Variantes de producto
            tiene_variantes: Joi.boolean().optional(),

            // Dic 2025: Dropshipping - Fase 1 Gaps
            ruta_preferida: Joi.string().valid('normal', 'dropship', 'fabricar').optional(),

            // Dic 2025: Auto-generación OC - Fase 2 Gaps
            auto_generar_oc: Joi.boolean().optional(),
            cantidad_oc_sugerida: Joi.number().integer().min(1).optional(),

            // Precios multi-moneda (Fase 4)
            precios_moneda: Joi.array().items(precioMonedaSchema).max(10).optional()
        }).min(1)
    },

    /**
     * Schema para crear múltiples productos
     * POST /api/v1/inventario/productos/bulk
     */
    bulkCrearProductos: {
        body: Joi.object({
            productos: Joi.array()
                .items(
                    Joi.object({
                        nombre: Joi.string().max(200).required(),
                        descripcion: Joi.string().max(1000).optional().allow(null, ''),
                        sku: Joi.string().max(50).optional().allow(null, ''),
                        codigo_barras: Joi.string().max(50).optional().allow(null, '').regex(/^[0-9]{8,13}$/),
                        categoria_id: Joi.number().integer().positive().optional().allow(null),
                        proveedor_id: Joi.number().integer().positive().optional().allow(null),
                        precio_compra: Joi.number().min(0).optional().default(0),
                        precio_venta: Joi.number().min(0.01).required(),
                        // Dic 2025: precio_mayoreo eliminado, usar listas_precios
                        stock_actual: Joi.number().integer().min(0).optional().default(0),
                        stock_minimo: Joi.number().integer().min(0).optional().default(5),
                        stock_maximo: Joi.number().integer().min(1).optional().default(100),
                        unidad_medida: Joi.string().max(20).optional().default('unidad'),
                        alerta_stock_minimo: Joi.boolean().optional().default(true),
                        es_perecedero: Joi.boolean().optional().default(false),
                        dias_vida_util: Joi.number().integer().min(1).optional().allow(null),
                        permite_venta: Joi.boolean().optional().default(true),
                        permite_uso_servicio: Joi.boolean().optional().default(true),
                        notas: Joi.string().max(500).optional().allow(null, ''),
                        imagen_url: Joi.string().uri().max(500).optional().allow(null, '')
                    })
                )
                .min(1)
                .max(50)
                .required()
                .messages({
                    'any.required': 'El array de productos es requerido',
                    'array.min': 'Debe incluir al menos 1 producto',
                    'array.max': 'No puede crear más de 50 productos a la vez'
                })
        })
    },

    /**
     * Schema para ajustar stock manualmente
     * PATCH /api/v1/inventario/productos/:id/stock
     */
    ajustarStock: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),

        body: Joi.object({
            cantidad_ajuste: Joi.number().integer().required().messages({
                'any.required': 'cantidad_ajuste es requerida'
            }),
            motivo: Joi.string().max(500).required().messages({
                'any.required': 'El motivo del ajuste es requerido'
            }),
            tipo_movimiento: Joi.string()
                .valid('entrada_ajuste', 'salida_ajuste')
                .required()
                .messages({
                    'any.required': 'tipo_movimiento es requerido',
                    'any.only': 'tipo_movimiento debe ser entrada_ajuste o salida_ajuste'
                }),
            // Ene 2026: Ubicación destino opcional para integración WMS
            ubicacion_id: Joi.number().integer().positive().optional()
                .description('Ubicación destino opcional, usa default si no se especifica')
        }).custom((value, helpers) => {
            // Validación: Las entradas deben tener cantidad positiva
            if (value.tipo_movimiento === 'entrada_ajuste' && value.cantidad_ajuste <= 0) {
                return helpers.error('any.custom', {
                    message: 'Los ajustes de entrada deben tener cantidad positiva'
                });
            }

            // Validación: Las salidas deben tener cantidad negativa
            if (value.tipo_movimiento === 'salida_ajuste' && value.cantidad_ajuste >= 0) {
                return helpers.error('any.custom', {
                    message: 'Los ajustes de salida deben tener cantidad negativa'
                });
            }

            return value;
        })
    },

    /**
     * Schema para búsqueda avanzada de productos
     * GET /api/v1/inventario/productos/buscar
     */
    buscarProductos: {
        query: Joi.object({
            q: Joi.string().min(2).required().messages({
                'any.required': 'El parámetro de búsqueda (q) es requerido',
                'string.min': 'La búsqueda debe tener al menos 2 caracteres'
            }),
            tipo_busqueda: Joi.string()
                .valid('nombre', 'sku', 'codigo_barras', 'all')
                .optional()
                .default('all')
                .messages({
                    'any.only': 'tipo_busqueda debe ser: nombre, sku, codigo_barras o all'
                }),
            categoria_id: Joi.number().integer().positive().optional(),
            proveedor_id: Joi.number().integer().positive().optional(),
            solo_activos: Joi.boolean().optional().default(true),
            solo_con_stock: Joi.boolean().optional().default(false),
            limit: Joi.number().integer().min(1).max(100).optional().default(20)
        })
    },

    /**
     * Schema para listar productos
     * GET /api/v1/inventario/productos
     */
    listarProductos: {
        query: withPagination({
            activo: Joi.boolean().optional(),
            categoria_id: idOptional,
            proveedor_id: idOptional,
            busqueda: Joi.string().max(100).optional(),
            sku: Joi.string().max(50).optional(),
            codigo_barras: Joi.string().max(50).optional(),
            stock_bajo: Joi.boolean().optional(),
            stock_agotado: Joi.boolean().optional(),
            permite_venta: Joi.boolean().optional()
        })
    }
};

module.exports = productosSchemas;
