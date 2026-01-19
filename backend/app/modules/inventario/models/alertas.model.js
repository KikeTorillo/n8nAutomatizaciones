const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');
const { ErrorHelper } = require('../../../utils/helpers');

/**
 * Model para consultar alertas de inventario
 * NOTA: Las alertas son generadas automáticamente por triggers
 */
class AlertasInventarioModel {

    /**
     * Listar alertas con filtros
     */
    static async listar(organizacionId, filtros) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereConditions = ['a.organizacion_id = $1'];
            let values = [organizacionId];
            let paramCounter = 2;

            // Filtro por tipo de alerta
            if (filtros.tipo_alerta) {
                whereConditions.push(`a.tipo_alerta = $${paramCounter}`);
                values.push(filtros.tipo_alerta);
                paramCounter++;
            }

            // Filtro por nivel
            if (filtros.nivel) {
                whereConditions.push(`a.nivel = $${paramCounter}`);
                values.push(filtros.nivel);
                paramCounter++;
            }

            // Filtro por estado leída
            if (filtros.leida !== undefined) {
                whereConditions.push(`a.leida = $${paramCounter}`);
                values.push(filtros.leida);
                paramCounter++;
            }

            // Filtro por producto
            if (filtros.producto_id) {
                whereConditions.push(`a.producto_id = $${paramCounter}`);
                values.push(filtros.producto_id);
                paramCounter++;
            }

            // Filtro por rango de fechas
            if (filtros.fecha_desde) {
                whereConditions.push(`a.creado_en >= $${paramCounter}`);
                values.push(filtros.fecha_desde);
                paramCounter++;
            }

            if (filtros.fecha_hasta) {
                whereConditions.push(`a.creado_en <= $${paramCounter}`);
                values.push(filtros.fecha_hasta);
                paramCounter++;
            }

            const query = `
                SELECT
                    a.*,
                    p.nombre AS nombre_producto,
                    p.sku,
                    p.stock_actual,
                    p.stock_minimo,
                    c.nombre AS nombre_categoria,
                    u.nombre AS nombre_usuario_leido
                FROM alertas_inventario a
                JOIN productos p ON p.id = a.producto_id
                LEFT JOIN categorias_productos c ON c.id = p.categoria_id
                LEFT JOIN usuarios u ON u.id = a.leida_por
                WHERE ${whereConditions.join(' AND ')}
                ORDER BY
                    CASE
                        WHEN a.nivel = 'critical' THEN 1
                        WHEN a.nivel = 'warning' THEN 2
                        ELSE 3
                    END,
                    a.leida ASC,
                    a.creado_en DESC
                LIMIT $${paramCounter}
                OFFSET $${paramCounter + 1}
            `;

            values.push(filtros.limit || 50);
            values.push(filtros.offset || 0);

            const result = await db.query(query, values);

            // Obtener contadores
            const contadoresQuery = `
                SELECT
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE leida = false) as sin_leer,
                    COUNT(*) FILTER (WHERE nivel = 'critical') as critical,
                    COUNT(*) FILTER (WHERE nivel = 'warning') as warning,
                    COUNT(*) FILTER (WHERE nivel = 'info') as info
                FROM alertas_inventario a
                WHERE ${whereConditions.join(' AND ')}
            `;

            const contadoresResult = await db.query(contadoresQuery, values.slice(0, values.length - 2));

            return {
                alertas: result.rows,
                contadores: contadoresResult.rows[0],
                limit: filtros.limit || 50,
                offset: filtros.offset || 0
            };
        });
    }

    /**
     * Obtener alerta por ID
     */
    static async buscarPorId(organizacionId, id) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    a.*,
                    p.nombre AS nombre_producto,
                    p.sku,
                    p.stock_actual,
                    p.stock_minimo,
                    c.nombre AS nombre_categoria,
                    u.nombre AS nombre_usuario_leido
                FROM alertas_inventario a
                JOIN productos p ON p.id = a.producto_id
                LEFT JOIN categorias_productos c ON c.id = p.categoria_id
                LEFT JOIN usuarios u ON u.id = a.leida_por
                WHERE a.id = $1
            `;

            const result = await db.query(query, [id]);
            return result.rows[0] || null;
        });
    }

    /**
     * Marcar alerta como leída
     */
    static async marcarLeida(id, usuarioId, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[AlertasInventarioModel.marcarLeida] Marcando alerta como leída', {
                alerta_id: id,
                usuario_id: usuarioId
            });

            const query = `
                UPDATE alertas_inventario
                SET
                    leida = true,
                    leida_por = $1,
                    leida_en = NOW()
                WHERE id = $2
                RETURNING *
            `;

            const result = await db.query(query, [usuarioId, id]);

            ErrorHelper.throwIfNotFound(result.rows[0], 'Alerta');

            return result.rows[0];
        });
    }

    /**
     * Marcar múltiples alertas como leídas
     */
    static async marcarVariasLeidas(alertaIds, usuarioId, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[AlertasInventarioModel.marcarVariasLeidas] Marcando alertas como leídas', {
                total: alertaIds.length,
                usuario_id: usuarioId
            });

            const query = `
                UPDATE alertas_inventario
                SET
                    leida = true,
                    leida_por = $1,
                    leida_en = NOW()
                WHERE id = ANY($2::int[])
                RETURNING id
            `;

            const result = await db.query(query, [usuarioId, alertaIds]);

            return {
                actualizadas: result.rows.length,
                ids: result.rows.map(r => r.id)
            };
        });
    }

    /**
     * Listar alertas con información de stock proyectado
     * Permite filtrar solo las que necesitan acción (no tienen OC pendiente)
     */
    static async listarConProyeccion(organizacionId, filtros) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereConditions = ['v.organizacion_id = $1'];
            let values = [organizacionId];
            let paramCounter = 2;

            // Filtro por tipo de alerta
            if (filtros.tipo_alerta) {
                whereConditions.push(`v.tipo_alerta = $${paramCounter}`);
                values.push(filtros.tipo_alerta);
                paramCounter++;
            }

            // Filtro por nivel
            if (filtros.nivel) {
                whereConditions.push(`v.nivel = $${paramCounter}`);
                values.push(filtros.nivel);
                paramCounter++;
            }

            // Filtro por estado leída
            if (filtros.leida !== undefined) {
                whereConditions.push(`v.leida = $${paramCounter}`);
                values.push(filtros.leida);
                paramCounter++;
            }

            // Filtro por producto
            if (filtros.producto_id) {
                whereConditions.push(`v.producto_id = $${paramCounter}`);
                values.push(filtros.producto_id);
                paramCounter++;
            }

            // Filtro solo las que necesitan acción (no tienen OC pendiente cubriendo el stock)
            if (filtros.solo_necesitan_accion) {
                whereConditions.push('v.necesita_accion = true');
            }

            const query = `
                SELECT
                    v.*,
                    c.nombre AS nombre_categoria
                FROM v_alertas_con_stock_proyectado v
                LEFT JOIN productos p ON p.id = v.producto_id
                LEFT JOIN categorias_productos c ON c.id = p.categoria_id
                WHERE ${whereConditions.join(' AND ')}
                ORDER BY
                    CASE
                        WHEN v.nivel = 'critical' THEN 1
                        WHEN v.nivel = 'warning' THEN 2
                        ELSE 3
                    END,
                    v.leida ASC,
                    v.creado_en DESC
                LIMIT $${paramCounter}
                OFFSET $${paramCounter + 1}
            `;

            values.push(filtros.limit || 50);
            values.push(filtros.offset || 0);

            const result = await db.query(query, values);

            // Obtener contadores con proyección
            const contadoresQuery = `
                SELECT
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE leida = false) as sin_leer,
                    COUNT(*) FILTER (WHERE nivel = 'critical') as critical,
                    COUNT(*) FILTER (WHERE nivel = 'warning') as warning,
                    COUNT(*) FILTER (WHERE nivel = 'info') as info,
                    COUNT(*) FILTER (WHERE necesita_accion = true) as necesitan_accion,
                    COUNT(*) FILTER (WHERE tiene_oc_pendiente = true) as con_oc_pendiente
                FROM v_alertas_con_stock_proyectado v
                WHERE v.organizacion_id = $1
            `;

            const contadoresResult = await db.query(contadoresQuery, [organizacionId]);

            return {
                alertas: result.rows,
                contadores: contadoresResult.rows[0],
                limit: filtros.limit || 50,
                offset: filtros.offset || 0
            };
        });
    }

    /**
     * Verificar si un producto ya tiene OC pendiente
     */
    static async tieneOCPendiente(productoId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(
                'SELECT * FROM calcular_stock_proyectado($1, $2, NULL)',
                [productoId, organizacionId]
            );

            if (result.rows.length === 0) {
                return { tiene_oc_pendiente: false, folio: null, oc_pendientes: 0, stock_proyectado: 0 };
            }

            const row = result.rows[0];
            return {
                tiene_oc_pendiente: row.tiene_oc_pendiente,
                folio: row.oc_pendiente_folio,
                oc_pendientes: row.oc_pendientes,
                stock_proyectado: row.stock_proyectado,
                stock_actual: row.stock_actual
            };
        });
    }

    /**
     * Obtener dashboard de alertas
     */
    static async obtenerDashboard(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Alertas por tipo
            const porTipoQuery = `
                SELECT
                    tipo_alerta,
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE leida = false) as sin_leer
                FROM alertas_inventario
                WHERE organizacion_id = $1
                GROUP BY tipo_alerta
                ORDER BY total DESC
            `;

            const porTipoResult = await db.query(porTipoQuery, [organizacionId]);

            // Alertas por nivel
            const porNivelQuery = `
                SELECT
                    nivel,
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE leida = false) as sin_leer
                FROM alertas_inventario
                WHERE organizacion_id = $1
                GROUP BY nivel
            `;

            const porNivelResult = await db.query(porNivelQuery, [organizacionId]);

            // Alertas críticas no leídas
            const criticasQuery = `
                SELECT
                    a.*,
                    p.nombre AS nombre_producto,
                    p.sku,
                    p.stock_actual
                FROM alertas_inventario a
                JOIN productos p ON p.id = a.producto_id
                WHERE a.organizacion_id = $1
                  AND a.nivel = 'critical'
                  AND a.leida = false
                ORDER BY a.creado_en DESC
                LIMIT 10
            `;

            const criticasResult = await db.query(criticasQuery, [organizacionId]);

            // Total de alertas sin leer
            const totalQuery = `
                SELECT
                    COUNT(*) as total_alertas,
                    COUNT(*) FILTER (WHERE leida = false) as sin_leer,
                    COUNT(*) FILTER (WHERE nivel = 'critical' AND leida = false) as critical_sin_leer
                FROM alertas_inventario
                WHERE organizacion_id = $1
            `;

            const totalResult = await db.query(totalQuery, [organizacionId]);

            return {
                totales: totalResult.rows[0],
                por_tipo: porTipoResult.rows,
                por_nivel: porNivelResult.rows,
                criticas: criticasResult.rows
            };
        });
    }

    /**
     * Limpiar alertas antiguas (leídas > 90 días)
     */
    static async limpiarAntiguas(organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[AlertasInventarioModel.limpiarAntiguas] Limpiando alertas antiguas');

            const query = `
                DELETE FROM alertas_inventario
                WHERE organizacion_id = $1
                  AND leida = true
                  AND leida_en < NOW() - INTERVAL '90 days'
                RETURNING id
            `;

            const result = await db.query(query, [organizacionId]);

            logger.info('[AlertasInventarioModel.limpiarAntiguas] Alertas eliminadas', {
                total: result.rows.length
            });

            return {
                eliminadas: result.rows.length
            };
        });
    }
}

module.exports = AlertasInventarioModel;
