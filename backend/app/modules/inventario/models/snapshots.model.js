const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');

/**
 * Model para Inventory at Date (Snapshots de Inventario)
 * Permite consultar el estado historico del inventario
 */
class SnapshotsModel {

    // ========================================================================
    // CONSULTAS
    // ========================================================================

    /**
     * Listar snapshots disponibles
     */
    static async listar(organizacionId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    id,
                    fecha_snapshot,
                    tipo,
                    total_productos,
                    total_unidades,
                    valor_total,
                    estado,
                    tiempo_generacion_ms,
                    creado_en
                FROM inventario_snapshots
                WHERE organizacion_id = $1
                  AND estado = 'completo'
                ORDER BY fecha_snapshot DESC
                LIMIT $2
                OFFSET $3
            `;

            const result = await db.query(query, [
                organizacionId,
                filtros.limit || 90,
                filtros.offset || 0
            ]);

            return result.rows;
        });
    }

    /**
     * Obtener stock en una fecha especifica
     */
    static async obtenerStockEnFecha(organizacionId, fecha, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            logger.info('[SnapshotsModel.obtenerStockEnFecha] Consultando', {
                organizacion_id: organizacionId,
                fecha,
                filtros
            });

            const result = await db.query(
                `SELECT * FROM obtener_stock_en_fecha($1, $2, $3, $4, $5, $6, $7)`,
                [
                    organizacionId,
                    fecha,
                    filtros.producto_id || null,
                    filtros.categoria_id || null,
                    filtros.solo_con_stock || false,
                    filtros.limit || 1000,
                    filtros.offset || 0
                ]
            );

            // Obtener totales del snapshot
            const snapshotQuery = await db.query(
                `SELECT total_productos, total_unidades, valor_total, creado_en
                 FROM inventario_snapshots
                 WHERE organizacion_id = $1 AND fecha_snapshot = $2 AND estado = 'completo'`,
                [organizacionId, fecha]
            );

            return {
                fecha,
                productos: result.rows,
                totales: snapshotQuery.rows[0] || null,
                filtros: {
                    producto_id: filtros.producto_id,
                    categoria_id: filtros.categoria_id,
                    solo_con_stock: filtros.solo_con_stock
                }
            };
        });
    }

    /**
     * Comparar inventario entre dos fechas
     */
    static async compararFechas(organizacionId, fechaDesde, fechaHasta, soloCambios = true) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            logger.info('[SnapshotsModel.compararFechas] Comparando', {
                organizacion_id: organizacionId,
                fecha_desde: fechaDesde,
                fecha_hasta: fechaHasta
            });

            const result = await db.query(
                `SELECT * FROM comparar_inventario_fechas($1, $2, $3, $4)`,
                [organizacionId, fechaDesde, fechaHasta, soloCambios]
            );

            // Calcular resumen
            let totalAumentaron = 0;
            let totalDisminuyeron = 0;
            let valorGanado = 0;
            let valorPerdido = 0;

            result.rows.forEach(row => {
                if (row.diferencia > 0) {
                    totalAumentaron++;
                    valorGanado += parseFloat(row.diferencia_valor) || 0;
                } else if (row.diferencia < 0) {
                    totalDisminuyeron++;
                    valorPerdido += parseFloat(row.diferencia_valor) || 0;
                }
            });

            return {
                fecha_desde: fechaDesde,
                fecha_hasta: fechaHasta,
                productos: result.rows,
                resumen: {
                    total_productos: result.rows.length,
                    aumentaron: totalAumentaron,
                    disminuyeron: totalDisminuyeron,
                    sin_cambio: result.rows.length - totalAumentaron - totalDisminuyeron,
                    valor_ganado: valorGanado,
                    valor_perdido: valorPerdido,
                    diferencia_neta: valorGanado + valorPerdido
                }
            };
        });
    }

    /**
     * Obtener fechas disponibles (para selector en UI)
     */
    static async obtenerFechasDisponibles(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(
                `SELECT DISTINCT fecha_snapshot
                 FROM inventario_snapshots
                 WHERE organizacion_id = $1 AND estado = 'completo'
                 ORDER BY fecha_snapshot DESC
                 LIMIT 365`,
                [organizacionId]
            );

            return result.rows.map(r => r.fecha_snapshot);
        });
    }

    /**
     * Verificar si existe snapshot para una fecha
     */
    static async existeSnapshot(organizacionId, fecha) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(
                `SELECT id, estado FROM inventario_snapshots
                 WHERE organizacion_id = $1 AND fecha_snapshot = $2`,
                [organizacionId, fecha]
            );

            return result.rows.length > 0 ? result.rows[0] : null;
        });
    }

    // ========================================================================
    // GENERACION
    // ========================================================================

    /**
     * Generar snapshot manualmente
     */
    static async generar(organizacionId, usuarioId, fecha = null, descripcion = null) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[SnapshotsModel.generar] Iniciando generacion manual', {
                organizacion_id: organizacionId,
                usuario_id: usuarioId,
                fecha
            });

            const fechaSnapshot = fecha || new Date().toISOString().split('T')[0];

            const result = await db.query(
                `SELECT generar_snapshot_inventario($1, $2, 'manual', $3, $4) as snapshot_id`,
                [
                    organizacionId,
                    fechaSnapshot,
                    usuarioId,
                    descripcion
                ]
            );

            const snapshotId = result.rows[0].snapshot_id;

            // Obtener datos del snapshot creado
            const snapshot = await db.query(
                `SELECT * FROM inventario_snapshots WHERE id = $1`,
                [snapshotId]
            );

            logger.info('[SnapshotsModel.generar] Snapshot generado', {
                snapshot_id: snapshotId,
                total_productos: snapshot.rows[0].total_productos,
                tiempo_ms: snapshot.rows[0].tiempo_generacion_ms
            });

            return snapshot.rows[0];
        });
    }
}

module.exports = SnapshotsModel;
