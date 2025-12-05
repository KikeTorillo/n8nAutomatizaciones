/**
 * ====================================================================
 * MODELO: FELICITACIONES (LIBRO DE VISITAS)
 * ====================================================================
 * Gestión de felicitaciones/mensajes del evento.
 *
 * Fecha creación: 4 Diciembre 2025
 */

const RLSContextManager = require('../../../utils/rlsContextManager');

class FelicitacionModel {
    /**
     * Crear felicitación (autenticado - admin)
     */
    static async crear(datos) {
        const {
            evento_id,
            invitado_id,
            nombre_autor,
            mensaje,
            aprobado = true,
            organizacion_id
        } = datos;

        return await RLSContextManager.query(organizacion_id, async (db) => {
            const result = await db.query(`
                INSERT INTO felicitaciones_evento (
                    evento_id, invitado_id, nombre_autor, mensaje, aprobado
                ) VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `, [evento_id, invitado_id, nombre_autor, mensaje, aprobado]);

            return result.rows[0];
        });
    }

    /**
     * Crear felicitación pública (invitado)
     */
    static async crearPublica(eventoId, invitadoId, nombreAutor, mensaje) {
        return await RLSContextManager.withBypass(async (db) => {
            // Verificar que el evento existe y está publicado
            const eventoCheck = await db.query(`
                SELECT id FROM eventos_digitales
                WHERE id = $1 AND estado = 'publicado' AND activo = true
            `, [eventoId]);

            if (eventoCheck.rowCount === 0) {
                return null;
            }

            const result = await db.query(`
                INSERT INTO felicitaciones_evento (
                    evento_id, invitado_id, nombre_autor, mensaje, aprobado
                ) VALUES ($1, $2, $3, $4, true)
                RETURNING id, nombre_autor, mensaje, creado_en
            `, [eventoId, invitadoId, nombreAutor, mensaje]);

            return result.rows[0];
        });
    }

    /**
     * Listar felicitaciones de un evento (admin)
     */
    static async listarPorEvento(eventoId, organizacionId, filtros = {}) {
        const { aprobadas, limit = 100, offset = 0 } = filtros;

        return await RLSContextManager.query(organizacionId, async (db) => {
            let query = `
                SELECT f.*, i.nombre as invitado_nombre
                FROM felicitaciones_evento f
                LEFT JOIN invitados_evento i ON i.id = f.invitado_id
                WHERE f.evento_id = $1
            `;
            const params = [eventoId];
            let paramIdx = 2;

            if (aprobadas !== undefined) {
                query += ` AND f.aprobado = $${paramIdx}`;
                params.push(aprobadas);
                paramIdx++;
            }

            query += ` ORDER BY f.creado_en DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
            params.push(limit, offset);

            const result = await db.query(query, params);

            // Contar total
            let countQuery = `
                SELECT COUNT(*) FROM felicitaciones_evento
                WHERE evento_id = $1
            `;
            const countParams = [eventoId];

            if (aprobadas !== undefined) {
                countQuery += ` AND aprobado = $2`;
                countParams.push(aprobadas);
            }

            const countResult = await db.query(countQuery, countParams);

            return {
                felicitaciones: result.rows,
                total: parseInt(countResult.rows[0].count)
            };
        });
    }

    /**
     * Obtener felicitaciones públicas (para vista de invitado)
     */
    static async obtenerPublicas(eventoId, limit = 50) {
        return await RLSContextManager.withBypass(async (db) => {
            const result = await db.query(`
                SELECT
                    f.id, f.nombre_autor, f.mensaje, f.creado_en
                FROM felicitaciones_evento f
                JOIN eventos_digitales e ON e.id = f.evento_id
                WHERE f.evento_id = $1
                  AND f.aprobado = true
                  AND e.estado = 'publicado'
                ORDER BY f.creado_en DESC
                LIMIT $2
            `, [eventoId, limit]);

            return result.rows;
        });
    }

    /**
     * Obtener felicitación por ID
     */
    static async obtenerPorId(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(`
                SELECT f.*, i.nombre as invitado_nombre
                FROM felicitaciones_evento f
                LEFT JOIN invitados_evento i ON i.id = f.invitado_id
                WHERE f.id = $1
            `, [id]);

            return result.rows[0] || null;
        });
    }

    /**
     * Aprobar/Rechazar felicitación
     */
    static async cambiarAprobacion(id, aprobado, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(`
                UPDATE felicitaciones_evento
                SET aprobado = $1
                WHERE id = $2
                RETURNING *
            `, [aprobado, id]);

            return result.rows[0];
        });
    }

    /**
     * Eliminar felicitación
     */
    static async eliminar(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(`
                DELETE FROM felicitaciones_evento
                WHERE id = $1
                RETURNING id
            `, [id]);

            return result.rowCount > 0;
        });
    }

    /**
     * Contar felicitaciones por estado
     */
    static async contarPorEstado(eventoId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(`
                SELECT
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE aprobado = true) as aprobadas,
                    COUNT(*) FILTER (WHERE aprobado = false) as pendientes
                FROM felicitaciones_evento
                WHERE evento_id = $1
            `, [eventoId]);

            return result.rows[0];
        });
    }
}

module.exports = FelicitacionModel;
