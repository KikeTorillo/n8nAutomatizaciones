/**
 * ====================================================================
 * MODEL - INVITADOS DE EVENTOS
 * ====================================================================
 *
 * Gestiona operaciones CRUD para invitados con RSVP embebido.
 *
 * MÉTODOS:
 * • crear() - Crear invitado con token auto-generado
 * • crearMasivo() - Importar múltiples invitados (CSV)
 * • actualizar() - Actualizar invitado
 * • obtenerPorId() - Obtener por ID
 * • obtenerPorToken() - Obtener por token (público)
 * • listar() - Listar invitados del evento
 * • confirmarRSVP() - Confirmar asistencia (público)
 * • eliminar() - Soft delete
 * • exportar() - Exportar lista para CSV
 *
 * Fecha creación: 4 Diciembre 2025
 */

const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');
const { PaginationHelper } = require('../../../utils/helpers');

class InvitadoModel {

    /**
     * Crear invitado
     * Token se genera automáticamente via trigger SQL
     *
     * @param {Object} datos - Datos del invitado
     * @returns {Object} Invitado creado con token
     */
    static async crear(datos) {
        return await RLSContextManager.query(datos.organizacion_id, async (db) => {
            const query = `
                INSERT INTO invitados_evento (
                    organizacion_id,
                    evento_id,
                    nombre,
                    email,
                    telefono,
                    grupo_familiar,
                    etiquetas,
                    max_acompanantes
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `;

            const valores = [
                datos.organizacion_id,
                datos.evento_id,
                datos.nombre,
                datos.email || null,
                datos.telefono || null,
                datos.grupo_familiar || null,
                datos.etiquetas ? JSON.stringify(datos.etiquetas) : '[]',
                datos.max_acompanantes || 0
            ];

            logger.info('[InvitadoModel.crear] Creando invitado', {
                evento_id: datos.evento_id,
                nombre: datos.nombre
            });

            const result = await db.query(query, valores);
            return result.rows[0];
        });
    }

    /**
     * Crear múltiples invitados (importación CSV)
     *
     * @param {number} eventoId - ID del evento
     * @param {number} organizacionId - ID de la organización
     * @param {Array} invitados - Lista de invitados
     * @returns {Object} { creados, errores }
     */
    static async crearMasivo(eventoId, organizacionId, invitados) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const creados = [];
            const errores = [];

            for (let i = 0; i < invitados.length; i++) {
                const invitado = invitados[i];

                try {
                    const query = `
                        INSERT INTO invitados_evento (
                            organizacion_id,
                            evento_id,
                            nombre,
                            email,
                            telefono,
                            grupo_familiar,
                            etiquetas,
                            max_acompanantes
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                        RETURNING *
                    `;

                    const valores = [
                        organizacionId,
                        eventoId,
                        invitado.nombre,
                        invitado.email || null,
                        invitado.telefono || null,
                        invitado.grupo_familiar || null,
                        invitado.etiquetas ? JSON.stringify(invitado.etiquetas) : '[]',
                        invitado.max_acompanantes || 0
                    ];

                    const result = await db.query(query, valores);
                    creados.push(result.rows[0]);

                } catch (error) {
                    errores.push({
                        fila: i + 1,
                        nombre: invitado.nombre,
                        error: error.message
                    });
                }
            }

            logger.info('[InvitadoModel.crearMasivo] Importación completada', {
                evento_id: eventoId,
                total: invitados.length,
                creados: creados.length,
                errores: errores.length
            });

            return { creados, errores };
        });
    }

    /**
     * Actualizar invitado
     *
     * @param {number} id - ID del invitado
     * @param {Object} datos - Datos a actualizar
     * @param {number} organizacionId - ID de la organización
     * @returns {Object} Invitado actualizado
     */
    static async actualizar(id, datos, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const campos = [];
            const valores = [id];
            let paramIndex = 2;

            const camposPermitidos = [
                'nombre', 'email', 'telefono', 'grupo_familiar',
                'etiquetas', 'max_acompanantes'
            ];

            for (const campo of camposPermitidos) {
                if (datos[campo] !== undefined) {
                    if (campo === 'etiquetas') {
                        campos.push(`${campo} = $${paramIndex}::jsonb`);
                        valores.push(JSON.stringify(datos[campo]));
                    } else {
                        campos.push(`${campo} = $${paramIndex}`);
                        valores.push(datos[campo]);
                    }
                    paramIndex++;
                }
            }

            if (campos.length === 0) {
                throw new Error('No hay campos para actualizar');
            }

            const query = `
                UPDATE invitados_evento
                SET ${campos.join(', ')},
                    actualizado_en = NOW()
                WHERE id = $1
                RETURNING *
            `;

            const result = await db.query(query, valores);
            return result.rows[0];
        });
    }

    /**
     * Obtener invitado por ID
     *
     * @param {number} id - ID del invitado
     * @param {number} organizacionId - ID de la organización
     * @returns {Object|null} Invitado o null
     */
    static async obtenerPorId(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT i.*, e.nombre as evento_nombre, e.fecha_evento
                FROM invitados_evento i
                JOIN eventos_digitales e ON i.evento_id = e.id
                WHERE i.id = $1
            `;

            const result = await db.query(query, [id]);
            return result.rows[0] || null;
        });
    }

    /**
     * Obtener invitado por token (público, bypass RLS)
     * Para vista de invitación personalizada
     *
     * @param {string} token - Token único del invitado
     * @returns {Object|null} Invitado con datos del evento
     */
    static async obtenerPorToken(token) {
        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                SELECT
                    i.*,
                    e.nombre as evento_nombre,
                    e.tipo as evento_tipo,
                    e.slug as evento_slug,
                    e.descripcion as evento_descripcion,
                    e.fecha_evento,
                    e.hora_evento,
                    e.fecha_limite_rsvp,
                    e.protagonistas,
                    e.portada_url,
                    e.galeria_urls,
                    e.configuracion as evento_configuracion,
                    e.estado as evento_estado
                FROM invitados_evento i
                JOIN eventos_digitales e ON i.evento_id = e.id
                WHERE i.token = $1
                  AND i.activo = true
                  AND e.activo = true
            `;

            // Actualizar contador de visualizaciones
            await db.query(`
                UPDATE invitados_evento
                SET ultima_visualizacion = NOW(),
                    total_visualizaciones = COALESCE(total_visualizaciones, 0) + 1
                WHERE token = $1
            `, [token]);

            const result = await db.query(query, [token]);
            return result.rows[0] || null;
        });
    }

    /**
     * Listar invitados del evento
     *
     * @param {number} eventoId - ID del evento
     * @param {number} organizacionId - ID de la organización
     * @param {Object} filtros - Filtros de búsqueda
     * @returns {Object} {invitados, paginacion}
     */
    static async listar(eventoId, organizacionId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereConditions = ['evento_id = $1', 'activo = true'];
            let queryParams = [eventoId];
            let paramIndex = 2;

            // Filtro por estado RSVP
            if (filtros.estado_rsvp) {
                whereConditions.push(`estado_rsvp = $${paramIndex}`);
                queryParams.push(filtros.estado_rsvp);
                paramIndex++;
            }

            // Filtro por grupo familiar
            if (filtros.grupo_familiar) {
                whereConditions.push(`grupo_familiar = $${paramIndex}`);
                queryParams.push(filtros.grupo_familiar);
                paramIndex++;
            }

            // Búsqueda por nombre
            if (filtros.buscar) {
                whereConditions.push(`nombre ILIKE $${paramIndex}`);
                queryParams.push(`%${filtros.buscar}%`);
                paramIndex++;
            }

            // Filtro por etiqueta
            if (filtros.etiqueta) {
                whereConditions.push(`etiquetas @> $${paramIndex}::jsonb`);
                queryParams.push(JSON.stringify([filtros.etiqueta]));
                paramIndex++;
            }

            const whereClause = whereConditions.join(' AND ');

            // Contar total
            const countQuery = `SELECT COUNT(*) as total FROM invitados_evento WHERE ${whereClause}`;
            const countResult = await db.query(countQuery, queryParams);
            const total = parseInt(countResult.rows[0].total);

            // Paginación
            const { limit, offset } = PaginationHelper.calculatePagination(
                filtros.pagina || 1,
                filtros.limite || 50
            );

            const query = `
                SELECT *
                FROM invitados_evento
                WHERE ${whereClause}
                ORDER BY
                    CASE estado_rsvp
                        WHEN 'pendiente' THEN 1
                        WHEN 'confirmado' THEN 2
                        WHEN 'declinado' THEN 3
                    END,
                    nombre ASC
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `;

            queryParams.push(limit, offset);

            const result = await db.query(query, queryParams);

            return {
                invitados: result.rows,
                paginacion: PaginationHelper.getPaginationInfo(total, filtros.pagina || 1, filtros.limite || 50)
            };
        });
    }

    /**
     * Confirmar RSVP (público, bypass RLS)
     *
     * @param {string} token - Token del invitado
     * @param {Object} datos - Datos de confirmación
     * @returns {Object} Invitado actualizado
     */
    static async confirmarRSVP(token, datos) {
        return await RLSContextManager.withBypass(async (db) => {
            // Verificar que el invitado existe y el evento está activo
            const verificarQuery = `
                SELECT i.*, e.fecha_limite_rsvp, e.estado as evento_estado
                FROM invitados_evento i
                JOIN eventos_digitales e ON i.evento_id = e.id
                WHERE i.token = $1 AND i.activo = true AND e.activo = true
            `;

            const verificar = await db.query(verificarQuery, [token]);

            if (verificar.rows.length === 0) {
                throw new Error('Invitación no encontrada o inválida');
            }

            const invitado = verificar.rows[0];

            // Verificar que el evento esté publicado
            if (invitado.evento_estado !== 'publicado') {
                throw new Error('El evento no está disponible para confirmaciones');
            }

            // Verificar fecha límite de RSVP
            if (invitado.fecha_limite_rsvp && new Date(invitado.fecha_limite_rsvp) < new Date()) {
                throw new Error('La fecha límite para confirmar ha pasado');
            }

            // Verificar número de asistentes
            if (datos.num_asistentes > invitado.max_acompanantes + 1) {
                throw new Error(`Máximo ${invitado.max_acompanantes + 1} asistentes permitidos`);
            }

            const query = `
                UPDATE invitados_evento
                SET estado_rsvp = $1,
                    num_asistentes = $2,
                    nombres_acompanantes = $3::jsonb,
                    mensaje_rsvp = $4,
                    restricciones_dieteticas = $5,
                    confirmado_en = NOW(),
                    confirmado_via = $6,
                    actualizado_en = NOW()
                WHERE token = $7
                RETURNING *
            `;

            const valores = [
                datos.asistira ? 'confirmado' : 'declinado',
                datos.asistira ? (datos.num_asistentes || 1) : 0,
                datos.nombres_acompanantes ? JSON.stringify(datos.nombres_acompanantes) : '[]',
                datos.mensaje || null,
                datos.restricciones_dieteticas || null,
                datos.via || 'web',
                token
            ];

            logger.info('[InvitadoModel.confirmarRSVP] Confirmación RSVP', {
                token: token.substring(0, 8) + '...',
                asistira: datos.asistira,
                num_asistentes: datos.num_asistentes
            });

            const result = await db.query(query, valores);
            return result.rows[0];
        });
    }

    /**
     * Eliminar invitado (soft delete)
     *
     * @param {number} id - ID del invitado
     * @param {number} organizacionId - ID de la organización
     * @returns {boolean} true si se eliminó
     */
    static async eliminar(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                UPDATE invitados_evento
                SET activo = false, actualizado_en = NOW()
                WHERE id = $1
                RETURNING id
            `;

            const result = await db.query(query, [id]);
            return result.rows.length > 0;
        });
    }

    /**
     * Exportar invitados para CSV
     *
     * @param {number} eventoId - ID del evento
     * @param {number} organizacionId - ID de la organización
     * @returns {Array} Lista de invitados para exportar
     */
    static async exportar(eventoId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    nombre,
                    email,
                    telefono,
                    grupo_familiar,
                    max_acompanantes,
                    estado_rsvp,
                    num_asistentes,
                    mensaje_rsvp,
                    restricciones_dieteticas,
                    confirmado_en,
                    confirmado_via
                FROM invitados_evento
                WHERE evento_id = $1 AND activo = true
                ORDER BY nombre
            `;

            const result = await db.query(query, [eventoId]);
            return result.rows;
        });
    }

    /**
     * Obtener grupos familiares únicos
     *
     * @param {number} eventoId - ID del evento
     * @param {number} organizacionId - ID de la organización
     * @returns {Array} Lista de grupos familiares
     */
    static async obtenerGrupos(eventoId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT DISTINCT grupo_familiar
                FROM invitados_evento
                WHERE evento_id = $1
                  AND activo = true
                  AND grupo_familiar IS NOT NULL
                ORDER BY grupo_familiar
            `;

            const result = await db.query(query, [eventoId]);
            return result.rows.map(r => r.grupo_familiar);
        });
    }

    /**
     * Obtener etiquetas únicas
     *
     * @param {number} eventoId - ID del evento
     * @param {number} organizacionId - ID de la organización
     * @returns {Array} Lista de etiquetas
     */
    static async obtenerEtiquetas(eventoId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT DISTINCT jsonb_array_elements_text(etiquetas) as etiqueta
                FROM invitados_evento
                WHERE evento_id = $1 AND activo = true
                ORDER BY etiqueta
            `;

            const result = await db.query(query, [eventoId]);
            return result.rows.map(r => r.etiqueta);
        });
    }
}

module.exports = InvitadoModel;
