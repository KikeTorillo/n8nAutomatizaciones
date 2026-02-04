/**
 * ====================================================================
 * MODEL - BLOQUES INVITACIÓN
 * ====================================================================
 *
 * Gestiona operaciones CRUD para bloques de invitación de eventos.
 * Los bloques se almacenan como JSONB en la columna bloques_invitacion.
 *
 * MÉTODOS:
 * • obtenerBloques() - Obtener bloques de un evento
 * • guardarBloques() - Guardar/reemplazar todos los bloques
 * • actualizarBloque() - Actualizar un bloque específico
 * • agregarBloque() - Agregar nuevo bloque
 * • eliminarBloque() - Eliminar un bloque
 * • reordenarBloques() - Cambiar orden de bloques
 *
 * Fecha creación: 3 Febrero 2026
 */

const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');
const { ErrorHelper } = require('../../../utils/helpers');
const { v4: uuidv4 } = require('uuid');

class BloquesInvitacionModel {

    /**
     * Obtener bloques de un evento
     *
     * @param {number} eventoId - ID del evento
     * @param {number} organizacionId - ID de la organización (RLS)
     * @returns {Array} Array de bloques
     */
    static async obtenerBloques(eventoId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT bloques_invitacion
                FROM eventos_digitales
                WHERE id = $1
            `;

            const result = await db.query(query, [eventoId]);

            if (result.rows.length === 0) {
                return [];
            }

            // Retornar array de bloques o array vacío si no hay
            return result.rows[0].bloques_invitacion || [];
        });
    }

    /**
     * Guardar/reemplazar todos los bloques de un evento
     *
     * @param {number} eventoId - ID del evento
     * @param {Array} bloques - Array de bloques
     * @param {number} organizacionId - ID de la organización (RLS)
     * @returns {Array} Bloques guardados
     */
    static async guardarBloques(eventoId, bloques, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Asegurar que cada bloque tenga id y orden
            const bloquesNormalizados = bloques.map((bloque, index) => ({
                id: bloque.id || uuidv4(),
                tipo: bloque.tipo,
                orden: bloque.orden ?? index,
                visible: bloque.visible ?? true,
                contenido: bloque.contenido || {},
                estilos: bloque.estilos || {},
                version: (bloque.version || 0) + 1,
                actualizado_en: new Date().toISOString(),
            }));

            const query = `
                UPDATE eventos_digitales
                SET bloques_invitacion = $2::jsonb,
                    actualizado_en = NOW()
                WHERE id = $1
                RETURNING bloques_invitacion
            `;

            logger.info('[BloquesInvitacionModel.guardarBloques] Guardando bloques', {
                evento_id: eventoId,
                organizacion_id: organizacionId,
                cantidad_bloques: bloquesNormalizados.length
            });

            const result = await db.query(query, [
                eventoId,
                JSON.stringify(bloquesNormalizados)
            ]);

            if (result.rows.length === 0) {
                ErrorHelper.throwNotFound('Evento no encontrado');
            }

            return result.rows[0].bloques_invitacion;
        });
    }

    /**
     * Actualizar un bloque específico
     *
     * @param {number} eventoId - ID del evento
     * @param {string} bloqueId - ID del bloque
     * @param {Object} contenido - Nuevo contenido del bloque
     * @param {number} organizacionId - ID de la organización (RLS)
     * @returns {Object} Bloque actualizado
     */
    static async actualizarBloque(eventoId, bloqueId, contenido, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Obtener bloques actuales
            const queryGet = `
                SELECT bloques_invitacion
                FROM eventos_digitales
                WHERE id = $1
            `;

            const result = await db.query(queryGet, [eventoId]);

            if (result.rows.length === 0) {
                ErrorHelper.throwNotFound('Evento no encontrado');
            }

            const bloques = result.rows[0].bloques_invitacion || [];
            const bloqueIndex = bloques.findIndex(b => b.id === bloqueId);

            if (bloqueIndex === -1) {
                ErrorHelper.throwNotFound('Bloque no encontrado');
            }

            // Actualizar bloque
            bloques[bloqueIndex] = {
                ...bloques[bloqueIndex],
                contenido: {
                    ...bloques[bloqueIndex].contenido,
                    ...contenido
                },
                version: (bloques[bloqueIndex].version || 0) + 1,
                actualizado_en: new Date().toISOString(),
            };

            // Guardar
            const queryUpdate = `
                UPDATE eventos_digitales
                SET bloques_invitacion = $2::jsonb,
                    actualizado_en = NOW()
                WHERE id = $1
                RETURNING bloques_invitacion
            `;

            logger.info('[BloquesInvitacionModel.actualizarBloque] Bloque actualizado', {
                evento_id: eventoId,
                bloque_id: bloqueId,
                organizacion_id: organizacionId
            });

            await db.query(queryUpdate, [eventoId, JSON.stringify(bloques)]);

            return bloques[bloqueIndex];
        });
    }

    /**
     * Agregar nuevo bloque
     *
     * @param {number} eventoId - ID del evento
     * @param {Object} bloque - Datos del nuevo bloque
     * @param {number} organizacionId - ID de la organización (RLS)
     * @returns {Object} Bloque creado
     */
    static async agregarBloque(eventoId, bloque, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Obtener bloques actuales
            const queryGet = `
                SELECT bloques_invitacion
                FROM eventos_digitales
                WHERE id = $1
            `;

            const result = await db.query(queryGet, [eventoId]);

            if (result.rows.length === 0) {
                ErrorHelper.throwNotFound('Evento no encontrado');
            }

            const bloques = result.rows[0].bloques_invitacion || [];

            // Crear nuevo bloque
            const nuevoBloque = {
                id: uuidv4(),
                tipo: bloque.tipo,
                orden: bloque.orden ?? bloques.length,
                visible: bloque.visible ?? true,
                contenido: bloque.contenido || {},
                estilos: bloque.estilos || {},
                version: 1,
                creado_en: new Date().toISOString(),
                actualizado_en: new Date().toISOString(),
            };

            // Si se especifica posición, insertar en esa posición
            if (bloque.orden !== undefined && bloque.orden < bloques.length) {
                bloques.splice(bloque.orden, 0, nuevoBloque);
                // Reajustar orden de los demás
                bloques.forEach((b, i) => { b.orden = i; });
            } else {
                bloques.push(nuevoBloque);
            }

            // Guardar
            const queryUpdate = `
                UPDATE eventos_digitales
                SET bloques_invitacion = $2::jsonb,
                    actualizado_en = NOW()
                WHERE id = $1
                RETURNING bloques_invitacion
            `;

            logger.info('[BloquesInvitacionModel.agregarBloque] Bloque agregado', {
                evento_id: eventoId,
                bloque_tipo: nuevoBloque.tipo,
                bloque_id: nuevoBloque.id,
                organizacion_id: organizacionId
            });

            await db.query(queryUpdate, [eventoId, JSON.stringify(bloques)]);

            return nuevoBloque;
        });
    }

    /**
     * Eliminar un bloque
     *
     * @param {number} eventoId - ID del evento
     * @param {string} bloqueId - ID del bloque a eliminar
     * @param {number} organizacionId - ID de la organización (RLS)
     * @returns {boolean} true si se eliminó
     */
    static async eliminarBloque(eventoId, bloqueId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Obtener bloques actuales
            const queryGet = `
                SELECT bloques_invitacion
                FROM eventos_digitales
                WHERE id = $1
            `;

            const result = await db.query(queryGet, [eventoId]);

            if (result.rows.length === 0) {
                ErrorHelper.throwNotFound('Evento no encontrado');
            }

            const bloques = result.rows[0].bloques_invitacion || [];
            const bloqueIndex = bloques.findIndex(b => b.id === bloqueId);

            if (bloqueIndex === -1) {
                return false;
            }

            // Eliminar bloque
            bloques.splice(bloqueIndex, 1);

            // Reajustar orden
            bloques.forEach((b, i) => { b.orden = i; });

            // Guardar
            const queryUpdate = `
                UPDATE eventos_digitales
                SET bloques_invitacion = $2::jsonb,
                    actualizado_en = NOW()
                WHERE id = $1
            `;

            logger.info('[BloquesInvitacionModel.eliminarBloque] Bloque eliminado', {
                evento_id: eventoId,
                bloque_id: bloqueId,
                organizacion_id: organizacionId
            });

            await db.query(queryUpdate, [eventoId, JSON.stringify(bloques)]);

            return true;
        });
    }

    /**
     * Reordenar bloques
     *
     * @param {number} eventoId - ID del evento
     * @param {Array} nuevoOrden - Array de IDs en el nuevo orden
     * @param {number} organizacionId - ID de la organización (RLS)
     * @returns {Array} Bloques reordenados
     */
    static async reordenarBloques(eventoId, nuevoOrden, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Obtener bloques actuales
            const queryGet = `
                SELECT bloques_invitacion
                FROM eventos_digitales
                WHERE id = $1
            `;

            const result = await db.query(queryGet, [eventoId]);

            if (result.rows.length === 0) {
                ErrorHelper.throwNotFound('Evento no encontrado');
            }

            const bloquesActuales = result.rows[0].bloques_invitacion || [];

            // Crear mapa de bloques por ID
            const bloquesMap = new Map(bloquesActuales.map(b => [b.id, b]));

            // Reordenar según el nuevo orden
            const bloquesReordenados = nuevoOrden
                .map((id, index) => {
                    const bloque = bloquesMap.get(id);
                    if (bloque) {
                        return { ...bloque, orden: index };
                    }
                    return null;
                })
                .filter(Boolean);

            // Guardar
            const queryUpdate = `
                UPDATE eventos_digitales
                SET bloques_invitacion = $2::jsonb,
                    actualizado_en = NOW()
                WHERE id = $1
                RETURNING bloques_invitacion
            `;

            logger.info('[BloquesInvitacionModel.reordenarBloques] Bloques reordenados', {
                evento_id: eventoId,
                organizacion_id: organizacionId,
                cantidad: bloquesReordenados.length
            });

            const updateResult = await db.query(queryUpdate, [
                eventoId,
                JSON.stringify(bloquesReordenados)
            ]);

            return updateResult.rows[0].bloques_invitacion;
        });
    }

    /**
     * Duplicar un bloque
     *
     * @param {number} eventoId - ID del evento
     * @param {string} bloqueId - ID del bloque a duplicar
     * @param {number} organizacionId - ID de la organización (RLS)
     * @returns {Object} Bloque duplicado
     */
    static async duplicarBloque(eventoId, bloqueId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Obtener bloques actuales
            const queryGet = `
                SELECT bloques_invitacion
                FROM eventos_digitales
                WHERE id = $1
            `;

            const result = await db.query(queryGet, [eventoId]);

            if (result.rows.length === 0) {
                ErrorHelper.throwNotFound('Evento no encontrado');
            }

            const bloques = result.rows[0].bloques_invitacion || [];
            const bloqueIndex = bloques.findIndex(b => b.id === bloqueId);

            if (bloqueIndex === -1) {
                ErrorHelper.throwNotFound('Bloque no encontrado');
            }

            // Crear copia
            const bloqueOriginal = bloques[bloqueIndex];
            const bloqueDuplicado = {
                ...bloqueOriginal,
                id: uuidv4(),
                orden: bloqueIndex + 1,
                version: 1,
                creado_en: new Date().toISOString(),
                actualizado_en: new Date().toISOString(),
            };

            // Insertar después del original
            bloques.splice(bloqueIndex + 1, 0, bloqueDuplicado);

            // Reajustar orden
            bloques.forEach((b, i) => { b.orden = i; });

            // Guardar
            const queryUpdate = `
                UPDATE eventos_digitales
                SET bloques_invitacion = $2::jsonb,
                    actualizado_en = NOW()
                WHERE id = $1
            `;

            logger.info('[BloquesInvitacionModel.duplicarBloque] Bloque duplicado', {
                evento_id: eventoId,
                bloque_original_id: bloqueId,
                bloque_nuevo_id: bloqueDuplicado.id,
                organizacion_id: organizacionId
            });

            await db.query(queryUpdate, [eventoId, JSON.stringify(bloques)]);

            return bloqueDuplicado;
        });
    }
}

module.exports = BloquesInvitacionModel;
