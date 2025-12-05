/**
 * ====================================================================
 * MODELO: MESA DE REGALOS
 * ====================================================================
 * Gestión de mesa de regalos del evento.
 *
 * Fecha creación: 4 Diciembre 2025
 */

const RLSContextManager = require('../../../utils/rlsContextManager');

class MesaRegalosModel {
    /**
     * Crear regalo
     */
    static async crear(datos) {
        const {
            evento_id,
            tipo,
            nombre,
            descripcion,
            precio,
            imagen_url,
            url_externa,
            orden = 0,
            organizacion_id
        } = datos;

        return await RLSContextManager.query(organizacion_id, async (db) => {
            const result = await db.query(`
                INSERT INTO mesa_regalos_evento (
                    evento_id, tipo, nombre, descripcion,
                    precio, imagen_url, url_externa, orden
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `, [
                evento_id, tipo, nombre, descripcion,
                precio, imagen_url, url_externa, orden
            ]);

            return result.rows[0];
        });
    }

    /**
     * Listar regalos de un evento
     */
    static async listarPorEvento(eventoId, organizacionId, filtros = {}) {
        const { soloDisponibles = false } = filtros;

        return await RLSContextManager.query(organizacionId, async (db) => {
            let query = `
                SELECT * FROM mesa_regalos_evento
                WHERE evento_id = $1 AND activo = true
            `;
            const params = [eventoId];

            if (soloDisponibles) {
                query += ` AND comprado = false`;
            }

            query += ` ORDER BY orden, id`;

            const result = await db.query(query, params);
            return result.rows;
        });
    }

    /**
     * Obtener regalo por ID
     */
    static async obtenerPorId(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(`
                SELECT m.*, e.nombre as evento_nombre
                FROM mesa_regalos_evento m
                JOIN eventos_digitales e ON e.id = m.evento_id
                WHERE m.id = $1 AND m.activo = true
            `, [id]);

            return result.rows[0] || null;
        });
    }

    /**
     * Actualizar regalo
     */
    static async actualizar(id, datos, organizacionId) {
        const campos = [];
        const valores = [];
        let idx = 1;

        const camposPermitidos = [
            'tipo', 'nombre', 'descripcion', 'precio',
            'imagen_url', 'url_externa', 'orden', 'activo'
        ];

        for (const campo of camposPermitidos) {
            if (datos[campo] !== undefined) {
                campos.push(`${campo} = $${idx}`);
                valores.push(datos[campo]);
                idx++;
            }
        }

        if (campos.length === 0) {
            return await this.obtenerPorId(id, organizacionId);
        }

        valores.push(id);

        return await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(`
                UPDATE mesa_regalos_evento
                SET ${campos.join(', ')}
                WHERE id = $${idx}
                RETURNING *
            `, valores);

            return result.rows[0];
        });
    }

    /**
     * Marcar como comprado
     */
    static async marcarComprado(id, compradoPor, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(`
                UPDATE mesa_regalos_evento
                SET comprado = true,
                    comprado_por = $1,
                    comprado_en = NOW()
                WHERE id = $2 AND comprado = false
                RETURNING *
            `, [compradoPor, id]);

            return result.rows[0];
        });
    }

    /**
     * Eliminar regalo (soft delete)
     */
    static async eliminar(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(`
                UPDATE mesa_regalos_evento
                SET activo = false
                WHERE id = $1
                RETURNING id
            `, [id]);

            return result.rowCount > 0;
        });
    }

    /**
     * Obtener mesa de regalos pública
     */
    static async obtenerPublica(eventoId) {
        return await RLSContextManager.withBypass(async (db) => {
            const result = await db.query(`
                SELECT
                    m.id, m.tipo, m.nombre, m.descripcion,
                    m.precio, m.imagen_url, m.url_externa,
                    m.comprado, m.orden
                FROM mesa_regalos_evento m
                JOIN eventos_digitales e ON e.id = m.evento_id
                WHERE m.evento_id = $1
                  AND m.activo = true
                  AND e.estado = 'publicado'
                ORDER BY m.orden, m.id
            `, [eventoId]);

            return result.rows;
        });
    }

    /**
     * Marcar como comprado (público)
     */
    static async marcarCompradoPublico(regaloId, eventoId, compradoPor) {
        return await RLSContextManager.withBypass(async (db) => {
            // Verificar que el regalo pertenece al evento y está disponible
            const check = await db.query(`
                SELECT m.id
                FROM mesa_regalos_evento m
                JOIN eventos_digitales e ON e.id = m.evento_id
                WHERE m.id = $1
                  AND m.evento_id = $2
                  AND m.comprado = false
                  AND m.activo = true
                  AND e.estado = 'publicado'
            `, [regaloId, eventoId]);

            if (check.rowCount === 0) {
                return null;
            }

            const result = await db.query(`
                UPDATE mesa_regalos_evento
                SET comprado = true,
                    comprado_por = $1,
                    comprado_en = NOW()
                WHERE id = $2
                RETURNING id, nombre, comprado_por
            `, [compradoPor, regaloId]);

            return result.rows[0];
        });
    }

    /**
     * Estadísticas de mesa de regalos
     */
    static async obtenerEstadisticas(eventoId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(`
                SELECT
                    COUNT(*) FILTER (WHERE activo = true) as total_regalos,
                    COUNT(*) FILTER (WHERE comprado = true AND activo = true) as regalos_comprados,
                    COUNT(*) FILTER (WHERE comprado = false AND activo = true) as regalos_disponibles,
                    COALESCE(SUM(precio) FILTER (WHERE activo = true), 0) as valor_total,
                    COALESCE(SUM(precio) FILTER (WHERE comprado = true AND activo = true), 0) as valor_recaudado
                FROM mesa_regalos_evento
                WHERE evento_id = $1
            `, [eventoId]);

            return result.rows[0];
        });
    }
}

module.exports = MesaRegalosModel;
