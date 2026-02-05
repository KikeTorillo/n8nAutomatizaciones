/**
 * ====================================================================
 * MODEL - EVENTOS DIGITALES
 * ====================================================================
 *
 * Gestiona operaciones CRUD para eventos con invitaciones digitales.
 *
 * MÉTODOS:
 * • crear() - Crear evento con slug auto-generado
 * • actualizar() - Actualizar evento (requiere RLS)
 * • obtenerPorId() - Obtener por ID (requiere RLS)
 * • obtenerPorSlug() - Obtener público por slug (bypass RLS)
 * • listar() - Listar eventos de la organización
 * • publicar() - Cambiar estado a publicado
 * • obtenerEstadisticas() - Estadísticas de RSVP
 * • eliminar() - Soft delete
 *
 * Fecha creación: 4 Diciembre 2025
 */

const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');
const { PaginationHelper, ErrorHelper } = require('../../../utils/helpers');

class EventoModel {

    /**
     * Crear evento digital
     * Auto-genera slug único basado en el nombre
     *
     * @param {Object} datos - Datos del evento
     * @returns {Object} Evento creado
     */
    static async crear(datos) {
        return await RLSContextManager.transaction(datos.organizacion_id, async (db) => {
            // Generar slug único usando la función SQL
            const slugResult = await db.query(
                'SELECT generar_slug_evento($1, $2) as slug',
                [datos.nombre, datos.organizacion_id]
            );
            const slug = slugResult.rows[0].slug;

            const query = `
                INSERT INTO eventos_digitales (
                    organizacion_id,
                    plantilla_id,
                    nombre,
                    tipo,
                    slug,
                    descripcion,
                    fecha_evento,
                    hora_evento,
                    fecha_fin_evento,
                    fecha_limite_rsvp,
                    protagonistas,
                    portada_url,
                    galeria_urls,
                    configuracion,
                    plantilla,
                    estado
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                    $11, $12, $13, $14, $15, $16
                )
                RETURNING *
            `;

            const valores = [
                datos.organizacion_id,
                datos.plantilla_id || null,
                datos.nombre,
                datos.tipo,
                slug,
                datos.descripcion || null,
                datos.fecha_evento,
                datos.hora_evento || null,
                datos.fecha_fin_evento || null,
                datos.fecha_limite_rsvp || null,
                datos.protagonistas ? JSON.stringify(datos.protagonistas) : '[]',
                datos.portada_url || null,
                datos.galeria_urls ? JSON.stringify(datos.galeria_urls) : '[]',
                datos.configuracion ? JSON.stringify(datos.configuracion) : '{}',
                datos.plantilla ? JSON.stringify(datos.plantilla) : '{}',
                'borrador'
            ];

            logger.info('[EventoModel.crear] Creando evento', {
                organizacion_id: datos.organizacion_id,
                nombre: datos.nombre,
                tipo: datos.tipo,
                slug
            });

            const result = await db.query(query, valores);
            return result.rows[0];
        });
    }

    /**
     * Actualizar evento
     *
     * @param {number} id - ID del evento
     * @param {Object} datos - Datos a actualizar
     * @param {number} organizacionId - ID de la organización (RLS)
     * @returns {Object} Evento actualizado
     */
    static async actualizar(id, datos, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const campos = [];
            const valores = [id];
            let paramIndex = 2;

            const camposPermitidos = [
                'plantilla_id', 'nombre', 'descripcion', 'fecha_evento',
                'hora_evento', 'fecha_fin_evento', 'fecha_limite_rsvp',
                'protagonistas', 'portada_url', 'galeria_urls', 'configuracion',
                'plantilla'
            ];

            for (const campo of camposPermitidos) {
                if (datos[campo] !== undefined) {
                    // Campos JSONB
                    if (['protagonistas', 'galeria_urls', 'configuracion', 'plantilla'].includes(campo)) {
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
                ErrorHelper.throwValidation('No hay campos para actualizar');
            }

            const query = `
                UPDATE eventos_digitales
                SET ${campos.join(', ')},
                    actualizado_en = NOW()
                WHERE id = $1
                RETURNING *
            `;

            logger.info('[EventoModel.actualizar] Actualizando evento', {
                evento_id: id,
                organizacion_id: organizacionId,
                campos_actualizados: Object.keys(datos)
            });

            const result = await db.query(query, valores);
            return result.rows[0];
        });
    }

    /**
     * Obtener evento por ID (requiere RLS)
     *
     * @param {number} id - ID del evento
     * @param {number} organizacionId - ID de la organización
     * @returns {Object|null} Evento o null
     */
    static async obtenerPorId(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    e.*,
                    p.nombre as plantilla_nombre,
                    p.codigo as plantilla_codigo
                FROM eventos_digitales e
                LEFT JOIN plantillas_evento p ON e.plantilla_id = p.id
                WHERE e.id = $1
            `;

            const result = await db.query(query, [id]);
            return result.rows[0] || null;
        });
    }

    /**
     * Obtener evento público por slug (bypass RLS)
     * Para vista pública de invitados
     *
     * @param {string} slug - Slug del evento
     * @returns {Object|null} Evento público o null
     */
    static async obtenerPorSlug(slug) {
        return await RLSContextManager.withBypass(async (db) => {
            // Usar función SQL optimizada
            const query = `SELECT * FROM obtener_evento_publico_por_slug($1)`;

            logger.info('[EventoModel.obtenerPorSlug] Obteniendo evento público', { slug });

            const result = await db.query(query, [slug]);
            return result.rows[0] || null;
        });
    }

    /**
     * Listar eventos de la organización
     *
     * @param {number} organizacionId - ID de la organización
     * @param {Object} filtros - Filtros de búsqueda
     * @returns {Object} {eventos, paginacion}
     */
    static async listar(organizacionId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereConditions = ['e.activo = true'];
            let queryParams = [];
            let paramIndex = 1;

            // Filtro por tipo
            if (filtros.tipo) {
                whereConditions.push(`e.tipo = $${paramIndex}`);
                queryParams.push(filtros.tipo);
                paramIndex++;
            }

            // Filtro por estado
            if (filtros.estado) {
                whereConditions.push(`e.estado = $${paramIndex}`);
                queryParams.push(filtros.estado);
                paramIndex++;
            }

            // Filtro por fecha
            if (filtros.fecha_desde) {
                whereConditions.push(`e.fecha_evento >= $${paramIndex}`);
                queryParams.push(filtros.fecha_desde);
                paramIndex++;
            }

            if (filtros.fecha_hasta) {
                whereConditions.push(`e.fecha_evento <= $${paramIndex}`);
                queryParams.push(filtros.fecha_hasta);
                paramIndex++;
            }

            const whereClause = whereConditions.join(' AND ');

            // Contar total
            const countQuery = `
                SELECT COUNT(*) as total
                FROM eventos_digitales e
                WHERE ${whereClause}
            `;
            const countResult = await db.query(countQuery, queryParams);
            const total = parseInt(countResult.rows[0].total);

            // Paginación
            const { limit, offset } = PaginationHelper.calculatePagination(
                filtros.pagina || 1,
                filtros.limite || 20
            );

            // Query principal con estadísticas de invitados
            const query = `
                SELECT
                    e.*,
                    p.nombre as plantilla_nombre,
                    (SELECT COUNT(*) FROM invitados_evento i WHERE i.evento_id = e.id) as total_invitados,
                    (SELECT COUNT(*) FROM invitados_evento i WHERE i.evento_id = e.id AND i.estado_rsvp = 'confirmado') as total_confirmados,
                    (SELECT COUNT(*) FROM invitados_evento i WHERE i.evento_id = e.id AND i.estado_rsvp = 'pendiente') as total_pendientes
                FROM eventos_digitales e
                LEFT JOIN plantillas_evento p ON e.plantilla_id = p.id
                WHERE ${whereClause}
                ORDER BY e.fecha_evento DESC
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `;

            queryParams.push(limit, offset);

            logger.info('[EventoModel.listar] Listando eventos', {
                organizacion_id: organizacionId,
                filtros,
                total
            });

            const result = await db.query(query, queryParams);

            return {
                eventos: result.rows,
                paginacion: PaginationHelper.getPaginationInfo(
                    total,
                    filtros.pagina || 1,
                    filtros.limite || 20
                )
            };
        });
    }

    /**
     * Toggle publicar/despublicar evento
     * Si está en borrador → publicar
     * Si está publicado → despublicar (volver a borrador)
     *
     * @param {number} id - ID del evento
     * @param {number} organizacionId - ID de la organización
     * @returns {Object} Evento actualizado
     */
    static async publicar(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Primero obtener el estado actual
            const checkQuery = `SELECT estado FROM eventos_digitales WHERE id = $1`;
            const checkResult = await db.query(checkQuery, [id]);

            if (checkResult.rows.length === 0) {
                ErrorHelper.throwNotFound('Evento no encontrado');
            }

            const estadoActual = checkResult.rows[0].estado;
            let query;

            if (estadoActual === 'borrador') {
                // Publicar
                query = `
                    UPDATE eventos_digitales
                    SET estado = 'publicado',
                        publicado_en = NOW(),
                        actualizado_en = NOW()
                    WHERE id = $1
                    RETURNING *
                `;
                logger.info('[EventoModel.publicar] Publicando evento', {
                    evento_id: id,
                    organizacion_id: organizacionId
                });
            } else if (estadoActual === 'publicado') {
                // Despublicar
                query = `
                    UPDATE eventos_digitales
                    SET estado = 'borrador',
                        actualizado_en = NOW()
                    WHERE id = $1
                    RETURNING *
                `;
                logger.info('[EventoModel.publicar] Despublicando evento', {
                    evento_id: id,
                    organizacion_id: organizacionId
                });
            } else {
                ErrorHelper.throwConflict(`No se puede cambiar estado desde '${estadoActual}'`);
            }

            const result = await db.query(query, [id]);
            return result.rows[0];
        });
    }

    /**
     * Obtener estadísticas de RSVP del evento
     *
     * @param {number} id - ID del evento
     * @param {number} organizacionId - ID de la organización
     * @returns {Object} Estadísticas
     */
    static async obtenerEstadisticas(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Usar función SQL
            const query = `SELECT * FROM obtener_estadisticas_rsvp($1)`;

            const result = await db.query(query, [id]);
            const stats = result.rows[0];

            // Obtener también distribución por estado
            const distribucionQuery = `
                SELECT
                    estado_rsvp,
                    COUNT(*) as cantidad
                FROM invitados_evento
                WHERE evento_id = $1 AND activo = true
                GROUP BY estado_rsvp
            `;

            const distribucionResult = await db.query(distribucionQuery, [id]);

            // Obtener confirmaciones por día (últimos 7 días)
            const tendenciaQuery = `
                SELECT
                    DATE(confirmado_en) as fecha,
                    COUNT(*) as confirmaciones
                FROM invitados_evento
                WHERE evento_id = $1
                  AND estado_rsvp = 'confirmado'
                  AND confirmado_en >= NOW() - INTERVAL '7 days'
                GROUP BY DATE(confirmado_en)
                ORDER BY fecha
            `;

            const tendenciaResult = await db.query(tendenciaQuery, [id]);

            logger.info('[EventoModel.obtenerEstadisticas] Estadísticas obtenidas', {
                evento_id: id,
                total_invitados: stats.total_invitados,
                total_confirmados: stats.total_confirmados
            });

            return {
                resumen: stats,
                distribucion: distribucionResult.rows,
                tendencia: tendenciaResult.rows
            };
        });
    }

    /**
     * Eliminar evento (soft delete)
     *
     * @param {number} id - ID del evento
     * @param {number} organizacionId - ID de la organización
     * @returns {boolean} true si se eliminó
     */
    static async eliminar(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                UPDATE eventos_digitales
                SET activo = false,
                    actualizado_en = NOW()
                WHERE id = $1
                RETURNING id
            `;

            logger.info('[EventoModel.eliminar] Eliminando evento (soft delete)', {
                evento_id: id,
                organizacion_id: organizacionId
            });

            const result = await db.query(query, [id]);
            return result.rows.length > 0;
        });
    }

    /**
     * Verificar si existe evento por slug
     *
     * @param {string} slug - Slug a verificar
     * @param {number} organizacionId - ID de la organización
     * @returns {boolean} true si existe
     */
    static async existeSlug(slug, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT 1 FROM eventos_digitales
                WHERE slug = $1 AND activo = true
                LIMIT 1
            `;

            const result = await db.query(query, [slug]);
            return result.rows.length > 0;
        });
    }
}

module.exports = EventoModel;
