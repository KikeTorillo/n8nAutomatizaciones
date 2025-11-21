const RLSContextManager = require('../../../../utils/rlsContextManager');
const logger = require('../../../../utils/logger');

/**
 * Model para CRUD de productos
 * Maneja catálogo de productos con control de stock y precios
 */
class ProductosModel {

    /**
     * Crear nuevo producto
     */
    static async crear(data, organizacionId) {
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
                    throw new Error('Categoría no encontrada o no pertenece a esta organización');
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
                    throw new Error('Proveedor no encontrado o no pertenece a esta organización');
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
                    throw new Error(`Ya existe un producto con el SKU: ${data.sku}`);
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
                    throw new Error(`Ya existe un producto con el código de barras: ${data.codigo_barras}`);
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
                    precio_mayoreo,
                    cantidad_mayoreo,
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
                    activo
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
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
                data.precio_mayoreo || null,
                data.cantidad_mayoreo || null,
                data.stock_actual !== undefined ? data.stock_actual : 0,
                data.stock_minimo !== undefined ? data.stock_minimo : 5,
                data.stock_maximo !== undefined ? data.stock_maximo : 100,
                data.unidad_medida || 'unidad',
                data.alerta_stock_minimo !== undefined ? data.alerta_stock_minimo : true,
                data.es_perecedero !== undefined ? data.es_perecedero : false,
                data.dias_vida_util || null,
                data.permite_venta !== undefined ? data.permite_venta : true,
                data.permite_uso_servicio !== undefined ? data.permite_uso_servicio : true,
                data.notas || null,
                data.activo !== undefined ? data.activo : true
            ];

            const result = await db.query(query, values);

            logger.info('[ProductosModel.crear] Producto creado', {
                producto_id: result.rows[0].id
            });

            return result.rows[0];
        });
    }

    /**
     * Obtener producto por ID
     */
    static async obtenerPorId(id, organizacionId) {
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
            return result.rows[0] || null;
        });
    }

    /**
     * Listar productos con filtros opcionales
     */
    static async listar(filtros, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereConditions = ['p.organizacion_id = $1'];
            let values = [organizacionId];
            let paramCounter = 2;

            // Filtro por activo
            if (filtros.activo !== undefined) {
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

            // Filtro por stock agotado
            if (filtros.stock_agotado === true) {
                whereConditions.push(`p.stock_actual = 0`);
            } else if (filtros.stock_agotado === false) {
                whereConditions.push(`p.stock_actual > 0`);
            }

            // Filtro por permite venta
            if (filtros.permite_venta !== undefined) {
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
     */
    static async actualizar(id, data, organizacionId) {
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

            if (existeQuery.rows.length === 0) {
                throw new Error('Producto no encontrado');
            }

            // Validar categoría si se está actualizando
            if (data.categoria_id !== undefined && data.categoria_id) {
                const categoriaQuery = await db.query(
                    `SELECT id FROM categorias_productos
                     WHERE id = $1 AND organizacion_id = $2 AND activo = true`,
                    [data.categoria_id, organizacionId]
                );

                if (categoriaQuery.rows.length === 0) {
                    throw new Error('Categoría no encontrada o no pertenece a esta organización');
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
                    throw new Error('Proveedor no encontrado o no pertenece a esta organización');
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
                    throw new Error(`Ya existe otro producto con el SKU: ${data.sku}`);
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
                    throw new Error(`Ya existe otro producto con el código de barras: ${data.codigo_barras}`);
                }
            }

            // Construir query de actualización dinámica
            const camposActualizables = [
                'nombre', 'descripcion', 'sku', 'codigo_barras', 'categoria_id', 'proveedor_id',
                'precio_compra', 'precio_venta', 'precio_mayoreo', 'cantidad_mayoreo',
                'stock_minimo', 'stock_maximo', 'unidad_medida', 'alerta_stock_minimo',
                'es_perecedero', 'dias_vida_util', 'permite_venta', 'permite_uso_servicio',
                'notas', 'activo'
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

            if (updates.length === 0) {
                throw new Error('No hay campos para actualizar');
            }

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

            logger.info('[ProductosModel.actualizar] Producto actualizado', {
                producto_id: id
            });

            return result.rows[0];
        });
    }

    /**
     * Eliminar producto (soft delete)
     */
    static async eliminar(id, organizacionId) {
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
                throw new Error('No se puede eliminar un producto con movimientos recientes (últimos 30 días)');
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
                const query = `
                    INSERT INTO productos (
                        organizacion_id, nombre, descripcion, sku, codigo_barras,
                        categoria_id, proveedor_id, precio_compra, precio_venta,
                        precio_mayoreo, cantidad_mayoreo, stock_actual, stock_minimo,
                        stock_maximo, unidad_medida, alerta_stock_minimo, es_perecedero,
                        dias_vida_util, permite_venta, permite_uso_servicio, notas, activo
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
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
                    producto.precio_mayoreo || null,
                    producto.cantidad_mayoreo || null,
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
     */
    static async ajustarStock(id, ajuste, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // 1. Verificar que el producto existe
            const checkQuery = `
                SELECT * FROM productos
                WHERE id = $1 AND organizacion_id = $2
            `;
            const checkResult = await db.query(checkQuery, [id, organizacionId]);

            if (checkResult.rows.length === 0) {
                throw new Error('Producto no encontrado');
            }

            const producto = checkResult.rows[0];
            const nuevoStock = producto.stock_actual + ajuste.cantidad_ajuste;

            if (nuevoStock < 0) {
                throw new Error(`Stock insuficiente. Stock actual: ${producto.stock_actual}, ajuste: ${ajuste.cantidad_ajuste}`);
            }

            // 2. Actualizar stock del producto
            const updateQuery = `
                UPDATE productos
                SET stock_actual = $1,
                    actualizado_en = NOW()
                WHERE id = $2 AND organizacion_id = $3
                RETURNING *
            `;
            const updateResult = await db.query(updateQuery, [nuevoStock, id, organizacionId]);

            // 3. Registrar movimiento de inventario
            const movimientoQuery = `
                INSERT INTO movimientos_inventario (
                    organizacion_id, producto_id, tipo_movimiento, cantidad,
                    stock_antes, stock_despues, motivo, referencia
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `;

            const movimientoValues = [
                organizacionId,
                id,
                ajuste.tipo_movimiento,
                ajuste.cantidad_ajuste,
                producto.stock_actual,
                nuevoStock,
                ajuste.motivo,
                `Ajuste manual de stock`
            ];

            await db.query(movimientoQuery, movimientoValues);

            return updateResult.rows[0];
        });
    }

    /**
     * Búsqueda avanzada de productos (full-text search + código de barras)
     */
    static async buscar(filtros, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const { q, tipo_busqueda, categoria_id, proveedor_id, solo_activos, solo_con_stock, limit } = filtros;

            let query = `
                SELECT
                    p.*,
                    c.nombre AS nombre_categoria,
                    prov.nombre AS nombre_proveedor
                FROM productos p
                LEFT JOIN categorias_productos c ON c.id = p.categoria_id
                LEFT JOIN proveedores prov ON prov.id = p.proveedor_id
                WHERE p.organizacion_id = $1
            `;

            const values = [organizacionId];
            let valueIndex = 2;

            // Búsqueda según tipo
            if (tipo_busqueda === 'nombre' || tipo_busqueda === 'all') {
                query += ` AND p.nombre ILIKE $${valueIndex}`;
                values.push(`%${q}%`);
                valueIndex++;
            }

            if (tipo_busqueda === 'sku' || tipo_busqueda === 'all') {
                if (tipo_busqueda === 'all') {
                    query += ` OR p.sku ILIKE $${valueIndex - 1}`;
                } else {
                    query += ` AND p.sku ILIKE $${valueIndex}`;
                    values.push(`%${q}%`);
                    valueIndex++;
                }
            }

            if (tipo_busqueda === 'codigo_barras' || tipo_busqueda === 'all') {
                if (tipo_busqueda === 'all') {
                    query += ` OR p.codigo_barras = $${valueIndex - 1}`;
                } else {
                    query += ` AND p.codigo_barras = $${valueIndex}`;
                    values.push(q);
                    valueIndex++;
                }
            }

            // Filtros adicionales
            if (categoria_id) {
                query += ` AND p.categoria_id = $${valueIndex}`;
                values.push(categoria_id);
                valueIndex++;
            }

            if (proveedor_id) {
                query += ` AND p.proveedor_id = $${valueIndex}`;
                values.push(proveedor_id);
                valueIndex++;
            }

            if (solo_activos) {
                query += ` AND p.activo = true`;
            }

            if (solo_con_stock) {
                query += ` AND p.stock_actual > 0`;
            }

            query += ` ORDER BY p.nombre ASC LIMIT $${valueIndex}`;
            values.push(limit);

            const result = await db.query(query, values);

            return result.rows;
        });
    }
}

module.exports = ProductosModel;
