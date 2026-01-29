const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');
const { ErrorHelper } = require('../../../utils/helpers');

/**
 * Model para CRUD de variantes de producto
 * Maneja combinaciones de atributos con stock y precios independientes
 */
class VariantesModel {

    // =========================================================================
    // CRUD VARIANTES
    // =========================================================================

    /**
     * Crear una variante individual
     */
    static async crear(productoId, datos, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Crear la variante
            const varianteQuery = `
                INSERT INTO variantes_producto (
                    organizacion_id, producto_id, sku, codigo_barras,
                    nombre_variante, precio_compra, precio_venta,
                    stock_actual, stock_minimo, stock_maximo, imagen_url
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *
            `;

            const varianteValues = [
                organizacionId,
                productoId,
                datos.sku || null,
                datos.codigo_barras || null,
                datos.nombre_variante,
                datos.precio_compra || null,
                datos.precio_venta || null,
                datos.stock_actual || 0,
                datos.stock_minimo || 5,
                datos.stock_maximo || 100,
                datos.imagen_url || null
            ];

            const varianteResult = await db.query(varianteQuery, varianteValues);
            const variante = varianteResult.rows[0];

            // Asociar atributos si se proporcionaron
            if (datos.atributos && datos.atributos.length > 0) {
                for (const attr of datos.atributos) {
                    await db.query(`
                        INSERT INTO variantes_atributos (variante_id, atributo_id, valor_id)
                        VALUES ($1, $2, $3)
                    `, [variante.id, attr.atributo_id, attr.valor_id]);
                }
            }

            // Marcar producto como con variantes
            await db.query(`
                UPDATE productos SET tiene_variantes = true
                WHERE id = $1
            `, [productoId]);

            logger.info(`Variante creada: ${variante.id} para producto ${productoId}`);
            return variante;
        });
    }

    /**
     * Listar variantes de un producto
     */
    static async listarPorProducto(productoId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    v.*,
                    p.nombre as producto_nombre,
                    p.precio_venta as producto_precio_venta,
                    p.precio_compra as producto_precio_compra,
                    p.imagen_url as producto_imagen_url,
                    COALESCE(v.precio_venta, p.precio_venta) as precio_venta_efectivo,
                    COALESCE(v.precio_compra, p.precio_compra) as precio_compra_efectivo,
                    COALESCE(v.imagen_url, p.imagen_url) as imagen_url_efectiva,
                    (
                        SELECT json_agg(json_build_object(
                            'atributo_id', va.atributo_id,
                            'atributo_nombre', ap.nombre,
                            'atributo_codigo', ap.codigo,
                            'valor_id', va.valor_id,
                            'valor', val.valor,
                            'valor_codigo', val.codigo,
                            'color_hex', val.color_hex
                        ) ORDER BY ap.orden)
                        FROM variantes_atributos va
                        JOIN atributos_producto ap ON ap.id = va.atributo_id
                        JOIN valores_atributo val ON val.id = va.valor_id
                        WHERE va.variante_id = v.id
                    ) as atributos
                FROM variantes_producto v
                JOIN productos p ON p.id = v.producto_id
                WHERE v.producto_id = $1 AND v.activo = true
                ORDER BY v.nombre_variante
            `;

            const result = await db.query(query, [productoId]);
            return result.rows;
        });
    }

    /**
     * Buscar variante por ID
     */
    static async buscarPorId(organizacionId, id) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    v.*,
                    p.nombre as producto_nombre,
                    COALESCE(v.precio_venta, p.precio_venta) as precio_venta_efectivo,
                    COALESCE(v.precio_compra, p.precio_compra) as precio_compra_efectivo,
                    (
                        SELECT json_agg(json_build_object(
                            'atributo_id', va.atributo_id,
                            'atributo_nombre', ap.nombre,
                            'valor_id', va.valor_id,
                            'valor', val.valor,
                            'color_hex', val.color_hex
                        ))
                        FROM variantes_atributos va
                        JOIN atributos_producto ap ON ap.id = va.atributo_id
                        JOIN valores_atributo val ON val.id = va.valor_id
                        WHERE va.variante_id = v.id
                    ) as atributos
                FROM variantes_producto v
                JOIN productos p ON p.id = v.producto_id
                WHERE v.id = $1 AND v.organizacion_id = $2
            `;

            const result = await db.query(query, [id, organizacionId]);
            return result.rows[0] || null;
        });
    }

    /**
     * Buscar variante por SKU o codigo de barras
     */
    static async buscar(termino, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    v.*,
                    p.nombre as producto_nombre,
                    COALESCE(v.precio_venta, p.precio_venta) as precio_venta_efectivo,
                    COALESCE(v.imagen_url, p.imagen_url) as imagen_url_efectiva,
                    (
                        SELECT json_agg(json_build_object(
                            'atributo_nombre', ap.nombre,
                            'valor', val.valor,
                            'color_hex', val.color_hex
                        ))
                        FROM variantes_atributos va
                        JOIN atributos_producto ap ON ap.id = va.atributo_id
                        JOIN valores_atributo val ON val.id = va.valor_id
                        WHERE va.variante_id = v.id
                    ) as atributos
                FROM variantes_producto v
                JOIN productos p ON p.id = v.producto_id
                WHERE v.organizacion_id = $1
                  AND v.activo = true
                  AND (v.sku = $2 OR v.codigo_barras = $2)
                LIMIT 1
            `;

            const result = await db.query(query, [organizacionId, termino]);
            return result.rows[0] || null;
        });
    }

    /**
     * Actualizar variante
     */
    static async actualizar(id, datos, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const campos = [];
            const values = [];
            let idx = 1;

            const camposPermitidos = [
                'sku', 'codigo_barras', 'nombre_variante',
                'precio_compra', 'precio_venta',
                'stock_minimo', 'stock_maximo', 'imagen_url', 'activo'
            ];

            for (const campo of camposPermitidos) {
                if (datos[campo] !== undefined) {
                    campos.push(`${campo} = $${idx++}`);
                    values.push(datos[campo]);
                }
            }

            if (campos.length === 0) {
                return await this.obtenerPorId(id, organizacionId);
            }

            values.push(id, organizacionId);

            const query = `
                UPDATE variantes_producto
                SET ${campos.join(', ')}, actualizado_en = NOW()
                WHERE id = $${idx++} AND organizacion_id = $${idx}
                RETURNING *
            `;

            const result = await db.query(query, values);
            return result.rows[0];
        });
    }

    /**
     * Ajustar stock de una variante
     * Ene 2026: Refactorizado para usar registrar_movimiento_con_ubicacion()
     */
    static async ajustarStock(id, cantidad, tipo, motivo, usuarioId, organizacionId, sucursalId = null) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Obtener variante actual
            const varianteQuery = `
                SELECT v.*, p.id as producto_id
                FROM variantes_producto v
                JOIN productos p ON p.id = v.producto_id
                WHERE v.id = $1 AND v.organizacion_id = $2
            `;
            const varianteResult = await db.query(varianteQuery, [id, organizacionId]);

            ErrorHelper.throwIfNotFound(varianteResult.rows[0], 'Variante');

            const variante = varianteResult.rows[0];
            const stockAntes = variante.stock_actual;
            const cantidadAjuste = tipo.startsWith('entrada') ? Math.abs(cantidad) : -Math.abs(cantidad);

            // Usar función consolidada para registrar movimiento
            await db.query(`
                SELECT registrar_movimiento_con_ubicacion(
                    $1,  -- organizacion_id
                    $2,  -- producto_id
                    $3,  -- tipo_movimiento
                    $4,  -- cantidad
                    $5,  -- sucursal_id
                    NULL, -- ubicacion_id
                    NULL, -- lote
                    NULL, -- fecha_vencimiento
                    NULL, -- referencia
                    $6,  -- motivo
                    $7,  -- usuario_id
                    NULL, -- costo_unitario
                    NULL, -- proveedor_id
                    NULL, -- venta_pos_id
                    NULL, -- cita_id
                    $8   -- variante_id
                )
            `, [
                organizacionId,
                variante.producto_id,
                tipo,
                cantidadAjuste,
                sucursalId,
                motivo,
                usuarioId,
                id
            ]);

            // Obtener stock actualizado
            const stockActualizado = await db.query(
                `SELECT stock_actual FROM variantes_producto WHERE id = $1`,
                [id]
            );
            const stockDespues = stockActualizado.rows[0].stock_actual;

            logger.info(`Stock ajustado variante ${id}: ${stockAntes} -> ${stockDespues}`);

            return {
                variante_id: id,
                stock_antes: stockAntes,
                stock_despues: stockDespues,
                cantidad: cantidadAjuste
            };
        });
    }

    /**
     * Eliminar variante (soft delete)
     */
    static async eliminar(organizacionId, id) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const query = `
                UPDATE variantes_producto
                SET activo = false, actualizado_en = NOW()
                WHERE id = $1 AND organizacion_id = $2
                RETURNING producto_id
            `;

            const result = await db.query(query, [id, organizacionId]);

            if (result.rows.length > 0) {
                // Verificar si quedan variantes activas
                const checkQuery = `
                    SELECT COUNT(*) as total
                    FROM variantes_producto
                    WHERE producto_id = $1 AND activo = true
                `;
                const checkResult = await db.query(checkQuery, [result.rows[0].producto_id]);

                // Si no quedan variantes, quitar flag del producto
                if (parseInt(checkResult.rows[0].total) === 0) {
                    await db.query(`
                        UPDATE productos SET tiene_variantes = false
                        WHERE id = $1
                    `, [result.rows[0].producto_id]);
                }
            }

            return result.rows[0];
        });
    }

    // =========================================================================
    // GENERACION DE VARIANTES
    // =========================================================================

    /**
     * Generar variantes a partir de combinaciones de atributos
     * @param {number} productoId - ID del producto
     * @param {Array} atributosSeleccionados - Array de { atributo_id, valores: [valor_id, ...] }
     * @param {Object} opciones - { sku_base, precio_venta, precio_compra }
     */
    static async generarVariantes(productoId, atributosSeleccionados, opciones, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Obtener datos del producto
            const productoQuery = `
                SELECT nombre, sku FROM productos WHERE id = $1
            `;
            const productoResult = await db.query(productoQuery, [productoId]);

            ErrorHelper.throwIfNotFound(productoResult.rows[0], 'Producto');

            const producto = productoResult.rows[0];
            const skuBase = opciones.sku_base || producto.sku || 'PROD';

            // Obtener info de valores seleccionados
            const valoresInfo = {};
            for (const attr of atributosSeleccionados) {
                const valoresQuery = `
                    SELECT v.id, v.valor, v.codigo, a.nombre as atributo_nombre
                    FROM valores_atributo v
                    JOIN atributos_producto a ON a.id = v.atributo_id
                    WHERE v.id = ANY($1)
                `;
                const valoresResult = await db.query(valoresQuery, [attr.valores]);
                for (const v of valoresResult.rows) {
                    valoresInfo[v.id] = v;
                }
            }

            // Generar producto cartesiano
            const combinaciones = this._generarCombinaciones(
                atributosSeleccionados.map(a => a.valores)
            );

            const variantesCreadas = [];

            for (const combo of combinaciones) {
                // Construir nombre y SKU
                const partes = combo.map(valorId => valoresInfo[valorId]);
                const nombreVariante = `${producto.nombre} - ${partes.map(p => p.valor).join(' / ')}`;
                const skuVariante = `${skuBase}-${partes.map(p => p.codigo).join('-')}`;

                // Verificar que no exista ya
                const existeQuery = `
                    SELECT id FROM variantes_producto
                    WHERE producto_id = $1 AND sku = $2
                `;
                const existeResult = await db.query(existeQuery, [productoId, skuVariante]);

                if (existeResult.rows.length > 0) {
                    continue; // Skip si ya existe
                }

                // Crear variante
                const varianteQuery = `
                    INSERT INTO variantes_producto (
                        organizacion_id, producto_id, sku, nombre_variante,
                        precio_compra, precio_venta, stock_actual
                    ) VALUES ($1, $2, $3, $4, $5, $6, 0)
                    RETURNING *
                `;

                const varianteResult = await db.query(varianteQuery, [
                    organizacionId,
                    productoId,
                    skuVariante,
                    nombreVariante,
                    opciones.precio_compra || null,
                    opciones.precio_venta || null
                ]);

                const variante = varianteResult.rows[0];

                // Asociar atributos
                for (let i = 0; i < combo.length; i++) {
                    const valorId = combo[i];
                    const atributoId = atributosSeleccionados[i].atributo_id;

                    await db.query(`
                        INSERT INTO variantes_atributos (variante_id, atributo_id, valor_id)
                        VALUES ($1, $2, $3)
                    `, [variante.id, atributoId, valorId]);
                }

                variantesCreadas.push(variante);
            }

            // Marcar producto como con variantes
            if (variantesCreadas.length > 0) {
                // Obtener stock actual del producto
                const stockQuery = await db.query(
                    `SELECT stock_actual FROM productos WHERE id = $1`,
                    [productoId]
                );
                const stockActual = stockQuery.rows[0]?.stock_actual || 0;

                // Marcar como producto con variantes (sin tocar stock_actual directamente)
                await db.query(`
                    UPDATE productos SET tiene_variantes = true
                    WHERE id = $1
                `, [productoId]);

                // Si tenía stock, ajustar a 0 usando función consolidada
                if (stockActual > 0) {
                    const sucursalQuery = await db.query(
                        `SELECT id FROM sucursales
                         WHERE organizacion_id = $1 AND es_matriz = true LIMIT 1`,
                        [organizacionId]
                    );
                    if (sucursalQuery.rows.length > 0) {
                        await db.query(`
                            SELECT registrar_movimiento_con_ubicacion(
                                $1, $2, 'salida_ajuste', $3, $4,
                                NULL, NULL, NULL, NULL,
                                $5, NULL, NULL, NULL, NULL, NULL, NULL
                            )
                        `, [
                            organizacionId,
                            productoId,
                            -stockActual,  // Negativo para reducir
                            sucursalQuery.rows[0].id,
                            'Stock transferido a variantes al activar modo variantes'
                        ]);
                    }
                }
            }

            logger.info(`Generadas ${variantesCreadas.length} variantes para producto ${productoId}`);

            return {
                total: variantesCreadas.length,
                variantes: variantesCreadas
            };
        });
    }

    /**
     * Generar producto cartesiano de arrays
     * @private
     */
    static _generarCombinaciones(arrays) {
        if (arrays.length === 0) return [[]];
        if (arrays.length === 1) return arrays[0].map(v => [v]);

        const resultado = [];
        const primerArray = arrays[0];
        const restoCombinaciones = this._generarCombinaciones(arrays.slice(1));

        for (const valor of primerArray) {
            for (const combo of restoCombinaciones) {
                resultado.push([valor, ...combo]);
            }
        }

        return resultado;
    }

    /**
     * Obtener resumen de stock por variantes
     */
    static async obtenerResumenStock(productoId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    COUNT(*) as total_variantes,
                    SUM(stock_actual) as stock_total,
                    SUM(CASE WHEN stock_actual <= stock_minimo THEN 1 ELSE 0 END) as stock_bajo,
                    SUM(CASE WHEN stock_actual = 0 THEN 1 ELSE 0 END) as sin_stock
                FROM variantes_producto
                WHERE producto_id = $1 AND activo = true
            `;

            const result = await db.query(query, [productoId]);
            return result.rows[0];
        });
    }
}

module.exports = VariantesModel;
