const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');
const PaginationHelper = require('../../../utils/helpers').PaginationHelper;
const db = require('../../../config/database');

/**
 * ====================================================================
 * MODEL - RESEÑAS DE MARKETPLACE
 * ====================================================================
 *
 * Gestiona operaciones CRUD para reseñas de clientes.
 *
 * MÉTODOS:
 * • crear() - Crear reseña (actualiza stats automáticamente vía trigger)
 * • responder() - Agregar respuesta del negocio
 * • moderar() - Cambiar estado de reseña
 * • listar() - Listar reseñas con paginación
 * • obtenerPorId() - Obtener reseña por ID
 * • validarCitaParaReseña() - Validar que cita está completada
 * • verificarReseñaExistente() - Evitar reseñas duplicadas
 *
 * CARACTERÍSTICAS:
 * • Trigger auto-actualiza stats del perfil
 * • RLS para multi-tenant
 * • Una reseña por cita (UNIQUE constraint)
 * • Estados: pendiente, publicada, reportada, oculta
 *
 * Fecha creación: 17 Noviembre 2025
 */
class ReseñasMarketplaceModel {

    /**
     * Crear reseña
     * El trigger actualiza automáticamente marketplace_perfiles stats
     *
     * @param {Object} datos - Datos de la reseña
     * @returns {Object} Reseña creada
     */
    static async crear(datos) {
        return await RLSContextManager.query(datos.organizacion_id, async (db) => {
            const query = `
                INSERT INTO marketplace_reseñas (
                    organizacion_id,
                    cliente_id,
                    cita_id,
                    fecha_cita,
                    profesional_id,
                    rating,
                    titulo,
                    comentario,
                    estado
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, 'publicada'
                )
                RETURNING *
            `;

            const valores = [
                datos.organizacion_id,
                datos.cliente_id,
                datos.cita_id,
                datos.fecha_cita,
                datos.profesional_id,
                datos.rating,
                datos.titulo,
                datos.comentario
            ];

            logger.info('[ReseñasMarketplaceModel.crear] Creando reseña', {
                organizacion_id: datos.organizacion_id,
                cliente_id: datos.cliente_id,
                cita_id: datos.cita_id,
                rating: datos.rating
            });

            const result = await db.query(query, valores);
            return result.rows[0];
        });
    }

    /**
     * Responder a una reseña (negocio)
     *
     * @param {number} id - ID de la reseña
     * @param {Object} datos - {respuesta_negocio, respondido_por}
     * @param {number} organizacionId - ID de la organización
     * @returns {Object} Reseña actualizada
     */
    static async responder(id, datos, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                UPDATE marketplace_reseñas
                SET respuesta_negocio = $1,
                    respondido_por = $2,
                    respondido_en = NOW(),
                    actualizado_en = NOW()
                WHERE id = $3
                RETURNING *
            `;

            logger.info('[ReseñasMarketplaceModel.responder] Respondiendo reseña', {
                reseña_id: id,
                organizacion_id: organizacionId,
                respondido_por: datos.respondido_por
            });

            const result = await db.query(query, [
                datos.respuesta_negocio,
                datos.respondido_por,
                id
            ]);

            return result.rows[0];
        });
    }

    /**
     * Moderar reseña (cambiar estado)
     *
     * @param {number} id - ID de la reseña
     * @param {Object} datos - {estado, motivo_reporte, moderada_por}
     * @param {number} organizacionId - ID de la organización
     * @returns {Object} Reseña actualizada
     */
    static async moderar(id, datos, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                UPDATE marketplace_reseñas
                SET estado = $1,
                    motivo_reporte = $2,
                    moderada_por = $3,
                    moderada_en = NOW(),
                    actualizado_en = NOW()
                WHERE id = $4
                RETURNING *
            `;

            logger.info('[ReseñasMarketplaceModel.moderar] Moderando reseña', {
                reseña_id: id,
                organizacion_id: organizacionId,
                nuevo_estado: datos.estado,
                moderada_por: datos.moderada_por
            });

            const result = await db.query(query, [
                datos.estado,
                datos.motivo_reporte,
                datos.moderada_por,
                id
            ]);

            return result.rows[0];
        });
    }

    /**
     * Listar reseñas de un negocio
     * Acceso público con filtros
     *
     * @param {number} organizacionId - ID de la organización
     * @param {Object} filtros - {estado, rating_minimo, pagina, limite}
     * @returns {Object} {reseñas, paginacion}
     */
    static async listar(organizacionId, filtros = {}) {
        return await RLSContextManager.withBypass(async (db) => {
            let whereConditions = ['r.organizacion_id = $1'];
            let queryParams = [organizacionId];
            let paramIndex = 2;

            // Filtro de estado (por defecto 'publicada')
            if (filtros.estado) {
                whereConditions.push(`r.estado = $${paramIndex}`);
                queryParams.push(filtros.estado);
                paramIndex++;
            }

            // Filtro de rating mínimo
            if (filtros.rating_minimo) {
                whereConditions.push(`r.rating >= $${paramIndex}`);
                queryParams.push(filtros.rating_minimo);
                paramIndex++;
            }

            const whereClause = whereConditions.join(' AND ');

            // Contar total
            const countQuery = `
                SELECT COUNT(*) as total
                FROM marketplace_reseñas r
                WHERE ${whereClause}
            `;

            const countResult = await db.query(countQuery, queryParams);
            const total = parseInt(countResult.rows[0].total);

            // Paginación
            const { limit, offset } = PaginationHelper.calculatePagination(
                filtros.pagina || 1,
                filtros.limite || 10
            );

            // Query principal con JOINs
            const query = `
                SELECT
                    r.*,
                    c.nombre as cliente_nombre,
                    p.nombre_completo as profesional_nombre,
                    u.nombre as respondido_por_nombre
                FROM marketplace_reseñas r
                INNER JOIN clientes c ON r.cliente_id = c.id
                LEFT JOIN profesionales p ON r.profesional_id = p.id
                LEFT JOIN usuarios u ON r.respondido_por = u.id
                WHERE ${whereClause}
                ORDER BY r.creado_en DESC
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `;

            queryParams.push(limit, offset);

            logger.info('[ReseñasMarketplaceModel.listar] Listando reseñas', {
                organizacion_id: organizacionId,
                filtros,
                total,
                limite: limit,
                offset
            });

            const result = await db.query(query, queryParams);

            return {
                reseñas: result.rows,
                paginacion: PaginationHelper.getPaginationInfo(
                    total,
                    filtros.pagina || 1,
                    filtros.limite || 10
                )
            };
        });
    }

    /**
     * Obtener reseña por ID
     *
     * @param {number} id - ID de la reseña
     * @param {number} organizacionId - ID de la organización
     * @returns {Object|null} Reseña o null
     */
    static async obtenerPorId(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    r.*,
                    c.nombre as cliente_nombre,
                    c.telefono as cliente_telefono,
                    p.nombre_completo as profesional_nombre
                FROM marketplace_reseñas r
                INNER JOIN clientes c ON r.cliente_id = c.id
                LEFT JOIN profesionales p ON r.profesional_id = p.id
                WHERE r.id = $1
            `;

            logger.info('[ReseñasMarketplaceModel.obtenerPorId] Obteniendo reseña', {
                reseña_id: id,
                organizacion_id: organizacionId
            });

            const result = await db.query(query, [id]);
            return result.rows[0] || null;
        });
    }

    /**
     * Validar que una cita puede recibir reseña
     * Condiciones:
     * • Cita debe existir
     * • Estado debe ser 'completada'
     * • Debe pertenecer al cliente
     *
     * @param {number} citaId - ID de la cita
     * @param {Date} fechaCita - Fecha de la cita
     * @param {number} clienteId - ID del cliente
     * @param {number} organizacionId - ID de la organización
     * @returns {Object} {valida: boolean, mensaje: string, organizacion_id?: number}
     */
    static async validarCitaParaReseña(citaId, fechaCita, clienteId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    c.id,
                    c.organizacion_id,
                    c.estado,
                    c.cliente_id
                FROM citas c
                WHERE c.id = $1
                  AND c.fecha_cita = $2
            `;

            logger.info('[ReseñasMarketplaceModel.validarCitaParaReseña] Validando cita', {
                cita_id: citaId,
                fecha_cita: fechaCita,
                cliente_id: clienteId
            });

            const result = await db.query(query, [citaId, fechaCita]);

            if (result.rows.length === 0) {
                return {
                    valida: false,
                    mensaje: 'La cita no existe'
                };
            }

            const cita = result.rows[0];

            // Validar que pertenece al cliente
            if (cita.cliente_id !== clienteId) {
                return {
                    valida: false,
                    mensaje: 'Esta cita no pertenece al cliente autenticado'
                };
            }

            // Validar que está completada
            if (cita.estado !== 'completada') {
                return {
                    valida: false,
                    mensaje: 'Solo se pueden reseñar citas completadas'
                };
            }

            return {
                valida: true,
                organizacion_id: cita.organizacion_id,
                mensaje: 'Cita válida para reseña'
            };
        });
    }

    /**
     * Verificar si ya existe una reseña para una cita
     * Constraint UNIQUE en BD (cita_id, fecha_cita)
     *
     * @param {number} citaId - ID de la cita
     * @param {Date} fechaCita - Fecha de la cita
     * @returns {Object|null} Reseña existente o null
     */
    static async verificarReseñaExistente(citaId, fechaCita) {
        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                SELECT id, rating, creado_en
                FROM marketplace_reseñas
                WHERE cita_id = $1
                  AND fecha_cita = $2
            `;

            logger.info('[ReseñasMarketplaceModel.verificarReseñaExistente] Verificando reseña duplicada', {
                cita_id: citaId,
                fecha_cita: fechaCita
            });

            const result = await db.query(query, [citaId, fechaCita]);
            return result.rows[0] || null;
        });
    }
}

module.exports = ReseñasMarketplaceModel;
