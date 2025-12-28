/**
 * ====================================================================
 * SCHEMAS DE VALIDACIÓN - INVENTARIO
 * ====================================================================
 *
 * Schemas Joi para validación de requests del módulo de inventario.
 */

const Joi = require('joi');

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

            color: Joi.string().regex(/^#[0-9A-F]{6}$/i).optional().allow(null, '').messages({
                'string.pattern.base': 'El color debe tener formato hexadecimal (#RRGGBB)'
            }),

            orden: Joi.number().integer().min(0).optional().default(0),

            activo: Joi.boolean().optional().default(true)
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
            color: Joi.string().regex(/^#[0-9A-F]{6}$/i).optional().allow(null, ''),
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
            activo: Joi.boolean().optional(),
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

            rfc: Joi.string().max(13).optional().allow(null, '').regex(/^[A-Z0-9]+$/i).messages({
                'string.pattern.base': 'El RFC solo puede contener letras y números'
            }),

            telefono: Joi.string().max(20).optional().allow(null, ''),
            email: Joi.string().email().max(255).optional().allow(null, ''),
            sitio_web: Joi.string().uri().max(255).optional().allow(null, ''),

            direccion: Joi.string().max(500).optional().allow(null, ''),
            codigo_postal: Joi.string().max(10).optional().allow(null, ''),
            // IDs de ubicación normalizados (Nov 2025)
            pais_id: Joi.number().integer().positive().optional().allow(null),
            estado_id: Joi.number().integer().positive().optional().allow(null),
            ciudad_id: Joi.number().integer().positive().optional().allow(null),

            dias_credito: Joi.number().integer().min(0).optional().default(0),
            dias_entrega_estimados: Joi.number().integer().min(1).optional().allow(null),
            monto_minimo_compra: Joi.number().min(0).optional().allow(null),

            notas: Joi.string().max(500).optional().allow(null, ''),
            activo: Joi.boolean().optional().default(true)
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
            rfc: Joi.string().max(13).optional().allow(null, ''),
            telefono: Joi.string().max(20).optional().allow(null, ''),
            email: Joi.string().email().max(255).optional().allow(null, ''),
            sitio_web: Joi.string().uri().max(255).optional().allow(null, ''),
            direccion: Joi.string().max(500).optional().allow(null, ''),
            codigo_postal: Joi.string().max(10).optional().allow(null, ''),
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
            activo: Joi.boolean().optional(),
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
            activo: Joi.boolean().optional().default(true),

            // Dic 2025: Números de serie / Lotes
            requiere_numero_serie: Joi.boolean().optional().default(false),

            // Dic 2025: Variantes de producto
            tiene_variantes: Joi.boolean().optional().default(false),

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
            activo: Joi.boolean().optional(),
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
            color: Joi.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().allow(null, ''),
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
            color: Joi.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().allow(null, ''),
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
            activo: Joi.boolean().optional(),
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
    }
};

module.exports = inventarioSchemas;
