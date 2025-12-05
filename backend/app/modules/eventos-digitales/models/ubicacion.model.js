/**
 * ====================================================================
 * MODELO: UBICACIONES DE EVENTOS DIGITALES
 * ====================================================================
 * Gestión de ubicaciones/lugares del evento (ceremonia, recepción, etc.)
 *
 * Fecha creación: 4 Diciembre 2025
 */

const RLSContextManager = require('../../../utils/rlsContextManager');

class UbicacionModel {
    /**
     * Crear ubicación
     */
    static async crear(datos) {
        const {
            evento_id,
            nombre,
            tipo = 'ceremonia',
            direccion,
            latitud,
            longitud,
            google_maps_url,
            hora_inicio,
            hora_fin,
            codigo_vestimenta,
            notas,
            orden = 0,
            organizacion_id
        } = datos;

        return await RLSContextManager.query(organizacion_id, async (db) => {
            const result = await db.query(`
                INSERT INTO ubicaciones_evento (
                    evento_id, nombre, tipo, direccion,
                    latitud, longitud, google_maps_url,
                    hora_inicio, hora_fin, codigo_vestimenta,
                    notas, orden
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING *
            `, [
                evento_id, nombre, tipo, direccion,
                latitud, longitud, google_maps_url,
                hora_inicio, hora_fin, codigo_vestimenta,
                notas, orden
            ]);

            return result.rows[0];
        });
    }

    /**
     * Listar ubicaciones de un evento
     */
    static async listarPorEvento(eventoId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(`
                SELECT * FROM ubicaciones_evento
                WHERE evento_id = $1 AND activo = true
                ORDER BY orden, id
            `, [eventoId]);

            return result.rows;
        });
    }

    /**
     * Obtener ubicación por ID
     */
    static async obtenerPorId(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(`
                SELECT u.*, e.nombre as evento_nombre
                FROM ubicaciones_evento u
                JOIN eventos_digitales e ON e.id = u.evento_id
                WHERE u.id = $1 AND u.activo = true
            `, [id]);

            return result.rows[0] || null;
        });
    }

    /**
     * Actualizar ubicación
     */
    static async actualizar(id, datos, organizacionId) {
        const campos = [];
        const valores = [];
        let idx = 1;

        const camposPermitidos = [
            'nombre', 'tipo', 'direccion', 'latitud', 'longitud',
            'google_maps_url', 'hora_inicio', 'hora_fin',
            'codigo_vestimenta', 'notas', 'orden', 'activo'
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
                UPDATE ubicaciones_evento
                SET ${campos.join(', ')}
                WHERE id = $${idx}
                RETURNING *
            `, valores);

            return result.rows[0];
        });
    }

    /**
     * Eliminar ubicación (soft delete)
     */
    static async eliminar(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(`
                UPDATE ubicaciones_evento
                SET activo = false
                WHERE id = $1
                RETURNING id
            `, [id]);

            return result.rowCount > 0;
        });
    }

    /**
     * Reordenar ubicaciones
     */
    static async reordenar(eventoId, ordenIds, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            for (let i = 0; i < ordenIds.length; i++) {
                await db.query(`
                    UPDATE ubicaciones_evento
                    SET orden = $1
                    WHERE id = $2 AND evento_id = $3
                `, [i, ordenIds[i], eventoId]);
            }

            return true;
        });
    }

    /**
     * Obtener ubicaciones públicas (para vista de invitado)
     */
    static async obtenerPublicas(eventoId) {
        return await RLSContextManager.withBypass(async (db) => {
            const result = await db.query(`
                SELECT
                    u.id, u.nombre, u.tipo, u.direccion,
                    u.latitud, u.longitud, u.google_maps_url,
                    u.hora_inicio, u.hora_fin, u.codigo_vestimenta,
                    u.notas, u.orden
                FROM ubicaciones_evento u
                JOIN eventos_digitales e ON e.id = u.evento_id
                WHERE u.evento_id = $1
                  AND u.activo = true
                  AND e.estado = 'publicado'
                ORDER BY u.orden, u.id
            `, [eventoId]);

            return result.rows;
        });
    }
}

module.exports = UbicacionModel;
