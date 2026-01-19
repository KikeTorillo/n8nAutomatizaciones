/**
 * ====================================================================
 * MODEL - COMBOS Y MODIFICADORES
 * ====================================================================
 *
 * Modelo para gestión de:
 * - Combos/Kits de productos
 * - Grupos de modificadores
 * - Opciones de modificadores
 *
 * Migrado desde POS a Inventario - Ene 2026
 * ====================================================================
 */

const RLSContextManager = require('../../../utils/rlsContextManager');

class CombosModel {

    // ========================================================================
    // COMBOS / KITS
    // ========================================================================

    /**
     * Verificar si un producto es combo
     * @param {number} productoId
     * @param {number} organizacionId
     * @returns {boolean}
     */
    static async esCombo(productoId, organizacionId) {
        return RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(
                'SELECT producto_es_combo($1) AS es_combo',
                [productoId]
            );
            return result.rows[0]?.es_combo || false;
        });
    }

    /**
     * Obtener configuración de combo
     * @param {number} productoId
     * @param {number} organizacionId
     */
    static async obtenerCombo(productoId, organizacionId) {
        return RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(`
                SELECT
                    pc.*,
                    p.nombre AS producto_nombre,
                    p.sku AS producto_sku,
                    p.precio_venta AS precio_padre
                FROM productos_combo pc
                JOIN productos p ON p.id = pc.producto_id
                WHERE pc.producto_id = $1
            `, [productoId]);

            if (result.rows.length === 0) return null;

            const combo = result.rows[0];

            // Obtener componentes
            const componentes = await db.query(
                'SELECT * FROM obtener_componentes_combo($1)',
                [productoId]
            );

            return {
                ...combo,
                componentes: componentes.rows
            };
        });
    }

    /**
     * Listar productos que son combos
     * @param {Object} options - { limit, offset, busqueda, activo }
     * @param {number} organizacionId
     */
    static async listarCombos(options, organizacionId) {
        return RLSContextManager.query(organizacionId, async (db) => {
            const { limit = 50, offset = 0, busqueda, activo } = options;

            let whereClause = 'WHERE pc.organizacion_id = $1';
            const params = [organizacionId];
            let paramIndex = 2;

            if (activo !== undefined) {
                whereClause += ` AND pc.activo = $${paramIndex}`;
                params.push(activo);
                paramIndex++;
            }

            if (busqueda) {
                whereClause += ` AND (p.nombre ILIKE $${paramIndex} OR p.sku ILIKE $${paramIndex})`;
                params.push(`%${busqueda}%`);
                paramIndex++;
            }

            // Contar total
            const countResult = await db.query(`
                SELECT COUNT(*) AS total
                FROM productos_combo pc
                JOIN productos p ON p.id = pc.producto_id
                ${whereClause}
            `, params);

            // Obtener datos
            const dataResult = await db.query(`
                SELECT
                    pc.*,
                    p.nombre AS producto_nombre,
                    p.sku AS producto_sku,
                    p.precio_venta AS precio_padre,
                    p.imagen_url,
                    (SELECT COUNT(*) FROM productos_combo_items WHERE combo_id = pc.id) AS total_componentes,
                    calcular_precio_combo(pc.producto_id) AS precio_calculado
                FROM productos_combo pc
                JOIN productos p ON p.id = pc.producto_id
                ${whereClause}
                ORDER BY p.nombre
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `, [...params, limit, offset]);

            return {
                data: dataResult.rows,
                total: parseInt(countResult.rows[0]?.total || 0),
                limit,
                offset
            };
        });
    }

    /**
     * Crear configuración de combo para un producto
     * @param {Object} data
     * @param {number} organizacionId
     */
    static async crearCombo(data, organizacionId) {
        return RLSContextManager.transaction(organizacionId, async (db) => {
            const {
                producto_id,
                tipo_precio = 'fijo',
                descuento_porcentaje = 0,
                manejo_stock = 'descontar_componentes',
                componentes = []
            } = data;

            // Crear configuración de combo
            const comboResult = await db.query(`
                INSERT INTO productos_combo
                    (producto_id, organizacion_id, tipo_precio, descuento_porcentaje, manejo_stock)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `, [producto_id, organizacionId, tipo_precio, descuento_porcentaje, manejo_stock]);

            const combo = comboResult.rows[0];

            // Agregar componentes en 1 query (optimización N+1)
            if (componentes.length > 0) {
                const ids = componentes.map(c => c.producto_id);
                const cantidades = componentes.map(c => c.cantidad || 1);
                const precios = componentes.map(c => c.precio_unitario ?? null);
                const ordenes = componentes.map((_, i) => i);

                await db.query(`
                    INSERT INTO productos_combo_items
                        (combo_id, producto_id, organizacion_id, cantidad, precio_unitario, orden)
                    SELECT
                        $1,
                        unnest($2::int[]),
                        $3,
                        unnest($4::int[]),
                        unnest($5::numeric[]),
                        unnest($6::int[])
                `, [combo.id, ids, organizacionId, cantidades, precios, ordenes]);
            }

            return this.obtenerCombo(producto_id, organizacionId);
        });
    }

    /**
     * Actualizar combo
     * @param {number} productoId
     * @param {Object} data
     * @param {number} organizacionId
     */
    static async actualizarCombo(productoId, data, organizacionId) {
        return RLSContextManager.transaction(organizacionId, async (db) => {
            const {
                tipo_precio,
                descuento_porcentaje,
                manejo_stock,
                activo,
                componentes
            } = data;

            // Obtener combo actual
            const comboActual = await db.query(
                'SELECT id FROM productos_combo WHERE producto_id = $1',
                [productoId]
            );

            if (comboActual.rows.length === 0) {
                return null;
            }

            const comboId = comboActual.rows[0].id;

            // Construir UPDATE dinámico
            const updates = [];
            const values = [];
            let paramIndex = 1;

            if (tipo_precio !== undefined) {
                updates.push(`tipo_precio = $${paramIndex}`);
                values.push(tipo_precio);
                paramIndex++;
            }
            if (descuento_porcentaje !== undefined) {
                updates.push(`descuento_porcentaje = $${paramIndex}`);
                values.push(descuento_porcentaje);
                paramIndex++;
            }
            if (manejo_stock !== undefined) {
                updates.push(`manejo_stock = $${paramIndex}`);
                values.push(manejo_stock);
                paramIndex++;
            }
            if (activo !== undefined) {
                updates.push(`activo = $${paramIndex}`);
                values.push(activo);
                paramIndex++;
            }

            if (updates.length > 0) {
                updates.push('actualizado_en = CURRENT_TIMESTAMP');
                values.push(productoId);

                await db.query(`
                    UPDATE productos_combo
                    SET ${updates.join(', ')}
                    WHERE producto_id = $${paramIndex}
                `, values);
            }

            // Actualizar componentes si se enviaron
            if (componentes !== undefined) {
                // Eliminar componentes actuales
                await db.query(
                    'DELETE FROM productos_combo_items WHERE combo_id = $1',
                    [comboId]
                );

                // Insertar nuevos en 1 query (optimización N+1)
                if (componentes.length > 0) {
                    const ids = componentes.map(c => c.producto_id);
                    const cantidades = componentes.map(c => c.cantidad || 1);
                    const precios = componentes.map(c => c.precio_unitario ?? null);
                    const ordenes = componentes.map((_, i) => i);

                    await db.query(`
                        INSERT INTO productos_combo_items
                            (combo_id, producto_id, organizacion_id, cantidad, precio_unitario, orden)
                        SELECT
                            $1,
                            unnest($2::int[]),
                            $3,
                            unnest($4::int[]),
                            unnest($5::numeric[]),
                            unnest($6::int[])
                    `, [comboId, ids, organizacionId, cantidades, precios, ordenes]);
                }
            }

            return this.obtenerCombo(productoId, organizacionId);
        });
    }

    /**
     * Eliminar combo
     * @param {number} productoId
     * @param {number} organizacionId
     */
    static async eliminarCombo(productoId, organizacionId) {
        return RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(`
                DELETE FROM productos_combo
                WHERE producto_id = $1
                RETURNING *
            `, [productoId]);

            return result.rows[0] || null;
        });
    }

    /**
     * Calcular precio de un combo
     * @param {number} productoId
     * @param {number} organizacionId
     */
    static async calcularPrecio(productoId, organizacionId) {
        return RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(
                'SELECT calcular_precio_combo($1) AS precio',
                [productoId]
            );
            return parseFloat(result.rows[0]?.precio || 0);
        });
    }

    /**
     * Verificar stock de componentes
     * @param {number} productoId
     * @param {number} cantidad
     * @param {number} organizacionId
     */
    static async verificarStock(productoId, cantidad, organizacionId) {
        return RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(
                'SELECT * FROM verificar_stock_combo($1, $2)',
                [productoId, cantidad]
            );

            const componentes = result.rows;
            const hayStock = componentes.every(c => c.tiene_stock);

            return {
                disponible: hayStock,
                componentes
            };
        });
    }

    // ========================================================================
    // GRUPOS DE MODIFICADORES
    // ========================================================================

    /**
     * Listar grupos de modificadores
     * @param {Object} options
     * @param {number} organizacionId
     */
    static async listarGrupos(options, organizacionId) {
        return RLSContextManager.query(organizacionId, async (db) => {
            const { activo, incluirModificadores = true } = options;

            let whereClause = 'WHERE organizacion_id = $1';
            const params = [organizacionId];
            let paramIndex = 2;

            if (activo !== undefined) {
                whereClause += ` AND activo = $${paramIndex}`;
                params.push(activo);
            }

            // Optimización: incluir modificadores con json_agg en la misma query
            const result = await db.query(`
                SELECT
                    gm.*,
                    (SELECT COUNT(*) FROM modificadores WHERE grupo_id = gm.id AND activo = true) AS total_modificadores
                    ${incluirModificadores ? `,
                    COALESCE(
                        (SELECT json_agg(m ORDER BY m.orden, m.nombre)
                         FROM modificadores m
                         WHERE m.grupo_id = gm.id AND m.activo = true),
                        '[]'::json
                    ) AS modificadores` : ''}
                FROM grupos_modificadores gm
                ${whereClause}
                ORDER BY gm.orden, gm.nombre
            `, params);

            return result.rows;
        });
    }

    /**
     * Crear grupo de modificadores
     * @param {Object} data
     * @param {number} organizacionId
     */
    static async crearGrupo(data, organizacionId) {
        return RLSContextManager.transaction(organizacionId, async (db) => {
            const {
                nombre,
                codigo,
                descripcion,
                tipo_seleccion = 'unico',
                requerido = false,
                minimo_seleccion = 0,
                maximo_seleccion = null,
                orden = 0,
                modificadores = []
            } = data;

            // Crear grupo
            const grupoResult = await db.query(`
                INSERT INTO grupos_modificadores
                    (organizacion_id, nombre, codigo, descripcion, tipo_seleccion,
                     requerido, minimo_seleccion, maximo_seleccion, orden)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
            `, [
                organizacionId,
                nombre,
                codigo,
                descripcion,
                tipo_seleccion,
                requerido,
                minimo_seleccion,
                maximo_seleccion,
                orden
            ]);

            const grupo = grupoResult.rows[0];

            // Crear modificadores iniciales
            for (let i = 0; i < modificadores.length; i++) {
                const mod = modificadores[i];
                await db.query(`
                    INSERT INTO modificadores
                        (grupo_id, organizacion_id, nombre, codigo, prefijo,
                         precio_adicional, es_default, orden)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `, [
                    grupo.id,
                    organizacionId,
                    mod.nombre,
                    mod.codigo,
                    mod.prefijo,
                    mod.precio_adicional || 0,
                    mod.es_default || false,
                    i
                ]);
            }

            // Retornar con modificadores
            const modsResult = await db.query(
                'SELECT * FROM modificadores WHERE grupo_id = $1 ORDER BY orden',
                [grupo.id]
            );
            grupo.modificadores = modsResult.rows;

            return grupo;
        });
    }

    /**
     * Actualizar grupo de modificadores
     * @param {number} grupoId
     * @param {Object} data
     * @param {number} organizacionId
     */
    static async actualizarGrupo(grupoId, data, organizacionId) {
        return RLSContextManager.query(organizacionId, async (db) => {
            const fields = [];
            const values = [];
            let paramIndex = 1;

            const allowedFields = [
                'nombre', 'codigo', 'descripcion', 'tipo_seleccion',
                'requerido', 'minimo_seleccion', 'maximo_seleccion', 'orden', 'activo'
            ];

            for (const field of allowedFields) {
                if (data[field] !== undefined) {
                    fields.push(`${field} = $${paramIndex}`);
                    values.push(data[field]);
                    paramIndex++;
                }
            }

            if (fields.length === 0) return null;

            fields.push('actualizado_en = CURRENT_TIMESTAMP');
            values.push(grupoId);

            const result = await db.query(`
                UPDATE grupos_modificadores
                SET ${fields.join(', ')}
                WHERE id = $${paramIndex}
                RETURNING *
            `, values);

            return result.rows[0] || null;
        });
    }

    /**
     * Eliminar grupo de modificadores
     * @param {number} grupoId
     * @param {number} organizacionId
     */
    static async eliminarGrupo(grupoId, organizacionId) {
        return RLSContextManager.query(organizacionId, async (db) => {
            // Verificar que no tenga asignaciones
            const asignaciones = await db.query(`
                SELECT COUNT(*) AS total
                FROM productos_grupos_modificadores
                WHERE grupo_id = $1
            `, [grupoId]);

            if (parseInt(asignaciones.rows[0]?.total) > 0) {
                throw new Error('El grupo tiene asignaciones a productos. Elimine las asignaciones primero.');
            }

            const result = await db.query(`
                DELETE FROM grupos_modificadores
                WHERE id = $1
                RETURNING *
            `, [grupoId]);

            return result.rows[0] || null;
        });
    }

    // ========================================================================
    // MODIFICADORES
    // ========================================================================

    /**
     * Crear modificador
     * @param {Object} data
     * @param {number} organizacionId
     */
    static async crearModificador(data, organizacionId) {
        return RLSContextManager.query(organizacionId, async (db) => {
            const {
                grupo_id,
                nombre,
                codigo,
                descripcion,
                prefijo,
                precio_adicional = 0,
                producto_id = null,
                es_default = false,
                orden = 0
            } = data;

            const result = await db.query(`
                INSERT INTO modificadores
                    (grupo_id, organizacion_id, nombre, codigo, descripcion,
                     prefijo, precio_adicional, producto_id, es_default, orden)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING *
            `, [
                grupo_id,
                organizacionId,
                nombre,
                codigo,
                descripcion,
                prefijo,
                precio_adicional,
                producto_id,
                es_default,
                orden
            ]);

            return result.rows[0];
        });
    }

    /**
     * Actualizar modificador
     * @param {number} modificadorId
     * @param {Object} data
     * @param {number} organizacionId
     */
    static async actualizarModificador(modificadorId, data, organizacionId) {
        return RLSContextManager.query(organizacionId, async (db) => {
            const fields = [];
            const values = [];
            let paramIndex = 1;

            const allowedFields = [
                'nombre', 'codigo', 'descripcion', 'prefijo',
                'precio_adicional', 'producto_id', 'es_default', 'orden', 'activo'
            ];

            for (const field of allowedFields) {
                if (data[field] !== undefined) {
                    fields.push(`${field} = $${paramIndex}`);
                    values.push(data[field]);
                    paramIndex++;
                }
            }

            if (fields.length === 0) return null;

            fields.push('actualizado_en = CURRENT_TIMESTAMP');
            values.push(modificadorId);

            const result = await db.query(`
                UPDATE modificadores
                SET ${fields.join(', ')}
                WHERE id = $${paramIndex}
                RETURNING *
            `, values);

            return result.rows[0] || null;
        });
    }

    /**
     * Eliminar modificador
     * @param {number} modificadorId
     * @param {number} organizacionId
     */
    static async eliminarModificador(modificadorId, organizacionId) {
        return RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(`
                DELETE FROM modificadores
                WHERE id = $1
                RETURNING *
            `, [modificadorId]);

            return result.rows[0] || null;
        });
    }

    // ========================================================================
    // ASIGNACIÓN DE MODIFICADORES A PRODUCTOS
    // ========================================================================

    /**
     * Obtener modificadores de un producto
     * @param {number} productoId
     * @param {number} organizacionId
     */
    static async obtenerModificadoresProducto(productoId, organizacionId) {
        return RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(
                'SELECT * FROM obtener_modificadores_producto($1)',
                [productoId]
            );
            return result.rows;
        });
    }

    /**
     * Verificar si un producto tiene modificadores
     * @param {number} productoId
     * @param {number} organizacionId
     */
    static async tieneModificadores(productoId, organizacionId) {
        return RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(
                'SELECT producto_tiene_modificadores($1) AS tiene',
                [productoId]
            );
            return result.rows[0]?.tiene || false;
        });
    }

    /**
     * Asignar grupo de modificadores a producto
     * @param {Object} data - { producto_id, grupo_id, requerido?, orden? }
     * @param {number} organizacionId
     */
    static async asignarGrupoAProducto(data, organizacionId) {
        return RLSContextManager.query(organizacionId, async (db) => {
            const { producto_id, grupo_id, requerido = null, orden = 0 } = data;

            const result = await db.query(`
                INSERT INTO productos_grupos_modificadores
                    (organizacion_id, producto_id, grupo_id, requerido, orden)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (producto_id, grupo_id)
                DO UPDATE SET requerido = EXCLUDED.requerido, orden = EXCLUDED.orden
                RETURNING *
            `, [organizacionId, producto_id, grupo_id, requerido, orden]);

            return result.rows[0];
        });
    }

    /**
     * Asignar grupo de modificadores a categoría
     * @param {Object} data - { categoria_id, grupo_id, requerido?, orden? }
     * @param {number} organizacionId
     */
    static async asignarGrupoACategoria(data, organizacionId) {
        return RLSContextManager.query(organizacionId, async (db) => {
            const { categoria_id, grupo_id, requerido = null, orden = 0 } = data;

            const result = await db.query(`
                INSERT INTO productos_grupos_modificadores
                    (organizacion_id, categoria_id, grupo_id, requerido, orden)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (categoria_id, grupo_id)
                DO UPDATE SET requerido = EXCLUDED.requerido, orden = EXCLUDED.orden
                RETURNING *
            `, [organizacionId, categoria_id, grupo_id, requerido, orden]);

            return result.rows[0];
        });
    }

    /**
     * Eliminar asignación de grupo a producto
     * @param {number} productoId
     * @param {number} grupoId
     * @param {number} organizacionId
     */
    static async eliminarAsignacionProducto(productoId, grupoId, organizacionId) {
        return RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(`
                DELETE FROM productos_grupos_modificadores
                WHERE producto_id = $1 AND grupo_id = $2
                RETURNING *
            `, [productoId, grupoId]);

            return result.rows[0] || null;
        });
    }

    /**
     * Listar asignaciones de un producto
     * @param {number} productoId
     * @param {number} organizacionId
     */
    static async listarAsignacionesProducto(productoId, organizacionId) {
        return RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(`
                SELECT
                    pgm.*,
                    gm.nombre AS grupo_nombre,
                    gm.tipo_seleccion,
                    gm.requerido AS grupo_requerido
                FROM productos_grupos_modificadores pgm
                JOIN grupos_modificadores gm ON gm.id = pgm.grupo_id
                WHERE pgm.producto_id = $1
                ORDER BY pgm.orden, gm.nombre
            `, [productoId]);

            return result.rows;
        });
    }
}

module.exports = CombosModel;
