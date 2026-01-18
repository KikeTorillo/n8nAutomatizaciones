/**
 * Modelo para Batch Picking (Wave Picking)
 * Agrupacion de operaciones de picking para procesamiento consolidado
 * Fecha: 31 Diciembre 2025
 */

const RLSContextManager = require('../../../utils/rlsContextManager');

class BatchPickingModel {
    // ==================== CRUD ====================

    /**
     * Crear batch de picking
     */
    static async crear(organizacionId, data, usuarioId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                `SELECT crear_batch_picking($1, $2, $3, $4, $5) as batch_id`,
                [
                    organizacionId,
                    data.sucursal_id,
                    data.operacion_ids,
                    data.nombre || null,
                    usuarioId
                ]
            );
            return result.rows[0].batch_id;
        });
    }

    /**
     * Listar batches
     */
    static async listar(organizacionId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            let query = `
                SELECT
                    bp.*,
                    s.nombre as sucursal_nombre,
                    u.nombre as asignado_nombre,
                    uc.nombre as creado_por_nombre,
                    ROUND((bp.total_items_procesados::DECIMAL / NULLIF(bp.total_items, 0)) * 100, 1) as porcentaje_completado
                FROM batch_pickings bp
                JOIN sucursales s ON s.id = bp.sucursal_id
                LEFT JOIN usuarios u ON u.id = bp.asignado_a
                LEFT JOIN usuarios uc ON uc.id = bp.creado_por
                WHERE bp.organizacion_id = $1
            `;
            const params = [organizacionId];
            let paramIndex = 2;

            if (filtros.sucursal_id) {
                query += ` AND bp.sucursal_id = $${paramIndex++}`;
                params.push(filtros.sucursal_id);
            }

            if (filtros.estado) {
                query += ` AND bp.estado = $${paramIndex++}`;
                params.push(filtros.estado);
            }

            if (filtros.estados) {
                query += ` AND bp.estado = ANY($${paramIndex++})`;
                params.push(filtros.estados);
            }

            if (filtros.asignado_a) {
                query += ` AND bp.asignado_a = $${paramIndex++}`;
                params.push(filtros.asignado_a);
            }

            query += ' ORDER BY bp.prioridad ASC, bp.creado_en DESC';

            if (filtros.limit) {
                query += ` LIMIT $${paramIndex++}`;
                params.push(filtros.limit);
            }

            const result = await client.query(query, params);
            return result.rows;
        });
    }

    /**
     * Obtener batch por ID con operaciones
     */
    static async buscarPorId(organizacionId, id) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const batchResult = await client.query(
                `SELECT
                    bp.*,
                    s.nombre as sucursal_nombre,
                    u.nombre as asignado_nombre,
                    ROUND((bp.total_items_procesados::DECIMAL / NULLIF(bp.total_items, 0)) * 100, 1) as porcentaje_completado
                FROM batch_pickings bp
                JOIN sucursales s ON s.id = bp.sucursal_id
                LEFT JOIN usuarios u ON u.id = bp.asignado_a
                WHERE bp.id = $1 AND bp.organizacion_id = $2`,
                [id, organizacionId]
            );

            if (batchResult.rows.length === 0) {
                return null;
            }

            const operacionesResult = await client.query(
                `SELECT
                    bpo.*,
                    o.folio as operacion_folio,
                    o.estado as operacion_estado,
                    o.origen_folio,
                    o.total_items,
                    o.total_procesados,
                    o.porcentaje_completado
                FROM batch_picking_operaciones bpo
                JOIN operaciones_almacen o ON o.id = bpo.operacion_id
                WHERE bpo.batch_id = $1
                ORDER BY bpo.orden`,
                [id]
            );

            return {
                ...batchResult.rows[0],
                operaciones: operacionesResult.rows
            };
        });
    }

    /**
     * Actualizar batch
     */
    static async actualizar(organizacionId, id, data) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                `UPDATE batch_pickings SET
                    nombre = COALESCE($2, nombre),
                    descripcion = $3,
                    asignado_a = $4,
                    prioridad = COALESCE($5, prioridad),
                    fecha_programada = $6,
                    notas = $7,
                    actualizado_en = NOW()
                WHERE id = $1 AND organizacion_id = $8
                RETURNING *`,
                [
                    id,
                    data.nombre,
                    data.descripcion,
                    data.asignado_a,
                    data.prioridad,
                    data.fecha_programada,
                    data.notas,
                    organizacionId
                ]
            );
            return result.rows[0];
        });
    }

    /**
     * Eliminar batch (solo si esta en borrador)
     */
    static async eliminar(organizacionId, id) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                `DELETE FROM batch_pickings
                WHERE id = $1 AND organizacion_id = $2 AND estado = 'borrador'
                RETURNING id`,
                [id, organizacionId]
            );
            return result.rowCount > 0;
        });
    }

    // ==================== GESTION DE OPERACIONES ====================

    /**
     * Agregar operacion al batch
     */
    static async agregarOperacion(batchId, operacionId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            // Obtener siguiente orden
            const ordenResult = await client.query(
                `SELECT COALESCE(MAX(orden), 0) + 1 as siguiente_orden
                FROM batch_picking_operaciones WHERE batch_id = $1`,
                [batchId]
            );
            const orden = ordenResult.rows[0].siguiente_orden;

            const result = await client.query(
                `INSERT INTO batch_picking_operaciones (batch_id, operacion_id, orden)
                VALUES ($1, $2, $3)
                ON CONFLICT (batch_id, operacion_id) DO NOTHING
                RETURNING *`,
                [batchId, operacionId, orden]
            );
            return result.rows[0];
        });
    }

    /**
     * Quitar operacion del batch
     */
    static async quitarOperacion(batchId, operacionId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                `DELETE FROM batch_picking_operaciones
                WHERE batch_id = $1 AND operacion_id = $2
                RETURNING id`,
                [batchId, operacionId]
            );
            return result.rowCount > 0;
        });
    }

    // ==================== PROCESAMIENTO ====================

    /**
     * Iniciar batch
     */
    static async iniciar(batchId, usuarioId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                'SELECT iniciar_batch($1, $2) as resultado',
                [batchId, usuarioId]
            );
            return result.rows[0].resultado;
        });
    }

    /**
     * Procesar item del batch
     */
    static async procesarItem(batchId, productoId, varianteId, ubicacionId, cantidad, usuarioId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                'SELECT procesar_item_batch($1, $2, $3, $4, $5, $6) as resultado',
                [batchId, productoId, varianteId, ubicacionId, cantidad, usuarioId]
            );
            return result.rows[0].resultado;
        });
    }

    /**
     * Completar batch
     */
    static async completar(batchId, usuarioId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                'SELECT completar_batch($1, $2) as resultado',
                [batchId, usuarioId]
            );
            return result.rows[0].resultado;
        });
    }

    /**
     * Cancelar batch
     */
    static async cancelar(batchId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                `UPDATE batch_pickings
                SET estado = 'cancelado', actualizado_en = NOW()
                WHERE id = $1 AND organizacion_id = $2 AND estado NOT IN ('completado', 'cancelado')
                RETURNING *`,
                [batchId, organizacionId]
            );
            return result.rows[0];
        });
    }

    // ==================== LISTA CONSOLIDADA ====================

    /**
     * Obtener lista consolidada de productos a recoger
     */
    static async obtenerListaConsolidada(batchId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                'SELECT * FROM obtener_lista_consolidada_batch($1)',
                [batchId]
            );
            return result.rows;
        });
    }

    // ==================== ESTADISTICAS ====================

    /**
     * Obtener estadisticas del batch
     */
    static async obtenerEstadisticas(batchId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                `SELECT
                    bp.total_operaciones,
                    bp.total_items,
                    bp.total_items_procesados,
                    bp.total_productos_unicos,
                    ROUND((bp.total_items_procesados::DECIMAL / NULLIF(bp.total_items, 0)) * 100, 1) as porcentaje_completado,
                    (SELECT COUNT(*) FROM batch_picking_operaciones bpo
                     JOIN operaciones_almacen o ON o.id = bpo.operacion_id
                     WHERE bpo.batch_id = bp.id AND o.estado = 'completada') as operaciones_completadas,
                    (SELECT COUNT(*) FROM batch_picking_operaciones bpo
                     JOIN operaciones_almacen o ON o.id = bpo.operacion_id
                     WHERE bpo.batch_id = bp.id AND o.estado = 'parcial') as operaciones_parciales
                FROM batch_pickings bp
                WHERE bp.id = $1 AND bp.organizacion_id = $2`,
                [batchId, organizacionId]
            );
            return result.rows[0];
        });
    }

    /**
     * Obtener batches pendientes
     */
    static async obtenerPendientes(sucursalId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                `SELECT * FROM v_batches_pendientes
                WHERE sucursal_id = $1 AND organizacion_id = $2
                ORDER BY prioridad ASC, creado_en ASC`,
                [sucursalId, organizacionId]
            );
            return result.rows;
        });
    }

    // ==================== OPERACIONES DISPONIBLES ====================

    /**
     * Obtener operaciones de picking disponibles para batch
     */
    static async obtenerOperacionesDisponibles(sucursalId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                `SELECT
                    o.id,
                    o.folio,
                    o.nombre,
                    o.estado,
                    o.origen_folio,
                    o.total_items,
                    o.prioridad,
                    o.fecha_programada,
                    o.creado_en
                FROM operaciones_almacen o
                WHERE o.sucursal_id = $1
                  AND o.organizacion_id = $2
                  AND o.tipo_operacion = 'picking'
                  AND o.estado IN ('borrador', 'asignada')
                  AND NOT EXISTS (
                      SELECT 1 FROM batch_picking_operaciones bpo
                      JOIN batch_pickings bp ON bp.id = bpo.batch_id
                      WHERE bpo.operacion_id = o.id
                        AND bp.estado NOT IN ('completado', 'cancelado')
                  )
                ORDER BY o.prioridad ASC, o.creado_en ASC`,
                [sucursalId, organizacionId]
            );
            return result.rows;
        });
    }
}

module.exports = BatchPickingModel;
