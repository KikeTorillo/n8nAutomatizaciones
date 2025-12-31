/**
 * ====================================================================
 * MODEL: Ubicaciones de Almacen (WMS)
 * ====================================================================
 * Gestion de ubicaciones jerarquicas: zona -> pasillo -> estante -> bin
 * Incluye stock por ubicacion y movimientos internos
 */

const RLSContextManager = require('../../../utils/rlsContextManager');

class UbicacionesAlmacenModel {

    // ========================================================================
    // CRUD UBICACIONES
    // ========================================================================

    /**
     * Crear nueva ubicacion
     * @param {Object} data - Datos de la ubicacion
     * @param {number} organizacionId
     * @returns {Object} Ubicacion creada
     */
    static async crear(data, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const {
                sucursal_id,
                codigo,
                nombre,
                descripcion,
                tipo,
                parent_id,
                capacidad_maxima,
                peso_maximo_kg,
                volumen_m3,
                es_picking,
                es_recepcion,
                es_despacho,
                es_cuarentena,
                es_devolucion,
                temperatura_min,
                temperatura_max,
                humedad_controlada,
                orden,
                color,
                icono,
                creado_por
            } = data;

            const query = `
                INSERT INTO ubicaciones_almacen (
                    organizacion_id, sucursal_id, codigo, nombre, descripcion,
                    tipo, parent_id, capacidad_maxima, peso_maximo_kg, volumen_m3,
                    es_picking, es_recepcion, es_despacho, es_cuarentena, es_devolucion,
                    temperatura_min, temperatura_max, humedad_controlada,
                    orden, color, icono, creado_por
                ) VALUES (
                    $1, $2, $3, $4, $5,
                    $6, $7, $8, $9, $10,
                    $11, $12, $13, $14, $15,
                    $16, $17, $18,
                    $19, $20, $21, $22
                )
                RETURNING *
            `;

            const values = [
                organizacionId, sucursal_id, codigo, nombre || null, descripcion || null,
                tipo, parent_id || null, capacidad_maxima || null, peso_maximo_kg || null, volumen_m3 || null,
                es_picking || false, es_recepcion || false, es_despacho || false, es_cuarentena || false, es_devolucion || false,
                temperatura_min || null, temperatura_max || null, humedad_controlada || false,
                orden || 0, color || null, icono || null, creado_por || null
            ];

            const result = await db.query(query, values);
            return result.rows[0];
        });
    }

    /**
     * Obtener ubicacion por ID
     * @param {number} id
     * @param {number} organizacionId
     * @returns {Object|null}
     */
    static async obtenerPorId(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    u.*,
                    s.nombre as sucursal_nombre,
                    p.codigo as parent_codigo,
                    p.nombre as parent_nombre,
                    (
                        SELECT COUNT(*)
                        FROM ubicaciones_almacen hijos
                        WHERE hijos.parent_id = u.id
                    ) as cantidad_hijos,
                    (
                        SELECT COALESCE(SUM(su.cantidad), 0)
                        FROM stock_ubicaciones su
                        WHERE su.ubicacion_id = u.id
                    ) as productos_almacenados
                FROM ubicaciones_almacen u
                LEFT JOIN sucursales s ON u.sucursal_id = s.id
                LEFT JOIN ubicaciones_almacen p ON u.parent_id = p.id
                WHERE u.id = $1
            `;

            const result = await db.query(query, [id]);
            return result.rows[0] || null;
        });
    }

    /**
     * Listar ubicaciones con filtros
     * @param {Object} filtros
     * @param {number} organizacionId
     * @returns {Object} { ubicaciones, total }
     */
    static async listar(filtros, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const {
                sucursal_id,
                tipo,
                parent_id,
                es_picking,
                es_recepcion,
                activo,
                bloqueada,
                busqueda,
                limit = 100,
                offset = 0
            } = filtros;

            let whereConditions = ['1=1'];
            let params = [];
            let paramIndex = 1;

            if (sucursal_id) {
                whereConditions.push(`u.sucursal_id = $${paramIndex++}`);
                params.push(sucursal_id);
            }

            if (tipo) {
                whereConditions.push(`u.tipo = $${paramIndex++}`);
                params.push(tipo);
            }

            if (parent_id !== undefined) {
                if (parent_id === null || parent_id === 'null') {
                    whereConditions.push('u.parent_id IS NULL');
                } else {
                    whereConditions.push(`u.parent_id = $${paramIndex++}`);
                    params.push(parent_id);
                }
            }

            if (es_picking !== undefined) {
                whereConditions.push(`u.es_picking = $${paramIndex++}`);
                params.push(es_picking);
            }

            if (es_recepcion !== undefined) {
                whereConditions.push(`u.es_recepcion = $${paramIndex++}`);
                params.push(es_recepcion);
            }

            if (activo !== undefined) {
                whereConditions.push(`u.activo = $${paramIndex++}`);
                params.push(activo);
            }

            if (bloqueada !== undefined) {
                whereConditions.push(`u.bloqueada = $${paramIndex++}`);
                params.push(bloqueada);
            }

            if (busqueda) {
                whereConditions.push(`(
                    u.codigo ILIKE $${paramIndex} OR
                    u.nombre ILIKE $${paramIndex}
                )`);
                params.push(`%${busqueda}%`);
                paramIndex++;
            }

            const whereClause = whereConditions.join(' AND ');

            // Query principal
            const query = `
                SELECT
                    u.*,
                    s.nombre as sucursal_nombre,
                    p.codigo as parent_codigo,
                    (
                        SELECT COUNT(*)
                        FROM ubicaciones_almacen hijos
                        WHERE hijos.parent_id = u.id
                    ) as cantidad_hijos
                FROM ubicaciones_almacen u
                LEFT JOIN sucursales s ON u.sucursal_id = s.id
                LEFT JOIN ubicaciones_almacen p ON u.parent_id = p.id
                WHERE ${whereClause}
                ORDER BY u.nivel, u.orden, u.codigo
                LIMIT $${paramIndex++} OFFSET $${paramIndex}
            `;
            const queryParams = [...params, limit, offset];

            // Query de conteo
            const countQuery = `
                SELECT COUNT(*) as total
                FROM ubicaciones_almacen u
                WHERE ${whereClause}
            `;

            const [dataResult, countResult] = await Promise.all([
                db.query(query, queryParams),
                db.query(countQuery, params)
            ]);

            return {
                ubicaciones: dataResult.rows,
                total: parseInt(countResult.rows[0]?.total || 0)
            };
        });
    }

    /**
     * Obtener arbol de ubicaciones de una sucursal
     * @param {number} sucursalId
     * @param {number} organizacionId
     * @returns {Array} Arbol jerarquico
     */
    static async obtenerArbol(sucursalId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT * FROM obtener_arbol_ubicaciones($1)
            `;

            const result = await db.query(query, [sucursalId]);

            // Convertir lista plana a arbol
            return this._construirArbol(result.rows);
        });
    }

    /**
     * Construir estructura de arbol desde lista plana
     * @param {Array} ubicaciones
     * @returns {Array}
     */
    static _construirArbol(ubicaciones) {
        const map = new Map();
        const roots = [];

        // Crear mapa de todas las ubicaciones
        // Nota: Usamos 'hijos' para compatibilidad con frontend
        ubicaciones.forEach(u => {
            map.set(u.id, { ...u, hijos: [] });
        });

        // Construir jerarquia
        ubicaciones.forEach(u => {
            const node = map.get(u.id);
            if (u.parent_id && map.has(u.parent_id)) {
                map.get(u.parent_id).hijos.push(node);
            } else {
                roots.push(node);
            }
        });

        return roots;
    }

    /**
     * Actualizar ubicacion
     * @param {number} id
     * @param {Object} data
     * @param {number} organizacionId
     * @returns {Object}
     */
    static async actualizar(id, data, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const campos = [];
            const valores = [];
            let paramIndex = 1;

            const camposPermitidos = [
                'codigo', 'nombre', 'descripcion', 'tipo', 'parent_id',
                'capacidad_maxima', 'peso_maximo_kg', 'volumen_m3',
                'es_picking', 'es_recepcion', 'es_despacho', 'es_cuarentena', 'es_devolucion',
                'temperatura_min', 'temperatura_max', 'humedad_controlada',
                'orden', 'color', 'icono', 'activo', 'bloqueada', 'motivo_bloqueo'
            ];

            for (const campo of camposPermitidos) {
                if (data[campo] !== undefined) {
                    campos.push(`${campo} = $${paramIndex++}`);
                    valores.push(data[campo]);
                }
            }

            if (campos.length === 0) {
                throw new Error('No hay campos para actualizar');
            }

            campos.push(`actualizado_en = NOW()`);
            valores.push(id);

            const query = `
                UPDATE ubicaciones_almacen
                SET ${campos.join(', ')}
                WHERE id = $${paramIndex}
                RETURNING *
            `;

            const result = await db.query(query, valores);

            if (result.rows.length === 0) {
                throw new Error('Ubicacion no encontrada');
            }

            return result.rows[0];
        });
    }

    /**
     * Eliminar ubicacion (solo si no tiene hijos ni stock)
     * @param {number} id
     * @param {number} organizacionId
     * @returns {Object}
     */
    static async eliminar(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Verificar que no tenga hijos
            const hijosResult = await db.query(
                `SELECT COUNT(*) as cantidad FROM ubicaciones_almacen WHERE parent_id = $1`,
                [id]
            );

            if (parseInt(hijosResult.rows[0]?.cantidad) > 0) {
                throw new Error('No se puede eliminar: la ubicacion tiene sub-ubicaciones');
            }

            // Verificar que no tenga stock
            const stockResult = await db.query(
                `SELECT COALESCE(SUM(cantidad), 0) as stock FROM stock_ubicaciones WHERE ubicacion_id = $1`,
                [id]
            );

            if (parseInt(stockResult.rows[0]?.stock) > 0) {
                throw new Error('No se puede eliminar: la ubicacion tiene productos almacenados');
            }

            // Eliminar
            const result = await db.query(
                `DELETE FROM ubicaciones_almacen WHERE id = $1 RETURNING *`,
                [id]
            );

            if (result.rows.length === 0) {
                throw new Error('Ubicacion no encontrada');
            }

            return result.rows[0];
        });
    }

    // ========================================================================
    // STOCK POR UBICACION
    // ========================================================================

    /**
     * Obtener stock de una ubicacion
     * @param {number} ubicacionId
     * @param {number} organizacionId
     * @returns {Array}
     */
    static async obtenerStock(ubicacionId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    su.*,
                    p.nombre as producto_nombre,
                    p.sku,
                    p.codigo_barras,
                    p.precio_venta
                FROM stock_ubicaciones su
                JOIN productos p ON su.producto_id = p.id
                WHERE su.ubicacion_id = $1
                AND su.cantidad > 0
                ORDER BY su.fecha_entrada DESC
            `;

            const result = await db.query(query, [ubicacionId]);
            return result.rows;
        });
    }

    /**
     * Obtener ubicaciones donde esta un producto
     * @param {number} productoId
     * @param {number} organizacionId
     * @returns {Array}
     */
    static async obtenerUbicacionesProducto(productoId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    su.*,
                    u.codigo as ubicacion_codigo,
                    u.nombre as ubicacion_nombre,
                    u.tipo as ubicacion_tipo,
                    s.nombre as sucursal_nombre
                FROM stock_ubicaciones su
                JOIN ubicaciones_almacen u ON su.ubicacion_id = u.id
                JOIN sucursales s ON u.sucursal_id = s.id
                WHERE su.producto_id = $1
                AND su.cantidad > 0
                ORDER BY u.es_picking DESC, su.fecha_entrada ASC
            `;

            const result = await db.query(query, [productoId]);
            return result.rows;
        });
    }

    /**
     * Obtener ubicaciones disponibles para almacenar
     * @param {number} sucursalId
     * @param {number} cantidadRequerida
     * @param {number} organizacionId
     * @returns {Array}
     */
    static async obtenerDisponibles(sucursalId, cantidadRequerida, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT * FROM obtener_ubicaciones_disponibles($1, $2)
            `;

            const result = await db.query(query, [sucursalId, cantidadRequerida]);
            return result.rows;
        });
    }

    /**
     * Agregar stock a una ubicacion
     * @param {Object} data
     * @param {number} organizacionId
     * @returns {Object}
     */
    static async agregarStock(data, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const { ubicacion_id, producto_id, cantidad, lote, fecha_vencimiento } = data;

            const query = `
                INSERT INTO stock_ubicaciones (
                    organizacion_id, ubicacion_id, producto_id, cantidad, lote, fecha_vencimiento
                ) VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (ubicacion_id, producto_id, lote)
                DO UPDATE SET
                    cantidad = stock_ubicaciones.cantidad + $4,
                    actualizado_en = NOW()
                RETURNING *
            `;

            const result = await db.query(
                query,
                [organizacionId, ubicacion_id, producto_id, cantidad, lote || null, fecha_vencimiento || null]
            );

            // Actualizar capacidad ocupada de la ubicacion
            await db.query(
                `UPDATE ubicaciones_almacen SET capacidad_ocupada = capacidad_ocupada + $1 WHERE id = $2`,
                [cantidad, ubicacion_id]
            );

            return result.rows[0];
        });
    }

    /**
     * Mover stock entre ubicaciones
     * @param {Object} data
     * @param {number} organizacionId
     * @returns {boolean}
     */
    static async moverStock(data, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const { producto_id, ubicacion_origen_id, ubicacion_destino_id, cantidad, lote, usuario_id } = data;

            const query = `
                SELECT mover_stock_ubicacion($1, $2, $3, $4, $5, $6)
            `;

            await db.query(
                query,
                [producto_id, ubicacion_origen_id, ubicacion_destino_id, cantidad, lote || null, usuario_id || null]
            );

            return true;
        });
    }

    // ========================================================================
    // ESTADISTICAS
    // ========================================================================

    /**
     * Obtener estadisticas de ubicaciones de una sucursal
     * @param {number} sucursalId
     * @param {number} organizacionId
     * @returns {Object}
     */
    static async obtenerEstadisticas(sucursalId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    COUNT(*) as total_ubicaciones,
                    COUNT(*) FILTER (WHERE tipo = 'zona') as zonas,
                    COUNT(*) FILTER (WHERE tipo = 'pasillo') as pasillos,
                    COUNT(*) FILTER (WHERE tipo = 'estante') as estantes,
                    COUNT(*) FILTER (WHERE tipo = 'bin') as bins,
                    COUNT(*) FILTER (WHERE activo = true) as activas,
                    COUNT(*) FILTER (WHERE bloqueada = true) as bloqueadas,
                    COUNT(*) FILTER (WHERE es_picking = true) as picking,
                    COUNT(*) FILTER (WHERE es_recepcion = true) as recepcion,
                    COALESCE(SUM(capacidad_maxima), 0) as capacidad_total,
                    COALESCE(SUM(capacidad_ocupada), 0) as capacidad_usada
                FROM ubicaciones_almacen
                WHERE sucursal_id = $1
            `;

            const result = await db.query(query, [sucursalId]);

            const stats = result.rows[0];
            stats.porcentaje_ocupacion = stats.capacidad_total > 0
                ? Math.round((stats.capacidad_usada / stats.capacidad_total) * 100)
                : 0;

            return stats;
        });
    }
}

module.exports = UbicacionesAlmacenModel;
