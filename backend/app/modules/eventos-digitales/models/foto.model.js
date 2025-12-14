/**
 * ====================================================================
 * MODELO: FOTOS DE EVENTO (GALERÍA COMPARTIDA)
 * ====================================================================
 * Gestión de fotos subidas por invitados y organizadores.
 *
 * Fecha creación: 14 Diciembre 2025
 */

const RLSContextManager = require('../../../utils/rlsContextManager');

class FotoEventoModel {
    /**
     * Crear foto (autenticado - admin/organizador)
     */
    static async crear(datos) {
        const {
            evento_id,
            invitado_id,
            url,
            thumbnail_url,
            nombre_autor,
            caption,
            tamanio_bytes,
            tipo_mime,
            organizacion_id
        } = datos;

        return await RLSContextManager.query(organizacion_id, async (db) => {
            const result = await db.query(`
                INSERT INTO fotos_evento (
                    evento_id, invitado_id, url, thumbnail_url,
                    nombre_autor, caption, tamanio_bytes, tipo_mime
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `, [
                evento_id, invitado_id, url, thumbnail_url,
                nombre_autor, caption, tamanio_bytes, tipo_mime
            ]);

            return result.rows[0];
        });
    }

    /**
     * Crear foto pública (invitado sube foto)
     */
    static async crearPublica(eventoId, invitadoId, datos) {
        const { url, thumbnail_url, nombre_autor, caption, tamanio_bytes, tipo_mime } = datos;

        return await RLSContextManager.withBypass(async (db) => {
            // Verificar que el evento existe, está publicado y permite galería
            const eventoCheck = await db.query(`
                SELECT id, configuracion FROM eventos_digitales
                WHERE id = $1 AND estado = 'publicado' AND activo = true
            `, [eventoId]);

            if (eventoCheck.rowCount === 0) {
                return null;
            }

            const config = eventoCheck.rows[0].configuracion || {};
            if (config.permitir_galeria_invitados === false) {
                return { error: 'galeria_deshabilitada' };
            }

            const result = await db.query(`
                INSERT INTO fotos_evento (
                    evento_id, invitado_id, url, thumbnail_url,
                    nombre_autor, caption, tamanio_bytes, tipo_mime
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id, url, thumbnail_url, nombre_autor, caption, creado_en
            `, [
                eventoId, invitadoId, url, thumbnail_url,
                nombre_autor, caption, tamanio_bytes, tipo_mime
            ]);

            return result.rows[0];
        });
    }

    /**
     * Listar fotos de un evento (admin)
     */
    static async listarPorEvento(eventoId, organizacionId, filtros = {}) {
        const { estado, limit = 100, offset = 0 } = filtros;

        return await RLSContextManager.query(organizacionId, async (db) => {
            let query = `
                SELECT f.*, i.nombre as invitado_nombre
                FROM fotos_evento f
                LEFT JOIN invitados_evento i ON i.id = f.invitado_id
                WHERE f.evento_id = $1
            `;
            const params = [eventoId];
            let paramIdx = 2;

            if (estado) {
                query += ` AND f.estado = $${paramIdx}`;
                params.push(estado);
                paramIdx++;
            } else {
                // Por defecto no mostrar eliminadas
                query += ` AND f.estado != 'eliminada'`;
            }

            query += ` ORDER BY f.creado_en DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
            params.push(limit, offset);

            const result = await db.query(query, params);

            // Contar total
            let countQuery = `
                SELECT COUNT(*) FROM fotos_evento
                WHERE evento_id = $1 AND estado != 'eliminada'
            `;
            const countResult = await db.query(countQuery, [eventoId]);

            return {
                fotos: result.rows,
                total: parseInt(countResult.rows[0].count)
            };
        });
    }

    /**
     * Obtener fotos públicas (para vista de invitado)
     */
    static async obtenerPublicas(eventoId, limit = 100) {
        return await RLSContextManager.withBypass(async (db) => {
            const result = await db.query(`
                SELECT
                    f.id, f.url, f.thumbnail_url, f.nombre_autor,
                    f.caption, f.creado_en
                FROM fotos_evento f
                JOIN eventos_digitales e ON e.id = f.evento_id
                WHERE f.evento_id = $1
                  AND f.estado = 'visible'
                  AND e.estado = 'publicado'
                ORDER BY f.creado_en DESC
                LIMIT $2
            `, [eventoId, limit]);

            return result.rows;
        });
    }

    /**
     * Obtener foto por ID
     */
    static async obtenerPorId(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(`
                SELECT f.*, i.nombre as invitado_nombre
                FROM fotos_evento f
                LEFT JOIN invitados_evento i ON i.id = f.invitado_id
                WHERE f.id = $1
            `, [id]);

            return result.rows[0] || null;
        });
    }

    /**
     * Cambiar estado de foto (visible/oculta/eliminada)
     */
    static async cambiarEstado(id, estado, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(`
                UPDATE fotos_evento
                SET estado = $1
                WHERE id = $2
                RETURNING *
            `, [estado, id]);

            return result.rows[0];
        });
    }

    /**
     * Reportar foto
     */
    static async reportar(id, motivo) {
        return await RLSContextManager.withBypass(async (db) => {
            const result = await db.query(`
                UPDATE fotos_evento
                SET reportada = true, motivo_reporte = $1
                WHERE id = $2
                RETURNING id
            `, [motivo, id]);

            return result.rowCount > 0;
        });
    }

    /**
     * Eliminar foto (soft delete)
     */
    static async eliminar(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(`
                UPDATE fotos_evento
                SET estado = 'eliminada'
                WHERE id = $1
                RETURNING id
            `, [id]);

            return result.rowCount > 0;
        });
    }

    /**
     * Eliminar foto permanentemente (hard delete)
     */
    static async eliminarPermanente(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(`
                DELETE FROM fotos_evento
                WHERE id = $1
                RETURNING id, url, thumbnail_url
            `, [id]);

            return result.rows[0] || null;
        });
    }

    /**
     * Contar fotos por estado
     */
    static async contarPorEstado(eventoId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(`
                SELECT
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE estado = 'visible') as visibles,
                    COUNT(*) FILTER (WHERE estado = 'oculta') as ocultas,
                    COUNT(*) FILTER (WHERE reportada = true) as reportadas
                FROM fotos_evento
                WHERE evento_id = $1 AND estado != 'eliminada'
            `, [eventoId]);

            return result.rows[0];
        });
    }
}

module.exports = FotoEventoModel;
