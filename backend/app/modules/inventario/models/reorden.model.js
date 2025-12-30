/**
 * Modelo para Sistema de Reorden Automatico
 * Evaluacion de reglas de reabastecimiento y generacion de OCs
 * Fecha: 29 Diciembre 2025
 */

const RLSContextManager = require('../../../utils/rlsContextManager');

class ReordenModel {
    // ==================== EJECUCION ====================

    /**
     * Ejecutar evaluacion de reorden manualmente
     * @param {number} organizacionId - ID de la organizacion
     * @param {number} usuarioId - ID del usuario que ejecuta
     * @returns {Object} Resultado de la ejecucion
     */
    static async ejecutarManual(organizacionId, usuarioId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                'SELECT * FROM ejecutar_reorden_manual($1, $2)',
                [organizacionId, usuarioId]
            );
            return result.rows[0];
        });
    }

    // ==================== LOGS ====================

    /**
     * Listar logs de ejecucion de reorden
     * @param {number} organizacionId
     * @param {Object} filtros - { limit, offset, tipo, fecha_desde, fecha_hasta }
     */
    static async listarLogs(organizacionId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            let query = `
                SELECT
                    rl.*,
                    u.nombre as ejecutado_por_nombre,
                    u.email as ejecutado_por_email
                FROM reorden_logs rl
                LEFT JOIN usuarios u ON u.id = rl.ejecutado_por
                WHERE rl.organizacion_id = $1
            `;
            const params = [organizacionId];
            let paramIndex = 2;

            if (filtros.tipo) {
                query += ` AND rl.tipo = $${paramIndex++}`;
                params.push(filtros.tipo);
            }

            if (filtros.fecha_desde) {
                query += ` AND rl.inicio_en >= $${paramIndex++}`;
                params.push(filtros.fecha_desde);
            }

            if (filtros.fecha_hasta) {
                query += ` AND rl.inicio_en <= $${paramIndex++}`;
                params.push(filtros.fecha_hasta);
            }

            query += ' ORDER BY rl.inicio_en DESC';

            if (filtros.limit) {
                query += ` LIMIT $${paramIndex++}`;
                params.push(filtros.limit);
            }

            if (filtros.offset) {
                query += ` OFFSET $${paramIndex++}`;
                params.push(filtros.offset);
            }

            const result = await client.query(query, params);
            return result.rows;
        });
    }

    /**
     * Obtener log por ID
     */
    static async obtenerLogPorId(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                `SELECT
                    rl.*,
                    u.nombre as ejecutado_por_nombre
                FROM reorden_logs rl
                LEFT JOIN usuarios u ON u.id = rl.ejecutado_por
                WHERE rl.id = $1 AND rl.organizacion_id = $2`,
                [id, organizacionId]
            );
            return result.rows[0] || null;
        });
    }

    // ==================== DASHBOARD ====================

    /**
     * Obtener metricas del dashboard de reorden
     */
    static async obtenerDashboard(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                'SELECT * FROM obtener_dashboard_reorden($1)',
                [organizacionId]
            );
            return result.rows[0];
        });
    }

    // ==================== PRODUCTOS BAJO MINIMO ====================

    /**
     * Obtener productos que necesitan reabastecimiento
     * @param {number} organizacionId
     * @param {Object} filtros - { solo_sin_oc, categoria_id, proveedor_id, limit }
     */
    static async obtenerProductosBajoMinimo(organizacionId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const soloSinOC = filtros.solo_sin_oc !== false;

            let query = `
                SELECT * FROM obtener_productos_bajo_minimo($1, $2)
                WHERE 1=1
            `;
            const params = [organizacionId, soloSinOC];
            let paramIndex = 3;

            if (filtros.categoria_id) {
                // Necesitamos filtrar post-funcion
                query = `
                    SELECT pbm.* FROM obtener_productos_bajo_minimo($1, $2) pbm
                    JOIN productos p ON p.id = pbm.producto_id
                    WHERE p.categoria_id = $${paramIndex++}
                `;
                params.push(filtros.categoria_id);
            }

            if (filtros.proveedor_id) {
                query += ` AND proveedor_id = $${paramIndex++}`;
                params.push(filtros.proveedor_id);
            }

            if (filtros.limit) {
                query += ` LIMIT $${paramIndex++}`;
                params.push(filtros.limit);
            }

            const result = await client.query(query, params);
            return result.rows;
        });
    }

    /**
     * Contar productos bajo minimo
     */
    static async contarProductosBajoMinimo(organizacionId, soloSinOC = true) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                'SELECT COUNT(*)::INTEGER as total FROM obtener_productos_bajo_minimo($1, $2)',
                [organizacionId, soloSinOC]
            );
            return result.rows[0].total;
        });
    }

    // ==================== ESTADO DEL JOB ====================

    /**
     * Obtener estado del job de pg_cron
     */
    static async obtenerEstadoJob() {
        // Esta consulta no requiere RLS, es de sistema
        const pool = require('../../../config/database');
        const result = await pool.query('SELECT * FROM v_estado_job_reorden');
        return result.rows[0] || null;
    }

    // ==================== REGLAS (delegado a RutasOperacionModel) ====================
    // Las reglas se manejan via RutasOperacionModel.crearRegla, listarReglas, etc.
    // Este modelo se enfoca en la ejecucion y monitoreo

    /**
     * Obtener resumen de reglas por tipo
     */
    static async obtenerResumenReglas(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(`
                SELECT
                    COUNT(*) FILTER (WHERE activo = true) as activas,
                    COUNT(*) FILTER (WHERE activo = false) as inactivas,
                    COUNT(*) FILTER (WHERE producto_id IS NOT NULL) as por_producto,
                    COUNT(*) FILTER (WHERE categoria_id IS NOT NULL) as por_categoria,
                    COUNT(*) FILTER (WHERE producto_id IS NULL AND categoria_id IS NULL) as globales,
                    COALESCE(SUM(total_ordenes_generadas), 0) as total_ocs_historico
                FROM reglas_reabastecimiento
                WHERE organizacion_id = $1
            `, [organizacionId]);
            return result.rows[0];
        });
    }
}

module.exports = ReordenModel;
