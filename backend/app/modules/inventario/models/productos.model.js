const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');
const { ErrorHelper } = require('../../../utils/helpers');

/**
 * Model para CRUD de productos
 * Maneja catálogo de productos con control de stock y precios
 * Soporta precios multi-moneda (Fase 4)
 */
class ProductosModel {

    // =========================================================================
    // MÉTODOS DE PRECIOS MULTI-MONEDA
    // =========================================================================

    /**
     * Guardar precios en múltiples monedas para un producto
     * @param {number} productoId - ID del producto
     * @param {Array} precios - Array de { moneda, precio_compra, precio_venta }
     * @param {number} organizacionId - ID de la organización
     * @param {Object} db - Cliente de transacción (opcional)
     */
    static async guardarPreciosMoneda(productoId, precios, organizacionId, db = null) {
        const ejecutar = async (client) => {
            if (!precios || !Array.isArray(precios) || precios.length === 0) {
                return [];
            }

            const resultados = [];

            for (const precio of precios) {
                if (!precio.moneda || !precio.precio_venta) continue;

                // Upsert: insertar o actualizar si ya existe
                const query = `
                    INSERT INTO precios_producto_moneda (
                        producto_id, moneda, precio_compra, precio_venta,
                        organizacion_id, activo
                    ) VALUES ($1, $2, $3, $4, $5, true)
                    ON CONFLICT (producto_id, moneda)
                    DO UPDATE SET
                        precio_compra = EXCLUDED.precio_compra,
                        precio_venta = EXCLUDED.precio_venta,
                        actualizado_en = NOW()
                    RETURNING *
                `;

                const values = [
                    productoId,
                    precio.moneda,
                    precio.precio_compra || null,
                    precio.precio_venta,
                    organizacionId
                ];

                const result = await client.query(query, values);
                resultados.push(result.rows[0]);
            }

            return resultados;
        };

        if (db) {
            return await ejecutar(db);
        }

        return await RLSContextManager.transaction(organizacionId, ejecutar);
    }

    /**
     * Obtener precios en todas las monedas para un producto
     */
    static async obtenerPreciosMoneda(productoId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    ppm.*,
                    m.nombre as moneda_nombre,
                    m.simbolo as moneda_simbolo,
                    m.locale as moneda_locale
                FROM precios_producto_moneda ppm
                JOIN monedas m ON m.codigo = ppm.moneda
                WHERE ppm.producto_id = $1 AND ppm.activo = true
                ORDER BY m.orden
            `;

            const result = await db.query(query, [productoId]);
            return result.rows;
        });
    }

    /**
     * Eliminar un precio de moneda específico
     */
    static async eliminarPrecioMoneda(productoId, moneda, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const query = `
                UPDATE precios_producto_moneda
                SET activo = false, actualizado_en = NOW()
                WHERE producto_id = $1 AND moneda = $2
                RETURNING *
            `;

            const result = await db.query(query, [productoId, moneda]);
            return result.rows[0];
        });
    }

    // =========================================================================
    // MÉTODOS CRUD PRINCIPALES
    // =========================================================================

    /**
     * Crear nuevo producto
     * @param {number} organizacionId
     * @param {Object} data
     * @returns {Object}
     */
    static async crear(organizacionId, data) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[ProductosModel.crear] Iniciando', {
                organizacion_id: organizacionId,
                nombre: data.nombre
            });

            // Validar categoría si existe
            if (data.categoria_id) {
                const categoriaQuery = await db.query(
                    `SELECT id FROM categorias_productos
                     WHERE id = $1 AND organizacion_id = $2 AND activo = true`,
                    [data.categoria_id, organizacionId]
                );

                if (categoriaQuery.rows.length === 0) {
                    ErrorHelper.throwValidation('Categoría no encontrada o no pertenece a esta organización');
                }
            }

            // Validar proveedor si existe
            if (data.proveedor_id) {
                const proveedorQuery = await db.query(
                    `SELECT id FROM proveedores
                     WHERE id = $1 AND organizacion_id = $2 AND activo = true`,
                    [data.proveedor_id, organizacionId]
                );

                if (proveedorQuery.rows.length === 0) {
                    ErrorHelper.throwValidation('Proveedor no encontrado o no pertenece a esta organización');
                }
            }

            // Validar SKU único si se proporciona
            if (data.sku) {
                const skuQuery = await db.query(
                    `SELECT id FROM productos
                     WHERE organizacion_id = $1 AND sku = $2 AND activo = true`,
                    [organizacionId, data.sku]
                );

                if (skuQuery.rows.length > 0) {
                    ErrorHelper.throwConflict(`Ya existe un producto con el SKU: ${data.sku}`);
                }
            }

            // Validar código de barras único si se proporciona
            if (data.codigo_barras) {
                const codigoQuery = await db.query(
                    `SELECT id FROM productos
                     WHERE organizacion_id = $1 AND codigo_barras = $2 AND activo = true`,
                    [organizacionId, data.codigo_barras]
                );

                if (codigoQuery.rows.length > 0) {
                    ErrorHelper.throwConflict(`Ya existe un producto con el código de barras: ${data.codigo_barras}`);
                }
            }

            const query = `
                INSERT INTO productos (
                    organizacion_id,
                    nombre,
                    descripcion,
                    sku,
                    codigo_barras,
                    categoria_id,
                    proveedor_id,
                    precio_compra,
                    precio_venta,
                    stock_actual,
                    stock_minimo,
                    stock_maximo,
                    unidad_medida,
                    alerta_stock_minimo,
                    es_perecedero,
                    dias_vida_util,
                    permite_venta,
                    permite_uso_servicio,
                    notas,
                    imagen_url,
                    activo,
                    requiere_numero_serie,
                    tiene_variantes,
                    auto_generar_oc,
                    cantidad_oc_sugerida,
                    ruta_preferida
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
                RETURNING *
            `;

            const values = [
                organizacionId,
                data.nombre,
                data.descripcion || null,
                data.sku || null,
                data.codigo_barras || null,
                data.categoria_id || null,
                data.proveedor_id || null,
                data.precio_compra !== undefined ? data.precio_compra : 0,
                data.precio_venta,
                0,  // stock_actual es calculado via stock_ubicaciones, siempre inicia en 0
                data.stock_minimo !== undefined ? data.stock_minimo : 5,
                data.stock_maximo !== undefined ? data.stock_maximo : 100,
                data.unidad_medida || 'unidad',
                data.alerta_stock_minimo !== undefined ? data.alerta_stock_minimo : true,
                data.es_perecedero !== undefined ? data.es_perecedero : false,
                data.dias_vida_util || null,
                data.permite_venta !== undefined ? data.permite_venta : true,
                data.permite_uso_servicio !== undefined ? data.permite_uso_servicio : true,
                data.notas || null,
                data.imagen_url || null,
                data.activo !== undefined ? data.activo : true,
                data.requiere_numero_serie !== undefined ? data.requiere_numero_serie : false,
                data.tiene_variantes !== undefined ? data.tiene_variantes : false,
                data.auto_generar_oc !== undefined ? data.auto_generar_oc : false,
                data.cantidad_oc_sugerida !== undefined ? data.cantidad_oc_sugerida : 50,
                data.ruta_preferida || 'normal'
            ];

            const result = await db.query(query, values);
            const producto = result.rows[0];

            logger.info('[ProductosModel.crear] Producto creado', {
                producto_id: producto.id
            });

            // Ene 2026: Si hay stock inicial, registrar movimiento usando función consolidada
            const stockInicial = data.stock_actual !== undefined ? data.stock_actual : 0;
            if (stockInicial > 0) {
                // Obtener sucursal matriz de la organización
                const sucursalQuery = await db.query(
                    `SELECT id FROM sucursales
                     WHERE organizacion_id = $1 AND es_matriz = true
                     LIMIT 1`,
                    [organizacionId]
                );

                if (sucursalQuery.rows.length > 0) {
                    const sucursalId = sucursalQuery.rows[0].id;

                    // Registrar movimiento de entrada inicial usando función consolidada
                    // Nota: Usamos 'entrada_ajuste' porque es el tipo válido más apropiado
                    await db.query(
                        `SELECT registrar_movimiento_con_ubicacion(
                            $1,  -- organizacion_id
                            $2,  -- producto_id
                            $3,  -- tipo_movimiento
                            $4,  -- cantidad (positivo = entrada)
                            $5,  -- sucursal_id
                            NULL, -- ubicacion_id (usa default)
                            NULL, -- lote
                            NULL, -- fecha_vencimiento
                            NULL, -- referencia
                            $6,  -- motivo
                            NULL, -- usuario_id
                            $7,  -- costo_unitario
                            $8,  -- proveedor_id
                            NULL, -- venta_pos_id
                            NULL, -- cita_id
                            NULL  -- variante_id
                        )`,
                        [
                            organizacionId,
                            producto.id,
                            'entrada_ajuste',  // Tipo válido para stock inicial
                            stockInicial,
                            sucursalId,
                            'Stock inicial al crear producto',
                            data.precio_compra || 0,
                            data.proveedor_id || null
                        ]
                    );

                    logger.info('[ProductosModel.crear] Stock inicial registrado con función consolidada', {
                        producto_id: producto.id,
                        stock_inicial: stockInicial,
                        sucursal_id: sucursalId
                    });
                }
            }

            // Guardar precios multi-moneda si se proporcionan
            if (data.precios_moneda && Array.isArray(data.precios_moneda)) {
                await ProductosModel.guardarPreciosMoneda(
                    producto.id,
                    data.precios_moneda,
                    organizacionId,
                    db
                );
            }

            return producto;
        });
    }

    /**
     * Obtener producto por ID (incluye precios multi-moneda)
     * @param {number} organizacionId
     * @param {number} id
     * @returns {Object|null}
     */
    static async buscarPorId(organizacionId, id) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    p.*,
                    c.nombre AS nombre_categoria,
                    prov.nombre AS nombre_proveedor,
                    (p.precio_venta - p.precio_compra) AS margen_unitario,
                    CASE
                        WHEN p.precio_compra > 0 THEN
                            ROUND(((p.precio_venta - p.precio_compra) / p.precio_compra * 100)::numeric, 2)
                        ELSE 0
                    END AS porcentaje_margen,
                    (p.stock_actual * p.precio_venta) AS valor_inventario_venta,
                    (p.stock_actual * p.precio_compra) AS valor_inventario_compra
                FROM productos p
                LEFT JOIN categorias_productos c ON c.id = p.categoria_id
                LEFT JOIN proveedores prov ON prov.id = p.proveedor_id
                WHERE p.id = $1
            `;

            const result = await db.query(query, [id]);
            const producto = result.rows[0] || null;

            if (producto) {
                // Obtener precios en otras monedas
                const preciosQuery = `
                    SELECT
                        ppm.moneda,
                        ppm.precio_compra,
                        ppm.precio_venta,
                        m.nombre as moneda_nombre,
                        m.simbolo as moneda_simbolo
                    FROM precios_producto_moneda ppm
                    JOIN monedas m ON m.codigo = ppm.moneda
                    WHERE ppm.producto_id = $1 AND ppm.activo = true
                    ORDER BY m.orden
                `;
                const preciosResult = await db.query(preciosQuery, [id]);
                producto.precios_moneda = preciosResult.rows;
            }

            return producto;
        });
    }

    /**
     * Listar productos con filtros opcionales
     * @param {number} organizacionId
     * @param {Object} filtros
     * @returns {Object}
     */
    static async listar(organizacionId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereConditions = ['p.organizacion_id = $1'];
            let values = [organizacionId];
            let paramCounter = 2;

            // Filtro por activo (usar != null para descartar tanto null como undefined)
            if (filtros.activo != null) {
                whereConditions.push(`p.activo = $${paramCounter}`);
                values.push(filtros.activo);
                paramCounter++;
            }

            // Filtro por categoría
            if (filtros.categoria_id) {
                whereConditions.push(`p.categoria_id = $${paramCounter}`);
                values.push(filtros.categoria_id);
                paramCounter++;
            }

            // Filtro por proveedor
            if (filtros.proveedor_id) {
                whereConditions.push(`p.proveedor_id = $${paramCounter}`);
                values.push(filtros.proveedor_id);
                paramCounter++;
            }

            // Búsqueda por nombre, SKU o código de barras
            if (filtros.busqueda) {
                whereConditions.push(
                    `(p.nombre ILIKE $${paramCounter} OR p.sku ILIKE $${paramCounter} OR p.codigo_barras ILIKE $${paramCounter})`
                );
                values.push(`%${filtros.busqueda}%`);
                paramCounter++;
            }

            // Filtro por SKU exacto
            if (filtros.sku) {
                whereConditions.push(`p.sku = $${paramCounter}`);
                values.push(filtros.sku);
                paramCounter++;
            }

            // Filtro por código de barras exacto
            if (filtros.codigo_barras) {
                whereConditions.push(`p.codigo_barras = $${paramCounter}`);
                values.push(filtros.codigo_barras);
                paramCounter++;
            }

            // Filtro por stock bajo (stock_actual <= stock_minimo)
            if (filtros.stock_bajo === true) {
                whereConditions.push(`p.stock_actual <= p.stock_minimo`);
            }

            // Filtro por stock agotado (solo filtra cuando se pide explícitamente ver agotados)
            if (filtros.stock_agotado === true) {
                whereConditions.push(`p.stock_actual = 0`);
            }
            // Nota: stock_agotado=false o undefined no agrega filtro (muestra todos)

            // Filtro por permite venta (usar != null para descartar tanto null como undefined)
            if (filtros.permite_venta != null) {
                whereConditions.push(`p.permite_venta = $${paramCounter}`);
                values.push(filtros.permite_venta);
                paramCounter++;
            }

            // Ordenamiento
            let orderBy = 'p.nombre ASC';
            if (filtros.orden_por) {
                const ordenesPermitidos = {
                    'nombre': 'p.nombre',
                    'precio': 'p.precio_venta',
                    'stock': 'p.stock_actual',
                    'creado': 'p.creado_en'
                };

                if (ordenesPermitidos[filtros.orden_por]) {
                    const direccion = filtros.orden_dir === 'desc' ? 'DESC' : 'ASC';
                    orderBy = `${ordenesPermitidos[filtros.orden_por]} ${direccion}`;
                }
            }

            const query = `
                SELECT
                    p.*,
                    c.nombre AS nombre_categoria,
                    prov.nombre AS nombre_proveedor,
                    (p.precio_venta - p.precio_compra) AS margen_unitario
                FROM productos p
                LEFT JOIN categorias_productos c ON c.id = p.categoria_id
                LEFT JOIN proveedores prov ON prov.id = p.proveedor_id
                WHERE ${whereConditions.join(' AND ')}
                ORDER BY ${orderBy}
                LIMIT $${paramCounter}
                OFFSET $${paramCounter + 1}
            `;

            values.push(filtros.limit || 50);
            values.push(filtros.offset || 0);

            const result = await db.query(query, values);

            // Obtener total de registros
            const countQuery = `
                SELECT COUNT(*) as total
                FROM productos p
                WHERE ${whereConditions.join(' AND ')}
            `;

            const countResult = await db.query(countQuery, values.slice(0, values.length - 2));

            return {
                productos: result.rows,
                total: parseInt(countResult.rows[0].total),
                limit: filtros.limit || 50,
                offset: filtros.offset || 0
            };
        });
    }

    /**
     * Actualizar producto
     * @param {number} organizacionId
     * @param {number} id
     * @param {Object} data
     * @returns {Object}
     */
    static async actualizar(organizacionId, id, data) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[ProductosModel.actualizar] Iniciando', {
                organizacion_id: organizacionId,
                producto_id: id
            });

            // Validar que el producto existe
            const existeQuery = await db.query(
                `SELECT id FROM productos WHERE id = $1`,
                [id]
            );

            ErrorHelper.throwIfNotFound(existeQuery.rows[0], 'Producto');

            // Validar categoría si se está actualizando
            if (data.categoria_id !== undefined && data.categoria_id) {
                const categoriaQuery = await db.query(
                    `SELECT id FROM categorias_productos
                     WHERE id = $1 AND organizacion_id = $2 AND activo = true`,
                    [data.categoria_id, organizacionId]
                );

                if (categoriaQuery.rows.length === 0) {
                    ErrorHelper.throwValidation('Categoría no encontrada o no pertenece a esta organización');
                }
            }

            // Validar proveedor si se está actualizando
            if (data.proveedor_id !== undefined && data.proveedor_id) {
                const proveedorQuery = await db.query(
                    `SELECT id FROM proveedores
                     WHERE id = $1 AND organizacion_id = $2 AND activo = true`,
                    [data.proveedor_id, organizacionId]
                );

                if (proveedorQuery.rows.length === 0) {
                    ErrorHelper.throwValidation('Proveedor no encontrado o no pertenece a esta organización');
                }
            }

            // Validar SKU único si se está actualizando
            if (data.sku !== undefined && data.sku) {
                const skuQuery = await db.query(
                    `SELECT id FROM productos
                     WHERE organizacion_id = $1 AND sku = $2 AND id != $3 AND activo = true`,
                    [organizacionId, data.sku, id]
                );

                if (skuQuery.rows.length > 0) {
                    ErrorHelper.throwConflict(`Ya existe otro producto con el SKU: ${data.sku}`);
                }
            }

            // Validar código de barras único si se está actualizando
            if (data.codigo_barras !== undefined && data.codigo_barras) {
                const codigoQuery = await db.query(
                    `SELECT id FROM productos
                     WHERE organizacion_id = $1 AND codigo_barras = $2 AND id != $3 AND activo = true`,
                    [organizacionId, data.codigo_barras, id]
                );

                if (codigoQuery.rows.length > 0) {
                    ErrorHelper.throwConflict(`Ya existe otro producto con el código de barras: ${data.codigo_barras}`);
                }
            }

            // Construir query de actualización dinámica
            // Dic 2025: precio_mayoreo eliminado, usar listas_precios
            // Dic 2025: requiere_numero_serie, auto_generar_oc, cantidad_oc_sugerida, ruta_preferida agregados
            const camposActualizables = [
                'nombre', 'descripcion', 'sku', 'codigo_barras', 'categoria_id', 'proveedor_id',
                'precio_compra', 'precio_venta',
                'stock_minimo', 'stock_maximo', 'unidad_medida', 'alerta_stock_minimo',
                'es_perecedero', 'dias_vida_util', 'permite_venta', 'permite_uso_servicio',
                'notas', 'imagen_url', 'activo', 'requiere_numero_serie', 'tiene_variantes',
                'auto_generar_oc', 'cantidad_oc_sugerida', 'ruta_preferida'
            ];
            const updates = [];
            const values = [];
            let paramCounter = 1;

            camposActualizables.forEach(campo => {
                if (data[campo] !== undefined) {
                    updates.push(`${campo} = $${paramCounter}`);
                    values.push(data[campo]);
                    paramCounter++;
                }
            });

            // Si solo hay precios_moneda y no hay otros campos, no es error
            const tienePrecios = data.precios_moneda && Array.isArray(data.precios_moneda);

            if (updates.length === 0 && !tienePrecios) {
                ErrorHelper.throwValidation('No hay campos para actualizar');
            }

            let producto;

            // Solo ejecutar UPDATE si hay campos del producto a actualizar
            if (updates.length > 0) {
                // Agregar ID al final
                values.push(id);

                const query = `
                    UPDATE productos
                    SET ${updates.join(', ')},
                        actualizado_en = NOW()
                    WHERE id = $${paramCounter}
                    RETURNING *
                `;

                const result = await db.query(query, values);
                producto = result.rows[0];
            } else {
                // Solo actualizar precios, obtener producto actual
                const existente = await db.query('SELECT * FROM productos WHERE id = $1', [id]);
                producto = existente.rows[0];
            }

            // Guardar precios multi-moneda si se proporcionan
            if (tienePrecios) {
                await ProductosModel.guardarPreciosMoneda(
                    id,
                    data.precios_moneda,
                    organizacionId,
                    db
                );
            }

            logger.info('[ProductosModel.actualizar] Producto actualizado', {
                producto_id: id,
                precios_moneda: tienePrecios ? data.precios_moneda.length : 0
            });

            return producto;
        });
    }

    /**
     * Eliminar producto (soft delete)
     * @param {number} organizacionId
     * @param {number} id
     * @returns {Object}
     */
    static async eliminar(organizacionId, id) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[ProductosModel.eliminar] Iniciando', {
                organizacion_id: organizacionId,
                producto_id: id
            });

            // Verificar si tiene movimientos recientes (últimos 30 días)
            const movimientosQuery = await db.query(
                `SELECT COUNT(*) as total FROM movimientos_inventario
                 WHERE producto_id = $1
                   AND creado_en >= NOW() - INTERVAL '30 days'`,
                [id]
            );

            if (parseInt(movimientosQuery.rows[0].total) > 0) {
                logger.warn('[ProductosModel.eliminar] Producto tiene movimientos recientes', {
                    producto_id: id,
                    movimientos: movimientosQuery.rows[0].total
                });
                ErrorHelper.throwConflict('No se puede eliminar un producto con movimientos recientes (últimos 30 días)');
            }

            // Soft delete
            const query = `
                UPDATE productos
                SET activo = false, actualizado_en = NOW()
                WHERE id = $1
                RETURNING *
            `;

            const result = await db.query(query, [id]);

            logger.info('[ProductosModel.eliminar] Producto eliminado (soft delete)', {
                producto_id: id
            });

            return result.rows[0];
        });
    }

    /**
     * Obtener productos con stock crítico (stock <= stock_minimo)
     */
    static async obtenerStockCritico(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    p.*,
                    c.nombre AS nombre_categoria,
                    prov.nombre AS nombre_proveedor,
                    (p.stock_minimo - p.stock_actual) AS unidades_faltantes
                FROM productos p
                LEFT JOIN categorias_productos c ON c.id = p.categoria_id
                LEFT JOIN proveedores prov ON prov.id = p.proveedor_id
                WHERE p.organizacion_id = $1
                  AND p.activo = true
                  AND p.alerta_stock_minimo = true
                  AND p.stock_actual <= p.stock_minimo
                ORDER BY
                    CASE WHEN p.stock_actual = 0 THEN 0 ELSE 1 END,
                    p.stock_actual ASC,
                    p.nombre ASC
            `;

            const result = await db.query(query, [organizacionId]);

            return result.rows;
        });
    }

    /**
     * Crear múltiples productos en una sola transacción (1-50)
     */
    static async bulkCrear(productos, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const productosCreados = [];

            for (const producto of productos) {
                // Dic 2025: precio_mayoreo eliminado, usar listas_precios
                const query = `
                    INSERT INTO productos (
                        organizacion_id, nombre, descripcion, sku, codigo_barras,
                        categoria_id, proveedor_id, precio_compra, precio_venta,
                        stock_actual, stock_minimo, stock_maximo, unidad_medida,
                        alerta_stock_minimo, es_perecedero, dias_vida_util,
                        permite_venta, permite_uso_servicio, notas, imagen_url, activo
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
                    RETURNING *
                `;

                const values = [
                    organizacionId,
                    producto.nombre,
                    producto.descripcion || null,
                    producto.sku || null,
                    producto.codigo_barras || null,
                    producto.categoria_id || null,
                    producto.proveedor_id || null,
                    producto.precio_compra || 0,
                    producto.precio_venta,
                    producto.stock_actual || 0,
                    producto.stock_minimo || 5,
                    producto.stock_maximo || 100,
                    producto.unidad_medida || 'unidad',
                    producto.alerta_stock_minimo !== undefined ? producto.alerta_stock_minimo : true,
                    producto.es_perecedero || false,
                    producto.dias_vida_util || null,
                    producto.permite_venta !== undefined ? producto.permite_venta : true,
                    producto.permite_uso_servicio !== undefined ? producto.permite_uso_servicio : true,
                    producto.notas || null,
                    producto.imagen_url || null,
                    producto.activo !== undefined ? producto.activo : true
                ];

                const result = await db.query(query, values);
                productosCreados.push(result.rows[0]);
            }

            return {
                productos_creados: productosCreados,
                total: productosCreados.length
            };
        });
    }

    /**
     * Ajustar stock manualmente (conteo físico, correcciones)
     * Ene 2026: Refactorizado para usar registrar_movimiento_con_ubicacion()
     */
    static async ajustarStock(id, ajuste, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // 1. Verificar que el producto existe
            const checkQuery = `
                SELECT id, nombre FROM productos
                WHERE id = $1 AND organizacion_id = $2
            `;
            const checkResult = await db.query(checkQuery, [id, organizacionId]);

            ErrorHelper.throwIfNotFound(checkResult.rows[0], 'Producto');

            // 2. Obtener sucursal_id (usar proporcionada o buscar matriz por defecto)
            let sucursalId = ajuste.sucursal_id;
            if (!sucursalId) {
                const sucursalQuery = await db.query(
                    `SELECT id FROM sucursales
                     WHERE organizacion_id = $1 AND es_matriz = true
                     LIMIT 1`,
                    [organizacionId]
                );
                if (sucursalQuery.rows.length > 0) {
                    sucursalId = sucursalQuery.rows[0].id;
                } else {
                    ErrorHelper.throwValidation('No se encontró sucursal matriz para registrar el ajuste de stock');
                }
            }

            // 3. Usar función consolidada para registrar movimiento y actualizar stock
            // Ene 2026: Soporta ubicacion_id explícita para integración con WMS
            await db.query(`
                SELECT registrar_movimiento_con_ubicacion(
                    $1,  -- organizacion_id
                    $2,  -- producto_id
                    $3,  -- tipo_movimiento
                    $4,  -- cantidad
                    $5,  -- sucursal_id
                    $6,  -- ubicacion_id (NULL usa default)
                    NULL, -- lote
                    NULL, -- fecha_vencimiento
                    $7,  -- referencia
                    $8,  -- motivo
                    NULL, -- usuario_id
                    NULL, -- costo_unitario
                    NULL, -- proveedor_id
                    NULL, -- venta_pos_id
                    NULL, -- cita_id
                    NULL  -- variante_id
                )
            `, [
                organizacionId,
                id,
                ajuste.tipo_movimiento,
                ajuste.cantidad_ajuste,
                sucursalId,
                ajuste.ubicacion_id || null, // Ubicación explícita o NULL para default
                'Ajuste manual de stock',
                ajuste.motivo
            ]);

            // 3. Obtener producto actualizado
            const resultQuery = `
                SELECT * FROM productos WHERE id = $1
            `;
            const result = await db.query(resultQuery, [id]);

            return result.rows[0];
        });
    }

    /**
     * Búsqueda avanzada de productos (full-text search + código de barras)
     * Dic 2025: Incluye requiere_numero_serie para integración POS
     * Dic 2025: Busca también en variantes_producto (variantes primero)
     * Ene 2026: Corregido SQL injection - usar parámetros preparados
     */
    static async buscar(filtros, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const { q, tipo_busqueda, categoria_id, proveedor_id, solo_activos, solo_con_stock, limit } = filtros;

            // Construir condiciones dinámicas con parámetros preparados
            // Parámetros base: $1=orgId, $2=q (exacto), $3=q (ILIKE), $4=limit
            let paramIndex = 5;
            const extraConditions = [];
            const values = [
                organizacionId,
                q,              // Para coincidencia exacta SKU/barcode
                `%${q}%`,       // Para ILIKE
                limit || 20
            ];

            // Agregar filtro de categoría si existe
            let categoriaCondition = '';
            if (categoria_id) {
                categoriaCondition = `AND p.categoria_id = $${paramIndex}`;
                values.push(parseInt(categoria_id));
                paramIndex++;
            }

            // Agregar filtro de proveedor si existe
            let proveedorCondition = '';
            if (proveedor_id) {
                proveedorCondition = `AND p.proveedor_id = $${paramIndex}`;
                values.push(parseInt(proveedor_id));
                paramIndex++;
            }

            // Búsqueda unificada: Variantes + Productos sin variantes
            // Las variantes aparecen primero si coinciden exactamente por SKU/barcode
            const query = `
                WITH busqueda AS (
                    -- 1. Buscar en VARIANTES primero
                    SELECT
                        v.id AS variante_id,
                        p.id AS producto_id,
                        v.nombre_variante AS nombre,
                        p.descripcion,
                        v.sku,
                        v.codigo_barras,
                        p.categoria_id,
                        p.proveedor_id,
                        COALESCE(v.precio_compra, p.precio_compra) AS precio_compra,
                        COALESCE(v.precio_venta, p.precio_venta) AS precio_venta,
                        v.stock_actual,
                        v.stock_minimo,
                        v.stock_maximo,
                        p.unidad_medida,
                        p.permite_venta,
                        p.requiere_numero_serie,
                        COALESCE(v.imagen_url, p.imagen_url) AS imagen_url,
                        v.activo,
                        true AS es_variante,
                        c.nombre AS nombre_categoria,
                        prov.nombre AS nombre_proveedor,
                        CASE
                            WHEN v.sku = $2 OR v.codigo_barras = $2 THEN 0  -- Coincidencia exacta
                            ELSE 1
                        END AS orden_relevancia
                    FROM variantes_producto v
                    JOIN productos p ON p.id = v.producto_id
                    LEFT JOIN categorias_productos c ON c.id = p.categoria_id
                    LEFT JOIN proveedores prov ON prov.id = p.proveedor_id
                    WHERE v.organizacion_id = $1
                        AND v.activo = true
                        AND p.tiene_variantes = true
                        AND (
                            v.nombre_variante ILIKE $3
                            OR v.sku ILIKE $3
                            OR v.sku = $2
                            OR v.codigo_barras = $2
                        )
                        ${solo_con_stock ? "AND (v.stock_actual > 0 OR p.ruta_preferida = 'dropship')" : ''}
                        ${categoriaCondition}
                        ${proveedorCondition}

                    UNION ALL

                    -- 2. Buscar en PRODUCTOS (sin variantes o producto base)
                    SELECT
                        NULL AS variante_id,
                        p.id AS producto_id,
                        p.nombre,
                        p.descripcion,
                        p.sku,
                        p.codigo_barras,
                        p.categoria_id,
                        p.proveedor_id,
                        p.precio_compra,
                        p.precio_venta,
                        p.stock_actual,
                        p.stock_minimo,
                        p.stock_maximo,
                        p.unidad_medida,
                        p.permite_venta,
                        p.requiere_numero_serie,
                        p.imagen_url,
                        p.activo,
                        false AS es_variante,
                        c.nombre AS nombre_categoria,
                        prov.nombre AS nombre_proveedor,
                        CASE
                            WHEN p.sku = $2 OR p.codigo_barras = $2 THEN 0
                            ELSE 2  -- Productos después de variantes
                        END AS orden_relevancia
                    FROM productos p
                    LEFT JOIN categorias_productos c ON c.id = p.categoria_id
                    LEFT JOIN proveedores prov ON prov.id = p.proveedor_id
                    WHERE p.organizacion_id = $1
                        AND p.tiene_variantes = false  -- Solo productos SIN variantes
                        ${solo_activos ? 'AND p.activo = true' : ''}
                        AND (
                            p.nombre ILIKE $3
                            OR p.sku ILIKE $3
                            OR p.sku = $2
                            OR p.codigo_barras = $2
                        )
                        ${solo_con_stock ? "AND (p.stock_actual > 0 OR p.ruta_preferida = 'dropship')" : ''}
                        ${categoriaCondition}
                        ${proveedorCondition}
                )
                SELECT * FROM busqueda
                ORDER BY orden_relevancia, nombre
                LIMIT $4
            `;

            const result = await db.query(query, values);
            return result.rows;
        });
    }
}

module.exports = ProductosModel;
