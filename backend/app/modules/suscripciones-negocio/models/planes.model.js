/**
 * ====================================================================
 * MODEL: PLANES DE SUSCRIPCIÓN
 * ====================================================================
 * Gestión de planes de suscripción configurables por organización.
 *
 * @module models/planes
 */

const RLSContextManager = require('../../../utils/rlsContextManager');
const { ErrorHelper, ParseHelper } = require('../../../utils/helpers');
const logger = require('../../../utils/logger');

class PlanesModel {

    /**
     * Listar planes de suscripción con paginación y filtros
     *
     * @param {Object} options - Opciones de filtrado y paginación
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object>} - {items, paginacion}
     */
    static async listar(options = {}, organizacionId) {
        const {
            page = 1,
            limit = 20,
            activo,
            busqueda
        } = options;

        const { offset } = ParseHelper.parsePagination({ page, limit });

        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereConditions = [];
            let params = [];
            let paramCount = 1;

            // Filtro por activo
            if (activo != null) {
                whereConditions.push(`activo = $${paramCount++}`);
                params.push(activo);
            }

            // Búsqueda por nombre o código
            if (busqueda) {
                whereConditions.push(`(nombre ILIKE $${paramCount} OR codigo ILIKE $${paramCount})`);
                params.push(`%${busqueda}%`);
                paramCount++;
            }

            const whereClause = whereConditions.length > 0
                ? `WHERE ${whereConditions.join(' AND ')}`
                : '';

            // Query de conteo
            const countQuery = `
                SELECT COUNT(*) as total
                FROM planes_suscripcion_org
                ${whereClause}
            `;

            const countResult = await db.query(countQuery, params);
            const total = parseInt(countResult.rows[0].total);

            // Query principal
            const query = `
                SELECT
                    id, codigo, nombre, descripcion,
                    precio_mensual, precio_trimestral, precio_semestral, precio_anual, moneda,
                    dias_trial, limites, features, modulos_habilitados,
                    precio_usuario_adicional, usuarios_incluidos, max_usuarios_hard,
                    color, icono, destacado, activo, publico, orden_display,
                    creado_en, actualizado_en
                FROM planes_suscripcion_org
                ${whereClause}
                ORDER BY orden_display ASC, nombre ASC
                LIMIT $${paramCount} OFFSET $${paramCount + 1}
            `;

            params.push(limit, offset);

            const result = await db.query(query, params);

            return {
                items: result.rows,
                paginacion: {
                    total,
                    pagina: parseInt(page),
                    limite: parseInt(limit),
                    paginas: Math.ceil(total / limit)
                }
            };
        });
    }

    /**
     * Listar solo planes activos (sin paginación)
     *
     * @param {number} organizacionId - ID de la organización
     * @param {boolean} soloPublicos - Si true, filtra planes con publico = TRUE (para /planes/publicos)
     * @returns {Promise<Array>} - Array de planes activos
     */
    static async listarActivos(organizacionId, soloPublicos = false) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Filtrar planes no públicos (ej: enterprise) cuando es para página pública
            const whereClause = soloPublicos
                ? 'WHERE activo = TRUE AND (publico = TRUE OR publico IS NULL)'
                : 'WHERE activo = TRUE';

            const query = `
                SELECT
                    id, codigo, nombre, descripcion,
                    precio_mensual, precio_trimestral, precio_semestral, precio_anual, moneda,
                    dias_trial, limites, features, modulos_habilitados,
                    precio_usuario_adicional, usuarios_incluidos, max_usuarios_hard,
                    color, icono, destacado, publico, orden_display
                FROM planes_suscripcion_org
                ${whereClause}
                ORDER BY orden_display ASC, nombre ASC
            `;

            const result = await db.query(query);
            return result.rows;
        });
    }

    /**
     * Buscar plan por ID
     *
     * @param {number} id - ID del plan
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object|null>} - Plan encontrado o null
     */
    static async buscarPorId(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    id, codigo, nombre, descripcion,
                    precio_mensual, precio_trimestral, precio_semestral, precio_anual, moneda,
                    dias_trial, limites, features, modulos_habilitados,
                    precio_usuario_adicional, usuarios_incluidos, max_usuarios_hard,
                    color, icono, destacado, activo, publico, orden_display,
                    creado_en, actualizado_en, creado_por
                FROM planes_suscripcion_org
                WHERE id = $1
            `;

            const result = await db.query(query, [id]);
            return result.rows[0] || null;
        });
    }

    /**
     * Buscar plan por código
     *
     * @param {string} codigo - Código del plan
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object|null>} - Plan encontrado o null
     */
    static async buscarPorCodigo(codigo, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    id, codigo, nombre, descripcion,
                    precio_mensual, precio_trimestral, precio_semestral, precio_anual, moneda,
                    dias_trial, limites, features, modulos_habilitados,
                    precio_usuario_adicional, usuarios_incluidos, max_usuarios_hard,
                    color, icono, destacado, activo, publico
                FROM planes_suscripcion_org
                WHERE codigo = $1
            `;

            const result = await db.query(query, [codigo]);
            return result.rows[0] || null;
        });
    }

    /**
     * Crear nuevo plan de suscripción
     *
     * @param {Object} planData - Datos del plan
     * @param {number} organizacionId - ID de la organización
     * @param {number} creadoPorId - ID del usuario que crea
     * @returns {Promise<Object>} - Plan creado
     */
    static async crear(planData, organizacionId, creadoPorId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const {
                codigo,
                nombre,
                descripcion,
                precio_mensual = 0,
                precio_trimestral,
                precio_semestral,
                precio_anual,
                moneda = 'MXN',
                dias_trial = 0,
                limites = {},
                features = [],
                modulos_habilitados = [],
                color = '#6366F1',
                icono = 'package',
                destacado = false,
                activo = true,
                publico = true,
                orden_display = 0
            } = planData;

            const query = `
                INSERT INTO planes_suscripcion_org (
                    organizacion_id, codigo, nombre, descripcion,
                    precio_mensual, precio_trimestral, precio_semestral, precio_anual, moneda,
                    dias_trial, limites, features, modulos_habilitados,
                    color, icono, destacado, activo, publico, orden_display,
                    creado_por
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
                RETURNING *
            `;

            const values = [
                organizacionId,
                codigo,
                nombre,
                descripcion,
                precio_mensual,
                precio_trimestral,
                precio_semestral,
                precio_anual,
                moneda,
                dias_trial,
                JSON.stringify(limites),
                JSON.stringify(features),
                JSON.stringify(modulos_habilitados),
                color,
                icono,
                destacado,
                activo,
                publico,
                orden_display,
                creadoPorId
            ];

            const result = await db.query(query, values);

            logger.info(`Plan creado: ${nombre} (${codigo}) en org ${organizacionId}`);

            return result.rows[0];
        });
    }

    /**
     * Actualizar plan existente
     *
     * @param {number} id - ID del plan
     * @param {Object} planData - Datos a actualizar
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object>} - Plan actualizado
     */
    static async actualizar(id, planData, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Verificar existencia
            const planExistente = await this.buscarPorId(id, organizacionId);
            ErrorHelper.throwIfNotFound(planExistente, 'Plan de suscripción');

            const {
                nombre,
                descripcion,
                precio_mensual,
                precio_trimestral,
                precio_semestral,
                precio_anual,
                moneda,
                dias_trial,
                limites,
                features,
                modulos_habilitados,
                color,
                icono,
                destacado,
                activo,
                publico,
                orden_display
            } = planData;

            const updates = [];
            const values = [];
            let paramCount = 1;

            if (nombre !== undefined) {
                updates.push(`nombre = $${paramCount++}`);
                values.push(nombre);
            }
            if (descripcion !== undefined) {
                updates.push(`descripcion = $${paramCount++}`);
                values.push(descripcion);
            }
            if (precio_mensual !== undefined) {
                updates.push(`precio_mensual = $${paramCount++}`);
                values.push(precio_mensual);
            }
            if (precio_trimestral !== undefined) {
                updates.push(`precio_trimestral = $${paramCount++}`);
                values.push(precio_trimestral);
            }
            if (precio_semestral !== undefined) {
                updates.push(`precio_semestral = $${paramCount++}`);
                values.push(precio_semestral);
            }
            if (precio_anual !== undefined) {
                updates.push(`precio_anual = $${paramCount++}`);
                values.push(precio_anual);
            }
            if (moneda !== undefined) {
                updates.push(`moneda = $${paramCount++}`);
                values.push(moneda);
            }
            if (dias_trial !== undefined) {
                updates.push(`dias_trial = $${paramCount++}`);
                values.push(dias_trial);
            }
            if (limites !== undefined) {
                updates.push(`limites = $${paramCount++}`);
                values.push(JSON.stringify(limites));
            }
            if (features !== undefined) {
                updates.push(`features = $${paramCount++}`);
                values.push(JSON.stringify(features));
            }
            if (modulos_habilitados !== undefined) {
                updates.push(`modulos_habilitados = $${paramCount++}`);
                values.push(JSON.stringify(modulos_habilitados));
            }
            if (color !== undefined) {
                updates.push(`color = $${paramCount++}`);
                values.push(color);
            }
            if (icono !== undefined) {
                updates.push(`icono = $${paramCount++}`);
                values.push(icono);
            }
            if (destacado !== undefined) {
                updates.push(`destacado = $${paramCount++}`);
                values.push(destacado);
            }
            if (activo !== undefined) {
                updates.push(`activo = $${paramCount++}`);
                values.push(activo);
            }
            if (publico !== undefined) {
                updates.push(`publico = $${paramCount++}`);
                values.push(publico);
            }
            if (orden_display !== undefined) {
                updates.push(`orden_display = $${paramCount++}`);
                values.push(orden_display);
            }

            if (updates.length === 0) {
                return planExistente;
            }

            updates.push(`actualizado_en = NOW()`);
            values.push(id);

            const query = `
                UPDATE planes_suscripcion_org
                SET ${updates.join(', ')}
                WHERE id = $${paramCount}
                RETURNING *
            `;

            const result = await db.query(query, values);

            logger.info(`Plan actualizado: ID ${id} en org ${organizacionId}`);

            return result.rows[0];
        });
    }

    /**
     * Eliminar plan (solo si no tiene suscripciones activas)
     *
     * @param {number} id - ID del plan
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<boolean>} - true si se eliminó
     */
    static async eliminar(id, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Verificar existencia
            const plan = await this.buscarPorId(id, organizacionId);
            ErrorHelper.throwIfNotFound(plan, 'Plan de suscripción');

            // Verificar que no tenga suscripciones activas
            const checkQuery = `
                SELECT COUNT(*) as total
                FROM suscripciones_org
                WHERE plan_id = $1 AND estado IN ('activa', 'trial')
            `;

            const checkResult = await db.query(checkQuery, [id]);
            const totalActivas = parseInt(checkResult.rows[0].total);

            if (totalActivas > 0) {
                ErrorHelper.throwConflict(
                    `No se puede eliminar el plan porque tiene ${totalActivas} suscripciones activas`
                );
            }

            // Eliminar plan
            const deleteQuery = `DELETE FROM planes_suscripcion_org WHERE id = $1`;
            await db.query(deleteQuery, [id]);

            logger.info(`Plan eliminado: ID ${id} en org ${organizacionId}`);

            return true;
        });
    }

    /**
     * Contar suscripciones activas de un plan
     *
     * @param {number} planId - ID del plan
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<number>} - Número de suscripciones activas
     */
    static async contarSuscripcionesActivas(planId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT COUNT(*) as total
                FROM suscripciones_org
                WHERE plan_id = $1 AND estado IN ('activa', 'trial')
            `;

            const result = await db.query(query, [planId]);
            return parseInt(result.rows[0].total);
        });
    }
}

module.exports = PlanesModel;
