/**
 * ====================================================================
 * MODEL - MESAS DE EVENTOS (Seating Chart)
 * ====================================================================
 *
 * Gestiona operaciones CRUD para mesas y asignación de invitados.
 *
 * MÉTODOS:
 * • crear() - Crear mesa
 * • actualizar() - Actualizar mesa (nombre, capacidad, tipo)
 * • actualizarPosicion() - Actualizar posición X/Y de una mesa
 * • actualizarPosiciones() - Batch update de posiciones (drag-drop)
 * • obtenerPorId() - Obtener mesa por ID
 * • listar() - Listar mesas del evento con invitados asignados
 * • eliminar() - Soft delete
 * • asignarInvitado() - Asignar invitado a mesa
 * • desasignarInvitado() - Quitar invitado de mesa
 * • obtenerEstadisticas() - Estadísticas de ocupación
 *
 * Fecha creación: 8 Diciembre 2025
 */

const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');

class MesaModel {

    /**
     * Crear mesa
     *
     * @param {Object} datos - Datos de la mesa
     * @returns {Object} Mesa creada
     */
    static async crear(datos) {
        return await RLSContextManager.query(datos.organizacion_id, async (db) => {
            const query = `
                INSERT INTO mesas_evento (
                    evento_id,
                    nombre,
                    numero,
                    tipo,
                    posicion_x,
                    posicion_y,
                    rotacion,
                    capacidad
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `;

            const valores = [
                datos.evento_id,
                datos.nombre,
                datos.numero || null,
                datos.tipo || 'redonda',
                datos.posicion_x ?? 50,
                datos.posicion_y ?? 50,
                datos.rotacion || 0,
                datos.capacidad || 8
            ];

            logger.info('[MesaModel.crear] Creando mesa', {
                evento_id: datos.evento_id,
                nombre: datos.nombre,
                capacidad: datos.capacidad
            });

            const result = await db.query(query, valores);
            return result.rows[0];
        });
    }

    /**
     * Listar mesas del evento con invitados asignados
     *
     * @param {number} eventoId - ID del evento
     * @param {number} organizacionId - ID de la organización
     * @returns {Array} Lista de mesas con invitados
     */
    static async listar(eventoId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    m.*,
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'id', i.id,
                                'nombre', i.nombre,
                                'num_asistentes', COALESCE(i.num_asistentes, 1),
                                'estado_rsvp', i.estado_rsvp,
                                'grupo_familiar', i.grupo_familiar
                            ) ORDER BY i.nombre
                        ) FILTER (WHERE i.id IS NOT NULL),
                        '[]'
                    ) as invitados,
                    COUNT(i.id)::INTEGER as total_invitados,
                    COALESCE(SUM(COALESCE(i.num_asistentes, 1)) FILTER (WHERE i.id IS NOT NULL), 0)::INTEGER as total_personas
                FROM mesas_evento m
                LEFT JOIN invitados_evento i ON i.mesa_id = m.id AND i.activo = true
                WHERE m.evento_id = $1 AND m.activo = true
                GROUP BY m.id
                ORDER BY m.numero NULLS LAST, m.nombre
            `;

            const result = await db.query(query, [eventoId]);
            return result.rows;
        });
    }

    /**
     * Obtener mesa por ID
     *
     * @param {number} mesaId - ID de la mesa
     * @param {number} organizacionId - ID de la organización
     * @returns {Object|null} Mesa encontrada o null
     */
    static async obtenerPorId(mesaId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    m.*,
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'id', i.id,
                                'nombre', i.nombre,
                                'num_asistentes', COALESCE(i.num_asistentes, 1),
                                'estado_rsvp', i.estado_rsvp
                            ) ORDER BY i.nombre
                        ) FILTER (WHERE i.id IS NOT NULL),
                        '[]'
                    ) as invitados,
                    COUNT(i.id)::INTEGER as total_invitados,
                    COALESCE(SUM(COALESCE(i.num_asistentes, 1)) FILTER (WHERE i.id IS NOT NULL), 0)::INTEGER as total_personas
                FROM mesas_evento m
                LEFT JOIN invitados_evento i ON i.mesa_id = m.id AND i.activo = true
                WHERE m.id = $1 AND m.activo = true
                GROUP BY m.id
            `;

            const result = await db.query(query, [mesaId]);
            return result.rows[0] || null;
        });
    }

    /**
     * Actualizar mesa
     *
     * @param {number} mesaId - ID de la mesa
     * @param {Object} datos - Datos a actualizar
     * @param {number} organizacionId - ID de la organización
     * @returns {Object} Mesa actualizada
     */
    static async actualizar(mesaId, datos, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const campos = [];
            const valores = [];
            let idx = 1;

            if (datos.nombre !== undefined) {
                campos.push(`nombre = $${idx++}`);
                valores.push(datos.nombre);
            }
            if (datos.numero !== undefined) {
                campos.push(`numero = $${idx++}`);
                valores.push(datos.numero);
            }
            if (datos.tipo !== undefined) {
                campos.push(`tipo = $${idx++}`);
                valores.push(datos.tipo);
            }
            if (datos.capacidad !== undefined) {
                campos.push(`capacidad = $${idx++}`);
                valores.push(datos.capacidad);
            }
            if (datos.posicion_x !== undefined) {
                campos.push(`posicion_x = $${idx++}`);
                valores.push(datos.posicion_x);
            }
            if (datos.posicion_y !== undefined) {
                campos.push(`posicion_y = $${idx++}`);
                valores.push(datos.posicion_y);
            }
            if (datos.rotacion !== undefined) {
                campos.push(`rotacion = $${idx++}`);
                valores.push(datos.rotacion);
            }

            if (campos.length === 0) {
                throw new Error('No hay campos para actualizar');
            }

            campos.push(`actualizado_en = NOW()`);
            valores.push(mesaId);

            const query = `
                UPDATE mesas_evento
                SET ${campos.join(', ')}
                WHERE id = $${idx} AND activo = true
                RETURNING *
            `;

            logger.info('[MesaModel.actualizar] Actualizando mesa', { mesaId });

            const result = await db.query(query, valores);
            return result.rows[0];
        });
    }

    /**
     * Actualizar posiciones de múltiples mesas (batch para drag-drop)
     *
     * @param {number} eventoId - ID del evento
     * @param {Array} posiciones - Array de { id, posicion_x, posicion_y, rotacion? }
     * @param {number} organizacionId - ID de la organización
     * @returns {Object} { actualizado: number }
     */
    static async actualizarPosiciones(eventoId, posiciones, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            let actualizado = 0;

            for (const pos of posiciones) {
                const result = await db.query(`
                    UPDATE mesas_evento
                    SET posicion_x = $1,
                        posicion_y = $2,
                        rotacion = $3,
                        actualizado_en = NOW()
                    WHERE id = $4 AND evento_id = $5 AND activo = true
                `, [
                    pos.posicion_x,
                    pos.posicion_y,
                    pos.rotacion ?? 0,
                    pos.id,
                    eventoId
                ]);
                actualizado += result.rowCount;
            }

            logger.info('[MesaModel.actualizarPosiciones] Posiciones actualizadas', {
                evento_id: eventoId,
                total: actualizado
            });

            return { actualizado };
        });
    }

    /**
     * Eliminar mesa (soft delete)
     *
     * @param {number} mesaId - ID de la mesa
     * @param {number} organizacionId - ID de la organización
     * @returns {boolean} true si se eliminó
     */
    static async eliminar(mesaId, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Primero desasignar todos los invitados de esta mesa
            await db.query(`
                UPDATE invitados_evento
                SET mesa_id = NULL, actualizado_en = NOW()
                WHERE mesa_id = $1
            `, [mesaId]);

            // Luego eliminar la mesa (soft delete)
            const result = await db.query(`
                UPDATE mesas_evento
                SET activo = false, actualizado_en = NOW()
                WHERE id = $1 AND activo = true
                RETURNING id
            `, [mesaId]);

            logger.info('[MesaModel.eliminar] Mesa eliminada', { mesaId });

            return result.rowCount > 0;
        });
    }

    /**
     * Asignar invitado a mesa
     *
     * @param {number} mesaId - ID de la mesa
     * @param {number} invitadoId - ID del invitado
     * @param {number} organizacionId - ID de la organización
     * @returns {Object} Invitado actualizado
     */
    static async asignarInvitado(mesaId, invitadoId, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Verificar capacidad de la mesa
            const capacidadQuery = `
                SELECT
                    m.id,
                    m.nombre,
                    m.capacidad,
                    COALESCE(SUM(COALESCE(i.num_asistentes, 1)), 0)::INTEGER as ocupado
                FROM mesas_evento m
                LEFT JOIN invitados_evento i ON i.mesa_id = m.id AND i.activo = true
                WHERE m.id = $1 AND m.activo = true
                GROUP BY m.id
            `;
            const capacidadResult = await db.query(capacidadQuery, [mesaId]);

            if (capacidadResult.rows.length === 0) {
                throw new Error('Mesa no encontrada');
            }

            const mesa = capacidadResult.rows[0];

            // Obtener num_asistentes del invitado a asignar
            const invitadoQuery = `
                SELECT id, nombre, num_asistentes, mesa_id
                FROM invitados_evento
                WHERE id = $1 AND activo = true
            `;
            const invitadoResult = await db.query(invitadoQuery, [invitadoId]);

            if (invitadoResult.rows.length === 0) {
                throw new Error('Invitado no encontrado');
            }

            const invitado = invitadoResult.rows[0];
            const personasInvitado = invitado.num_asistentes || 1;

            // Si el invitado ya está en esta mesa, no hacer nada
            if (invitado.mesa_id === mesaId) {
                return invitado;
            }

            // Calcular disponibilidad
            const disponible = mesa.capacidad - mesa.ocupado;
            if (personasInvitado > disponible) {
                throw new Error(`Capacidad insuficiente en ${mesa.nombre}. Disponible: ${disponible}, Requerido: ${personasInvitado}`);
            }

            // Asignar invitado a la mesa
            const result = await db.query(`
                UPDATE invitados_evento
                SET mesa_id = $1, actualizado_en = NOW()
                WHERE id = $2
                RETURNING *
            `, [mesaId, invitadoId]);

            logger.info('[MesaModel.asignarInvitado] Invitado asignado a mesa', {
                mesa_id: mesaId,
                invitado_id: invitadoId,
                mesa_nombre: mesa.nombre
            });

            return result.rows[0];
        });
    }

    /**
     * Desasignar invitado de mesa
     *
     * @param {number} invitadoId - ID del invitado
     * @param {number} organizacionId - ID de la organización
     * @returns {Object} Invitado actualizado
     */
    static async desasignarInvitado(invitadoId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(`
                UPDATE invitados_evento
                SET mesa_id = NULL, actualizado_en = NOW()
                WHERE id = $1 AND activo = true
                RETURNING *
            `, [invitadoId]);

            if (result.rows.length === 0) {
                throw new Error('Invitado no encontrado');
            }

            logger.info('[MesaModel.desasignarInvitado] Invitado removido de mesa', {
                invitado_id: invitadoId
            });

            return result.rows[0];
        });
    }

    /**
     * Obtener estadísticas de ocupación de mesas
     *
     * @param {number} eventoId - ID del evento
     * @param {number} organizacionId - ID de la organización
     * @returns {Object} Estadísticas de ocupación
     */
    static async obtenerEstadisticas(eventoId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    COUNT(DISTINCT m.id)::INTEGER as total_mesas,
                    COALESCE(SUM(m.capacidad), 0)::INTEGER as capacidad_total,
                    COUNT(DISTINCT i.id)::INTEGER as invitados_asignados,
                    COALESCE(SUM(COALESCE(i.num_asistentes, 1)) FILTER (WHERE i.id IS NOT NULL), 0)::INTEGER as personas_asignadas,
                    (SELECT COUNT(*) FROM invitados_evento
                     WHERE evento_id = $1 AND mesa_id IS NULL AND activo = true
                     AND estado_rsvp = 'confirmado')::INTEGER as invitados_sin_mesa
                FROM mesas_evento m
                LEFT JOIN invitados_evento i ON i.mesa_id = m.id AND i.activo = true
                WHERE m.evento_id = $1 AND m.activo = true
            `;

            const result = await db.query(query, [eventoId]);
            return result.rows[0];
        });
    }
}

module.exports = MesaModel;
