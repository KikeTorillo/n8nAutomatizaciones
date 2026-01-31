/**
 * ====================================================================
 * SCHEMAS DE VALIDACIÓN - INVENTARIO
 * ====================================================================
 *
 * Schemas Joi para validación de requests del módulo de inventario.
 */

const Joi = require('joi');
const { fields } = require('../../../schemas/shared');

// Schema reutilizable para precios en múltiples monedas
const precioMonedaSchema = Joi.object({
    moneda: Joi.string().length(3).uppercase().required().messages({
        'any.required': 'El código de moneda es requerido',
        'string.length': 'El código de moneda debe tener 3 caracteres'
    }),
    precio_compra: Joi.number().min(0).optional().allow(null),
    precio_venta: Joi.number().min(0.01).required().messages({
        'any.required': 'El precio de venta es requerido',
        'number.min': 'El precio de venta debe ser mayor a 0'
    })
    // Dic 2025: precio_mayoreo eliminado, usar listas_precios
});

const inventarioSchemas = {
    // ========================================================================
    // CATEGORÍAS DE PRODUCTOS
    // ========================================================================

    /**
     * Schema para crear categoría
     * POST /api/v1/inventario/categorias
     */
    crearCategoria: {
        body: Joi.object({
            nombre: Joi.string().max(100).required().messages({
                'any.required': 'El nombre es requerido',
                'string.max': 'El nombre no puede exceder 100 caracteres'
            }),

            descripcion: Joi.string().max(500).optional().allow(null, '').messages({
                'string.max': 'La descripción no puede exceder 500 caracteres'
            }),

            categoria_padre_id: Joi.number().integer().positive().optional().messages({
                'number.base': 'categoria_padre_id debe ser un número',
                'number.positive': 'categoria_padre_id debe ser positivo'
            }),

            icono: Joi.string().max(50).optional().allow(null, ''),

            // ✅ FIX v2.1: Usar fields.colorHex
            color: fields.colorHex.optional().allow(null, ''),

            orden: Joi.number().integer().min(0).optional().default(0),

            activo: fields.activo
        })
    },

    /**
     * Schema para actualizar categoría
     * PUT /api/v1/inventario/categorias/:id
     */
    actualizarCategoria: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),

        body: Joi.object({
            nombre: Joi.string().max(100).optional(),
            descripcion: Joi.string().max(500).optional().allow(null, ''),
            categoria_padre_id: Joi.number().integer().positive().optional().allow(null),
            icono: Joi.string().max(50).optional().allow(null, ''),
            // ✅ FIX v2.1: Usar fields.colorHex
            color: fields.colorHex.optional().allow(null, ''),
            orden: Joi.number().integer().min(0).optional(),
            activo: Joi.boolean().optional()
        }).min(1)
    },

    /**
     * Schema para listar categorías
     * GET /api/v1/inventario/categorias
     */
    listarCategorias: {
        query: Joi.object({
            activo: fields.activoQuery,
            categoria_padre_id: Joi.number().integer().optional().allow(null),
            busqueda: Joi.string().max(100).optional()
        })
    },

    // ========================================================================
    // PROVEEDORES
    // ========================================================================

    /**
     * Schema para crear proveedor
     * POST /api/v1/inventario/proveedores
     */
    crearProveedor: {
        body: Joi.object({
            nombre: Joi.string().max(200).required().messages({
                'any.required': 'El nombre es requerido',
                'string.max': 'El nombre no puede exceder 200 caracteres'
            }),

            razon_social: Joi.string().max(200).optional().allow(null, ''),

            // ✅ FIX v2.1: Usar fields.rfc con validación completa
            rfc: fields.rfc.optional(),

            telefono: fields.telefonoGenerico.optional(),
            // ✅ FIX v2.1: Usar fields.email con lowercase
            email: fields.email.optional().allow(null, ''),
            sitio_web: Joi.string().uri().max(255).optional().allow(null, ''),

            direccion: Joi.string().max(500).optional().allow(null, ''),
            // ✅ FIX v2.1: Usar fields.codigoPostal con validación
            codigo_postal: fields.codigoPostal.optional().allow(null, ''),
            // IDs de ubicación normalizados (Nov 2025)
            pais_id: Joi.number().integer().positive().optional().allow(null),
            estado_id: Joi.number().integer().positive().optional().allow(null),
            ciudad_id: Joi.number().integer().positive().optional().allow(null),

            dias_credito: Joi.number().integer().min(0).optional().default(0),
            dias_entrega_estimados: Joi.number().integer().min(1).optional().allow(null),
            monto_minimo_compra: Joi.number().min(0).optional().allow(null),

            notas: Joi.string().max(500).optional().allow(null, ''),
            activo: fields.activo
        })
    },

    /**
     * Schema para actualizar proveedor
     * PUT /api/v1/inventario/proveedores/:id
     */
    actualizarProveedor: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),

        body: Joi.object({
            nombre: Joi.string().max(200).optional(),
            razon_social: Joi.string().max(200).optional().allow(null, ''),
            // ✅ FIX v2.1: Usar fields estandarizados
            rfc: fields.rfc.optional(),
            telefono: fields.telefonoGenerico.optional(),
            email: fields.email.optional().allow(null, ''),
            sitio_web: Joi.string().uri().max(255).optional().allow(null, ''),
            direccion: Joi.string().max(500).optional().allow(null, ''),
            codigo_postal: fields.codigoPostal.optional().allow(null, ''),
            // IDs de ubicación normalizados (Nov 2025)
            pais_id: Joi.number().integer().positive().optional().allow(null),
            estado_id: Joi.number().integer().positive().optional().allow(null),
            ciudad_id: Joi.number().integer().positive().optional().allow(null),
            dias_credito: Joi.number().integer().min(0).optional(),
            dias_entrega_estimados: Joi.number().integer().min(1).optional().allow(null),
            monto_minimo_compra: Joi.number().min(0).optional().allow(null),
            notas: Joi.string().max(500).optional().allow(null, ''),
            activo: Joi.boolean().optional()
        }).min(1)
    },

    /**
     * Schema para listar proveedores
     * GET /api/v1/inventario/proveedores
     */
    listarProveedores: {
        query: Joi.object({
            activo: fields.activoQuery,
            busqueda: Joi.string().max(100).optional(),
            ciudad: Joi.string().max(100).optional(),
            rfc: Joi.string().max(13).optional(),
            limit: Joi.number().integer().min(1).max(100).optional().default(50),
            offset: Joi.number().integer().min(0).optional().default(0)
        })
    },

    // ========================================================================
    // PRODUCTOS
    // ========================================================================

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
            activo: fields.activo,

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
                })
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
        query: Joi.object({
            activo: fields.activoQuery,
            categoria_id: Joi.number().integer().positive().optional(),
            proveedor_id: Joi.number().integer().positive().optional(),
            busqueda: Joi.string().max(100).optional(),
            sku: Joi.string().max(50).optional(),
            codigo_barras: Joi.string().max(50).optional(),
            stock_bajo: Joi.boolean().optional(),
            stock_agotado: Joi.boolean().optional(),
            permite_venta: Joi.boolean().optional(),
            orden_por: Joi.string().valid('nombre', 'precio', 'stock', 'creado').optional(),
            orden_dir: Joi.string().valid('asc', 'desc').optional().default('asc'),
            limit: Joi.number().integer().min(1).max(100).optional().default(50),
            offset: Joi.number().integer().min(0).optional().default(0)
        })
    },

    /**
     * Schema para obtener productos con stock crítico
     * GET /api/v1/inventario/productos/stock-critico
     * Ene 2026: Agregado validación Joi
     */
    obtenerStockCritico: {
        query: Joi.object({
            incluir_agotados: Joi.boolean().optional().default(true),
            categoria_id: Joi.number().integer().positive().optional(),
            limit: Joi.number().integer().min(1).max(100).optional().default(50),
            offset: Joi.number().integer().min(0).optional().default(0)
        })
    },

    // ========================================================================
    // MOVIMIENTOS DE INVENTARIO
    // ========================================================================

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
            // ✅ FEATURE: Multi-sucursal
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
            // ✅ FEATURE: Multi-sucursal
            sucursal_id: Joi.number().integer().positive().optional(),
            fecha_desde: Joi.string().isoDate().optional(),
            fecha_hasta: Joi.string().isoDate().optional(),
            limit: Joi.number().integer().min(1).max(100).optional().default(50),
            offset: Joi.number().integer().min(0).optional().default(0)
        })
    },

    // ========================================================================
    // ALERTAS
    // ========================================================================

    /**
     * Schema para listar alertas
     * GET /api/v1/inventario/alertas
     */
    listarAlertas: {
        query: Joi.object({
            tipo_alerta: Joi.string().valid(
                'stock_minimo', 'stock_agotado', 'proximo_vencimiento',
                'vencido', 'sin_movimiento'
            ).optional(),
            nivel: Joi.string().valid('info', 'warning', 'critical').optional(),
            leida: Joi.boolean().optional(),
            producto_id: Joi.number().integer().positive().optional(),
            fecha_desde: Joi.string().isoDate().optional(),
            fecha_hasta: Joi.string().isoDate().optional(),
            limit: Joi.number().integer().min(1).max(100).optional().default(50),
            offset: Joi.number().integer().min(0).optional().default(0)
        })
    },

    /**
     * Schema para marcar alerta como leída
     * PATCH /api/v1/inventario/alertas/:id/marcar-leida
     */
    marcarAlertaLeida: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    },

    /**
     * Schema para marcar múltiples alertas como leídas
     * PATCH /api/v1/inventario/alertas/marcar-varias-leidas
     */
    marcarVariasAlertasLeidas: {
        body: Joi.object({
            alerta_ids: Joi.array()
                .items(Joi.number().integer().positive())
                .min(1)
                .required()
                .messages({
                    'any.required': 'alerta_ids es requerido',
                    'array.min': 'Debe incluir al menos un ID de alerta'
                })
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
    },

    /**
     * Schema genérico para ID en params
     */
    obtenerPorId: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    },

    // ========================================================================
    // REPORTES
    // ========================================================================

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
    },

    // ========================================================================
    // ÓRDENES DE COMPRA
    // ========================================================================

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
        query: Joi.object({
            proveedor_id: Joi.number().integer().positive().optional(),
            estado: Joi.string().valid('borrador', 'enviada', 'parcial', 'recibida', 'cancelada').optional(),
            estado_pago: Joi.string().valid('pendiente', 'parcial', 'pagado').optional(),
            fecha_desde: Joi.string().isoDate().optional(),
            fecha_hasta: Joi.string().isoDate().optional(),
            folio: Joi.string().max(20).optional(),
            limit: Joi.number().integer().min(1).max(100).optional().default(50),
            offset: Joi.number().integer().min(0).optional().default(0)
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
    },

    // ========================================================================
    // RESERVAS DE STOCK (Dic 2025 - Fase 1 Gaps)
    // ========================================================================

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
        query: Joi.object({
            estado: Joi.string().valid('activa', 'confirmada', 'expirada', 'cancelada').optional(),
            producto_id: Joi.number().integer().positive().optional(),
            sucursal_id: Joi.number().integer().positive().optional(),
            tipo_origen: Joi.string().valid('venta_pos', 'orden_venta', 'cita_servicio', 'transferencia').optional(),
            origen_id: Joi.number().integer().positive().optional(),
            limit: Joi.number().integer().min(1).max(100).optional().default(50),
            offset: Joi.number().integer().min(0).optional().default(0)
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
     * Schema para obtener stock por ubicaciones
     * GET /api/v1/inventario/productos/:id/stock-ubicaciones
     * Ene 2026: Nuevo endpoint para filtrado de stock por ubicación
     */
    obtenerStockUbicaciones: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),
        query: Joi.object({
            sucursal_id: Joi.number().integer().positive().optional(),
            usuario_id: Joi.number().integer().positive().optional()
        })
    },

    /**
     * Schema para listar productos con stock filtrado por ubicación
     * GET /api/v1/inventario/productos/stock-filtrado
     * Ene 2026: Nuevo endpoint para filtrado WMS
     */
    listarProductosStockFiltrado: {
        query: Joi.object({
            ubicacion_id: Joi.number().integer().positive().optional(),
            sucursal_id: Joi.number().integer().positive().optional(),
            usuario_id: Joi.number().integer().positive().optional(),
            usuario_ubicacion: Joi.boolean().optional(), // true = usar ubicación del usuario actual
            solo_con_stock: Joi.boolean().optional().default(false),
            busqueda: Joi.string().max(100).optional(),
            categoria_id: Joi.number().integer().positive().optional(),
            limit: Joi.number().integer().min(1).max(100).optional().default(50),
            offset: Joi.number().integer().min(0).optional().default(0)
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
    },

    // ========================================================================
    // UBICACIONES DE ALMACÉN (Dic 2025 - Fase 3 Gaps)
    // ========================================================================

    /**
     * Schema para crear ubicación
     * POST /api/v1/inventario/ubicaciones
     */
    crearUbicacion: {
        body: Joi.object({
            sucursal_id: Joi.number().integer().positive().required().messages({
                'any.required': 'La sucursal es requerida',
                'number.positive': 'sucursal_id debe ser un número positivo'
            }),

            codigo: Joi.string().max(30).required().messages({
                'any.required': 'El código es requerido',
                'string.max': 'El código no puede exceder 30 caracteres'
            }),

            nombre: Joi.string().max(100).optional().allow(null, ''),
            descripcion: Joi.string().max(500).optional().allow(null, ''),

            tipo: Joi.string().valid('zona', 'pasillo', 'estante', 'bin').required().messages({
                'any.required': 'El tipo es requerido',
                'any.only': 'Tipo debe ser: zona, pasillo, estante o bin'
            }),

            parent_id: Joi.number().integer().positive().optional().allow(null),
            capacidad_maxima: Joi.number().integer().min(1).optional().allow(null),
            peso_maximo_kg: Joi.number().min(0).optional().allow(null),
            volumen_m3: Joi.number().min(0).optional().allow(null),

            es_picking: Joi.boolean().optional().default(false),
            es_recepcion: Joi.boolean().optional().default(false),
            es_despacho: Joi.boolean().optional().default(false),
            es_cuarentena: Joi.boolean().optional().default(false),
            es_devolucion: Joi.boolean().optional().default(false),

            temperatura_min: Joi.number().optional().allow(null),
            temperatura_max: Joi.number().optional().allow(null),
            humedad_controlada: Joi.boolean().optional().default(false),

            orden: Joi.number().integer().min(0).optional().default(0),
            color: fields.colorHex.optional().allow(null, ''),
            icono: Joi.string().max(50).optional().allow(null, '')
        })
    },

    /**
     * Schema para actualizar ubicación
     * PUT /api/v1/inventario/ubicaciones/:id
     */
    actualizarUbicacion: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            codigo: Joi.string().max(30).optional(),
            nombre: Joi.string().max(100).optional().allow(null, ''),
            descripcion: Joi.string().max(500).optional().allow(null, ''),
            tipo: Joi.string().valid('zona', 'pasillo', 'estante', 'bin').optional(),
            parent_id: Joi.number().integer().positive().optional().allow(null),
            capacidad_maxima: Joi.number().integer().min(1).optional().allow(null),
            peso_maximo_kg: Joi.number().min(0).optional().allow(null),
            volumen_m3: Joi.number().min(0).optional().allow(null),
            es_picking: Joi.boolean().optional(),
            es_recepcion: Joi.boolean().optional(),
            es_despacho: Joi.boolean().optional(),
            es_cuarentena: Joi.boolean().optional(),
            es_devolucion: Joi.boolean().optional(),
            temperatura_min: Joi.number().optional().allow(null),
            temperatura_max: Joi.number().optional().allow(null),
            humedad_controlada: Joi.boolean().optional(),
            orden: Joi.number().integer().min(0).optional(),
            color: fields.colorHex.optional().allow(null, ''),
            icono: Joi.string().max(50).optional().allow(null, ''),
            activo: Joi.boolean().optional()
        }).min(1)
    },

    /**
     * Schema para listar ubicaciones
     * GET /api/v1/inventario/ubicaciones
     */
    listarUbicaciones: {
        query: Joi.object({
            sucursal_id: Joi.number().integer().positive().optional(),
            tipo: Joi.string().valid('zona', 'pasillo', 'estante', 'bin').optional(),
            parent_id: Joi.alternatives().try(
                Joi.number().integer().positive(),
                Joi.string().valid('null')
            ).optional(),
            es_picking: Joi.boolean().optional(),
            es_recepcion: Joi.boolean().optional(),
            activo: fields.activoQuery,
            bloqueada: Joi.boolean().optional(),
            busqueda: Joi.string().max(100).optional(),
            limit: Joi.number().integer().min(1).max(500).optional().default(100),
            offset: Joi.number().integer().min(0).optional().default(0)
        })
    },

    /**
     * Schema para bloquear/desbloquear ubicación
     * PATCH /api/v1/inventario/ubicaciones/:id/bloquear
     */
    toggleBloqueoUbicacion: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            bloqueada: Joi.boolean().required(),
            motivo_bloqueo: Joi.string().max(500).optional().allow(null, '')
        })
    },

    /**
     * Schema para agregar stock a ubicación
     * POST /api/v1/inventario/ubicaciones/:id/stock
     */
    agregarStockUbicacion: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            producto_id: Joi.number().integer().positive().required().messages({
                'any.required': 'El producto_id es requerido'
            }),
            cantidad: Joi.number().integer().min(1).required().messages({
                'any.required': 'La cantidad es requerida',
                'number.min': 'La cantidad debe ser al menos 1'
            }),
            lote: Joi.string().max(50).optional().allow(null, ''),
            fecha_vencimiento: Joi.string().isoDate().optional().allow(null)
        })
    },

    /**
     * Schema para mover stock entre ubicaciones
     * POST /api/v1/inventario/ubicaciones/mover-stock
     */
    moverStockUbicacion: {
        body: Joi.object({
            producto_id: Joi.number().integer().positive().required().messages({
                'any.required': 'El producto_id es requerido'
            }),
            ubicacion_origen_id: Joi.number().integer().positive().required().messages({
                'any.required': 'La ubicación de origen es requerida'
            }),
            ubicacion_destino_id: Joi.number().integer().positive().required().messages({
                'any.required': 'La ubicación de destino es requerida'
            }),
            cantidad: Joi.number().integer().min(1).required().messages({
                'any.required': 'La cantidad es requerida',
                'number.min': 'La cantidad debe ser al menos 1'
            }),
            lote: Joi.string().max(50).optional().allow(null, '')
        })
    },

    /**
     * Schema para obtener árbol de ubicaciones
     * GET /api/v1/inventario/ubicaciones/arbol/:sucursalId
     */
    obtenerArbolUbicaciones: {
        params: Joi.object({
            sucursalId: Joi.number().integer().positive().required()
        })
    },

    /**
     * Schema para obtener ubicaciones disponibles
     * GET /api/v1/inventario/ubicaciones/disponibles/:sucursalId
     */
    obtenerUbicacionesDisponibles: {
        params: Joi.object({
            sucursalId: Joi.number().integer().positive().required()
        }),
        query: Joi.object({
            cantidad: Joi.number().integer().min(1).optional().default(1)
        })
    },

    /**
     * Schema para obtener estadísticas de ubicaciones
     * GET /api/v1/inventario/ubicaciones/estadisticas/:sucursalId
     */
    obtenerEstadisticasUbicaciones: {
        params: Joi.object({
            sucursalId: Joi.number().integer().positive().required()
        })
    },

    // ========================================================================
    // CONTEOS DE INVENTARIO (Dic 2025 - Conteo Físico)
    // ========================================================================

    /**
     * Schema para crear conteo de inventario
     * POST /api/v1/inventario/conteos
     */
    crearConteo: {
        body: Joi.object({
            sucursal_id: Joi.number().integer().positive().optional().allow(null),

            tipo_conteo: Joi.string()
                .valid('total', 'por_categoria', 'por_ubicacion', 'ciclico', 'aleatorio')
                .required()
                .messages({
                    'any.required': 'El tipo_conteo es requerido',
                    'any.only': 'tipo_conteo debe ser: total, por_categoria, por_ubicacion, ciclico o aleatorio'
                }),

            filtros: Joi.object({
                categoria_id: Joi.number().integer().positive().optional(),
                ubicacion_id: Joi.number().integer().positive().optional(),
                producto_ids: Joi.array().items(Joi.number().integer().positive()).optional(),
                cantidad_muestra: Joi.number().integer().min(1).max(500).optional().default(50),
                solo_con_stock: Joi.boolean().optional().default(false)
            }).optional().default({}),

            fecha_programada: Joi.string().isoDate().optional().allow(null),

            usuario_contador_id: Joi.number().integer().positive().optional().allow(null),
            usuario_supervisor_id: Joi.number().integer().positive().optional().allow(null),

            notas: Joi.string().max(1000).optional().allow(null, '')
        }).custom((value, helpers) => {
            // Validación: conteo por categoría requiere categoria_id
            if (value.tipo_conteo === 'por_categoria' && !value.filtros?.categoria_id) {
                return helpers.error('any.custom', {
                    message: 'Para conteo por categoría debe especificar filtros.categoria_id'
                });
            }

            // Validación: conteo por ubicación requiere ubicacion_id
            if (value.tipo_conteo === 'por_ubicacion' && !value.filtros?.ubicacion_id) {
                return helpers.error('any.custom', {
                    message: 'Para conteo por ubicación debe especificar filtros.ubicacion_id'
                });
            }

            // Validación: conteo cíclico requiere producto_ids
            if (value.tipo_conteo === 'ciclico' &&
                (!value.filtros?.producto_ids || value.filtros.producto_ids.length === 0)) {
                return helpers.error('any.custom', {
                    message: 'Para conteo cíclico debe especificar filtros.producto_ids'
                });
            }

            return value;
        })
    },

    /**
     * Schema para listar conteos
     * GET /api/v1/inventario/conteos
     */
    listarConteos: {
        query: Joi.object({
            sucursal_id: Joi.number().integer().positive().optional(),
            estado: Joi.string().valid('borrador', 'en_proceso', 'completado', 'ajustado', 'cancelado').optional(),
            tipo_conteo: Joi.string().valid('total', 'por_categoria', 'por_ubicacion', 'ciclico', 'aleatorio').optional(),
            fecha_desde: Joi.string().isoDate().optional(),
            fecha_hasta: Joi.string().isoDate().optional(),
            folio: Joi.string().max(20).optional(),
            limit: Joi.number().integer().min(1).max(100).optional().default(50),
            offset: Joi.number().integer().min(0).optional().default(0)
        })
    },

    /**
     * Schema para obtener conteo por ID
     * GET /api/v1/inventario/conteos/:id
     */
    obtenerConteoPorId: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    },

    /**
     * Schema para iniciar conteo
     * POST /api/v1/inventario/conteos/:id/iniciar
     */
    iniciarConteo: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    },

    /**
     * Schema para registrar cantidad contada de un item
     * PUT /api/v1/inventario/conteos/items/:itemId
     */
    registrarConteoItem: {
        params: Joi.object({
            itemId: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            cantidad_contada: Joi.number().integer().min(0).required().messages({
                'any.required': 'La cantidad_contada es requerida',
                'number.min': 'La cantidad_contada no puede ser negativa'
            }),
            notas: Joi.string().max(500).optional().allow(null, '')
        })
    },

    /**
     * Schema para completar conteo
     * POST /api/v1/inventario/conteos/:id/completar
     */
    completarConteo: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    },

    /**
     * Schema para aplicar ajustes del conteo
     * POST /api/v1/inventario/conteos/:id/aplicar-ajustes
     */
    aplicarAjustesConteo: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    },

    /**
     * Schema para cancelar conteo
     * POST /api/v1/inventario/conteos/:id/cancelar
     */
    cancelarConteo: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            motivo: Joi.string().max(500).optional().allow(null, '')
        })
    },

    /**
     * Schema para buscar item por código
     * GET /api/v1/inventario/conteos/:id/buscar-item
     */
    buscarItemConteo: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),
        query: Joi.object({
            codigo: Joi.string().max(100).required().messages({
                'any.required': 'El código es requerido'
            })
        })
    },

    /**
     * Schema para estadísticas de conteos
     * GET /api/v1/inventario/conteos/estadisticas
     */
    estadisticasConteos: {
        query: Joi.object({
            fecha_desde: Joi.string().isoDate().optional(),
            fecha_hasta: Joi.string().isoDate().optional()
        })
    },

    // ==================== AJUSTES MASIVOS ====================

    /**
     * Schema para crear ajuste masivo
     * POST /api/v1/inventario/ajustes-masivos
     */
    crearAjusteMasivo: {
        body: Joi.object({
            archivo_nombre: Joi.string().max(255).required().messages({
                'any.required': 'El nombre del archivo es requerido',
                'string.max': 'El nombre del archivo no puede exceder 255 caracteres'
            }),
            items: Joi.array().items(
                Joi.object({
                    fila_numero: Joi.number().integer().positive().required().messages({
                        'any.required': 'El número de fila es requerido'
                    }),
                    sku: Joi.string().max(100).allow('', null).optional(),
                    codigo_barras: Joi.string().max(100).allow('', null).optional(),
                    cantidad_ajuste: Joi.number().integer().required().messages({
                        'any.required': 'La cantidad de ajuste es requerida',
                        'number.base': 'La cantidad debe ser un número entero'
                    }),
                    motivo: Joi.string().max(500).allow('', null).optional()
                }).custom((value, helpers) => {
                    // Validar que al menos uno de sku o codigo_barras esté presente
                    if (!value.sku && !value.codigo_barras) {
                        return helpers.error('custom.skuOrBarcode');
                    }
                    // Validar que cantidad no sea 0
                    if (value.cantidad_ajuste === 0) {
                        return helpers.error('custom.cantidadCero');
                    }
                    return value;
                }).messages({
                    'custom.skuOrBarcode': 'Debe proporcionar SKU o código de barras',
                    'custom.cantidadCero': 'La cantidad de ajuste no puede ser 0'
                })
            ).min(1).max(500).required().messages({
                'array.min': 'Debe incluir al menos un item',
                'array.max': 'No puede exceder 500 items por archivo',
                'any.required': 'Los items son requeridos'
            })
        })
    },

    /**
     * Schema para listar ajustes masivos
     * GET /api/v1/inventario/ajustes-masivos
     */
    listarAjustesMasivos: {
        query: Joi.object({
            estado: Joi.string().valid('pendiente', 'validado', 'aplicado', 'con_errores').optional(),
            fecha_desde: Joi.string().isoDate().optional(),
            fecha_hasta: Joi.string().isoDate().optional(),
            folio: Joi.string().max(20).optional(),
            limit: Joi.number().integer().min(1).max(100).default(20),
            offset: Joi.number().integer().min(0).default(0)
        })
    },

    /**
     * Schema para obtener ajuste masivo por ID
     * GET /api/v1/inventario/ajustes-masivos/:id
     */
    obtenerAjusteMasivo: {
        params: Joi.object({
            id: Joi.number().integer().positive().required().messages({
                'any.required': 'El ID del ajuste es requerido'
            })
        })
    },

    /**
     * Schema para validar ajuste masivo
     * POST /api/v1/inventario/ajustes-masivos/:id/validar
     */
    validarAjusteMasivo: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    },

    /**
     * Schema para aplicar ajuste masivo
     * POST /api/v1/inventario/ajustes-masivos/:id/aplicar
     */
    aplicarAjusteMasivo: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    },

    /**
     * Schema para cancelar ajuste masivo
     * DELETE /api/v1/inventario/ajustes-masivos/:id
     */
    cancelarAjusteMasivo: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    },

    // ========================================================================
    // REORDEN AUTOMATICO (Dic 2025)
    // ========================================================================

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

            activo: fields.activo,
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
            activo: fields.activoQuery,
            producto_id: Joi.number().integer().positive().optional()
        })
    },

    /**
     * Schema para listar logs de reorden
     * GET /api/v1/inventario/reorden/logs
     */
    listarLogsReorden: {
        query: Joi.object({
            tipo: Joi.string().valid('job_cron', 'manual').optional(),
            fecha_desde: Joi.date().iso().optional(),
            fecha_hasta: Joi.date().iso().optional(),
            limit: Joi.number().integer().min(1).max(100).optional().default(50),
            offset: Joi.number().integer().min(0).optional().default(0)
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
    },

    // ========================================================================
    // LANDED COSTS - Costos en Destino (Dic 2025)
    // ========================================================================

    /**
     * Schema para crear costo adicional
     * POST /api/v1/inventario/ordenes-compra/:id/costos
     */
    crearCostoAdicional: {
        body: Joi.object({
            tipo_costo: Joi.string()
                .valid('flete', 'arancel', 'seguro', 'manipulacion', 'almacenaje', 'otro')
                .required()
                .messages({
                    'any.required': 'El tipo de costo es requerido',
                    'any.only': 'Tipo de costo invalido'
                }),

            descripcion: Joi.string().max(500).optional().allow(null, ''),

            referencia_externa: Joi.string().max(100).optional().allow(null, ''),

            monto_total: Joi.number()
                .positive()
                .precision(2)
                .required()
                .messages({
                    'any.required': 'El monto total es requerido',
                    'number.positive': 'El monto debe ser mayor a 0'
                }),

            moneda: Joi.string().length(3).uppercase().optional().default('MXN'),

            tipo_cambio: Joi.number().positive().precision(4).optional().default(1),

            metodo_distribucion: Joi.string()
                .valid('valor', 'cantidad', 'peso', 'volumen')
                .optional()
                .default('valor')
                .messages({
                    'any.only': 'Metodo de distribucion invalido'
                }),

            proveedor_servicio_id: Joi.number().integer().positive().optional().allow(null),

            proveedor_servicio_nombre: Joi.string().max(200).optional().allow(null, '')
        })
    },

    /**
     * Schema para actualizar costo adicional
     * PUT /api/v1/inventario/ordenes-compra/:id/costos/:costoId
     */
    actualizarCostoAdicional: {
        body: Joi.object({
            tipo_costo: Joi.string()
                .valid('flete', 'arancel', 'seguro', 'manipulacion', 'almacenaje', 'otro')
                .optional(),

            descripcion: Joi.string().max(500).optional().allow(null, ''),

            referencia_externa: Joi.string().max(100).optional().allow(null, ''),

            monto_total: Joi.number().positive().precision(2).optional(),

            moneda: Joi.string().length(3).uppercase().optional(),

            tipo_cambio: Joi.number().positive().precision(4).optional(),

            metodo_distribucion: Joi.string()
                .valid('valor', 'cantidad', 'peso', 'volumen')
                .optional(),

            proveedor_servicio_id: Joi.number().integer().positive().optional().allow(null),

            proveedor_servicio_nombre: Joi.string().max(200).optional().allow(null, '')
        }).min(1).messages({
            'object.min': 'Debe proporcionar al menos un campo para actualizar'
        })
    },

    // ========================================================================
    // DROPSHIPPING (Dic 2025)
    // ========================================================================

    /**
     * Schema para actualizar configuracion dropship
     * PATCH /api/v1/inventario/dropship/configuracion
     */
    actualizarConfigDropship: {
        body: Joi.object({
            dropship_auto_generar_oc: Joi.boolean().required().messages({
                'any.required': 'Debe indicar si la generacion automatica esta activa'
            })
        })
    },

    // ========================================================================
    // PAQUETES DE ENVIO (Dic 2025)
    // ========================================================================

    /**
     * Schema para crear paquete
     * POST /api/v1/inventario/operaciones/:operacionId/paquetes
     */
    crearPaquete: {
        params: Joi.object({
            operacionId: Joi.number().integer().positive().required().messages({
                'any.required': 'El ID de operacion es requerido',
                'number.positive': 'El ID de operacion debe ser positivo'
            })
        }),
        body: Joi.object({
            notas: Joi.string().max(500).optional().allow(null, '')
        })
    },

    /**
     * Schema para agregar item a paquete
     * POST /api/v1/inventario/paquetes/:id/items
     */
    agregarItemPaquete: {
        params: Joi.object({
            id: Joi.number().integer().positive().required().messages({
                'any.required': 'El ID de paquete es requerido'
            })
        }),
        body: Joi.object({
            operacion_item_id: Joi.number().integer().positive().required().messages({
                'any.required': 'El ID de item de operacion es requerido',
                'number.positive': 'El ID debe ser positivo'
            }),
            cantidad: Joi.number().integer().positive().required().messages({
                'any.required': 'La cantidad es requerida',
                'number.positive': 'La cantidad debe ser mayor a 0'
            }),
            numero_serie_id: Joi.number().integer().positive().optional().allow(null)
        })
    },

    /**
     * Schema para actualizar paquete (dimensiones, peso)
     * PUT /api/v1/inventario/paquetes/:id
     */
    actualizarPaquete: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            peso_kg: Joi.number().positive().precision(3).optional().allow(null),
            largo_cm: Joi.number().positive().precision(2).optional().allow(null),
            ancho_cm: Joi.number().positive().precision(2).optional().allow(null),
            alto_cm: Joi.number().positive().precision(2).optional().allow(null),
            notas: Joi.string().max(500).optional().allow(null, ''),
            carrier: Joi.string().max(50).optional().allow(null, ''),
            tracking_carrier: Joi.string().max(100).optional().allow(null, '')
        }).min(1).messages({
            'object.min': 'Debe proporcionar al menos un campo para actualizar'
        })
    },

    /**
     * Schema para etiquetar paquete
     * POST /api/v1/inventario/paquetes/:id/etiquetar
     */
    etiquetarPaquete: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            tracking_carrier: Joi.string().max(100).optional().allow(null, ''),
            carrier: Joi.string().max(50).optional().allow(null, '')
        })
    },

    /**
     * Schema para cancelar paquete
     * POST /api/v1/inventario/paquetes/:id/cancelar
     */
    cancelarPaquete: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            motivo: Joi.string().max(500).optional().allow(null, '')
        })
    },

    // ========================================================================
    // CONSIGNA - Inventario en Consignacion (Dic 2025)
    // ========================================================================

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

module.exports = inventarioSchemas;
