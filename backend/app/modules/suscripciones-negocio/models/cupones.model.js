/**
 * ====================================================================
 * MODEL: CUPONES DE DESCUENTO
 * ====================================================================
 * Gestión de cupones de descuento para suscripciones.
 *
 * @module models/cupones
 */

const RLSContextManager = require('../../../utils/rlsContextManager');
const { ErrorHelper, ParseHelper } = require('../../../utils/helpers');
const logger = require('../../../utils/logger');

class CuponesModel {

    /**
     * Listar cupones con paginación y filtros
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
            tipo_descuento,
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

            // Filtro por tipo de descuento
            if (tipo_descuento) {
                whereConditions.push(`tipo_descuento = $${paramCount++}`);
                params.push(tipo_descuento);
            }

            // Búsqueda por código o nombre
            if (busqueda) {
                whereConditions.push(`(codigo ILIKE $${paramCount} OR nombre ILIKE $${paramCount})`);
                params.push(`%${busqueda}%`);
                paramCount++;
            }

            const whereClause = whereConditions.length > 0
                ? `WHERE ${whereConditions.join(' AND ')}`
                : '';

            // Query de conteo
            const countQuery = `
                SELECT COUNT(*) as total
                FROM cupones_suscripcion
                ${whereClause}
            `;

            const countResult = await db.query(countQuery, params);
            const total = parseInt(countResult.rows[0].total);

            // Query principal
            const query = `
                SELECT
                    id, codigo, nombre, descripcion,
                    tipo_descuento, porcentaje_descuento, monto_descuento, moneda,
                    duracion_descuento, meses_duracion,
                    fecha_inicio, fecha_expiracion,
                    usos_maximos, usos_actuales,
                    planes_aplicables, solo_primer_pago,
                    activo, creado_en, actualizado_en
                FROM cupones_suscripcion
                ${whereClause}
                ORDER BY creado_en DESC
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
     * Listar solo cupones activos y vigentes
     *
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Array>} - Array de cupones activos
     */
    static async listarActivos(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    id, codigo, nombre, descripcion,
                    tipo_descuento, porcentaje_descuento, monto_descuento, moneda,
                    duracion_descuento, meses_duracion,
                    fecha_inicio, fecha_expiracion,
                    usos_maximos, usos_actuales
                FROM cupones_suscripcion
                WHERE activo = TRUE
                  AND fecha_inicio <= CURRENT_DATE
                  AND (fecha_expiracion IS NULL OR fecha_expiracion >= CURRENT_DATE)
                  AND (usos_maximos IS NULL OR usos_actuales < usos_maximos)
                ORDER BY creado_en DESC
            `;

            const result = await db.query(query);
            return result.rows;
        });
    }

    /**
     * Buscar cupón por ID
     *
     * @param {number} id - ID del cupón
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object|null>} - Cupón encontrado o null
     */
    static async buscarPorId(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT * FROM cupones_suscripcion
                WHERE id = $1
            `;

            const result = await db.query(query, [id]);
            return result.rows[0] || null;
        });
    }

    /**
     * Buscar cupón por código
     *
     * @param {string} codigo - Código del cupón
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object|null>} - Cupón encontrado o null
     */
    static async buscarPorCodigo(codigo, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT * FROM cupones_suscripcion
                WHERE codigo = $1
            `;

            const result = await db.query(query, [codigo]);
            return result.rows[0] || null;
        });
    }

    /**
     * Validar cupón para uso
     *
     * @param {string} codigo - Código del cupón
     * @param {number} organizacionId - ID de la organización
     * @param {Object} options - Opciones de validación (plan_id)
     * @returns {Promise<Object>} - {valido: boolean, cupon: Object|null, razon: string}
     */
    static async validar(codigo, organizacionId, options = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const cupon = await this.buscarPorCodigo(codigo, organizacionId);

            if (!cupon) {
                return { valido: false, cupon: null, razon: 'Cupón no encontrado' };
            }

            if (!cupon.activo) {
                return { valido: false, cupon, razon: 'Cupón inactivo' };
            }

            // Validar fechas
            const hoy = new Date();
            const fechaInicio = new Date(cupon.fecha_inicio);
            const fechaExpiracion = cupon.fecha_expiracion ? new Date(cupon.fecha_expiracion) : null;

            if (hoy < fechaInicio) {
                return { valido: false, cupon, razon: 'Cupón aún no válido' };
            }

            if (fechaExpiracion && hoy > fechaExpiracion) {
                return { valido: false, cupon, razon: 'Cupón expirado' };
            }

            // Validar usos
            if (cupon.usos_maximos && cupon.usos_actuales >= cupon.usos_maximos) {
                return { valido: false, cupon, razon: 'Cupón agotado (máximo de usos alcanzado)' };
            }

            // Validar plan aplicable
            if (options.plan_id && cupon.planes_aplicables) {
                const planQuery = `SELECT codigo FROM planes_suscripcion_org WHERE id = $1`;
                const planResult = await db.query(planQuery, [options.plan_id]);
                const planCodigo = planResult.rows[0]?.codigo;

                const planesAplicables = Array.isArray(cupon.planes_aplicables)
                    ? cupon.planes_aplicables
                    : [];

                if (planesAplicables.length > 0 && !planesAplicables.includes(planCodigo)) {
                    return { valido: false, cupon, razon: 'Cupón no aplicable a este plan' };
                }
            }

            return { valido: true, cupon, razon: null };
        });
    }

    /**
     * Crear nuevo cupón
     *
     * @param {Object} cuponData - Datos del cupón
     * @param {number} organizacionId - ID de la organización
     * @param {number} creadoPorId - ID del usuario que crea
     * @returns {Promise<Object>} - Cupón creado
     */
    static async crear(cuponData, organizacionId, creadoPorId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const {
                codigo,
                nombre,
                descripcion,
                tipo_descuento,
                porcentaje_descuento,
                monto_descuento,
                moneda = 'MXN',
                duracion_descuento = 'una_vez',
                meses_duracion,
                fecha_inicio,
                fecha_expiracion,
                usos_maximos,
                planes_aplicables,
                solo_primer_pago = false,
                activo = true
            } = cuponData;

            // Validar que el código no exista
            const existente = await this.buscarPorCodigo(codigo, organizacionId);
            if (existente) {
                ErrorHelper.throwConflict(`Ya existe un cupón con el código ${codigo}`);
            }

            const query = `
                INSERT INTO cupones_suscripcion (
                    organizacion_id, codigo, nombre, descripcion,
                    tipo_descuento, porcentaje_descuento, monto_descuento, moneda,
                    duracion_descuento, meses_duracion,
                    fecha_inicio, fecha_expiracion,
                    usos_maximos, planes_aplicables, solo_primer_pago,
                    activo, creado_por
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                RETURNING *
            `;

            const values = [
                organizacionId,
                codigo.toUpperCase(),
                nombre,
                descripcion,
                tipo_descuento,
                porcentaje_descuento,
                monto_descuento,
                moneda,
                duracion_descuento,
                meses_duracion,
                fecha_inicio,
                fecha_expiracion,
                usos_maximos,
                planes_aplicables ? JSON.stringify(planes_aplicables) : null,
                solo_primer_pago,
                activo,
                creadoPorId
            ];

            const result = await db.query(query, values);

            logger.info(`Cupón creado: ${codigo} en org ${organizacionId}`);

            return result.rows[0];
        });
    }

    /**
     * Actualizar cupón existente
     *
     * @param {number} id - ID del cupón
     * @param {Object} cuponData - Datos a actualizar
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object>} - Cupón actualizado
     */
    static async actualizar(id, cuponData, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Verificar existencia
            const cuponExistente = await this.buscarPorId(id, organizacionId);
            ErrorHelper.throwIfNotFound(cuponExistente, 'Cupón');

            const {
                nombre,
                descripcion,
                tipo_descuento,
                porcentaje_descuento,
                monto_descuento,
                duracion_descuento,
                meses_duracion,
                fecha_inicio,
                fecha_expiracion,
                usos_maximos,
                planes_aplicables,
                solo_primer_pago,
                activo
            } = cuponData;

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
            if (tipo_descuento !== undefined) {
                updates.push(`tipo_descuento = $${paramCount++}`);
                values.push(tipo_descuento);
            }
            if (porcentaje_descuento !== undefined) {
                updates.push(`porcentaje_descuento = $${paramCount++}`);
                values.push(porcentaje_descuento);
            }
            if (monto_descuento !== undefined) {
                updates.push(`monto_descuento = $${paramCount++}`);
                values.push(monto_descuento);
            }
            if (duracion_descuento !== undefined) {
                updates.push(`duracion_descuento = $${paramCount++}`);
                values.push(duracion_descuento);
            }
            if (meses_duracion !== undefined) {
                updates.push(`meses_duracion = $${paramCount++}`);
                values.push(meses_duracion);
            }
            if (fecha_inicio !== undefined) {
                updates.push(`fecha_inicio = $${paramCount++}`);
                values.push(fecha_inicio);
            }
            if (fecha_expiracion !== undefined) {
                updates.push(`fecha_expiracion = $${paramCount++}`);
                values.push(fecha_expiracion);
            }
            if (usos_maximos !== undefined) {
                updates.push(`usos_maximos = $${paramCount++}`);
                values.push(usos_maximos);
            }
            if (planes_aplicables !== undefined) {
                updates.push(`planes_aplicables = $${paramCount++}`);
                values.push(JSON.stringify(planes_aplicables));
            }
            if (solo_primer_pago !== undefined) {
                updates.push(`solo_primer_pago = $${paramCount++}`);
                values.push(solo_primer_pago);
            }
            if (activo !== undefined) {
                updates.push(`activo = $${paramCount++}`);
                values.push(activo);
            }

            if (updates.length === 0) {
                return cuponExistente;
            }

            updates.push(`actualizado_en = NOW()`);
            values.push(id);

            const query = `
                UPDATE cupones_suscripcion
                SET ${updates.join(', ')}
                WHERE id = $${paramCount}
                RETURNING *
            `;

            const result = await db.query(query, values);

            logger.info(`Cupón actualizado: ID ${id} en org ${organizacionId}`);

            return result.rows[0];
        });
    }

    /**
     * Eliminar cupón (solo si no tiene usos)
     *
     * @param {number} id - ID del cupón
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<boolean>} - true si se eliminó
     */
    static async eliminar(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Verificar existencia
            const cupon = await this.buscarPorId(id, organizacionId);
            ErrorHelper.throwIfNotFound(cupon, 'Cupón');

            // Verificar que no tenga usos
            if (cupon.usos_actuales > 0) {
                ErrorHelper.throwConflict(
                    `No se puede eliminar el cupón porque ya tiene ${cupon.usos_actuales} usos`
                );
            }

            // Eliminar cupón
            const deleteQuery = `DELETE FROM cupones_suscripcion WHERE id = $1`;
            await db.query(deleteQuery, [id]);

            logger.info(`Cupón eliminado: ID ${id} en org ${organizacionId}`);

            return true;
        });
    }

    /**
     * Incrementar contador de usos de un cupón
     *
     * @param {number} id - ID del cupón
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object>} - Cupón actualizado
     */
    static async incrementarUso(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                UPDATE cupones_suscripcion
                SET usos_actuales = usos_actuales + 1,
                    actualizado_en = NOW()
                WHERE id = $1
                RETURNING *
            `;

            const result = await db.query(query, [id]);
            return result.rows[0];
        });
    }

    /**
     * Desactivar cupón
     *
     * @param {number} id - ID del cupón
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object>} - Cupón desactivado
     */
    static async desactivar(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const cupon = await this.buscarPorId(id, organizacionId);
            ErrorHelper.throwIfNotFound(cupon, 'Cupón');

            const query = `
                UPDATE cupones_suscripcion
                SET activo = FALSE,
                    actualizado_en = NOW()
                WHERE id = $1
                RETURNING *
            `;

            const result = await db.query(query, [id]);

            logger.info(`Cupón desactivado: ID ${id}`);

            return result.rows[0];
        });
    }
}

module.exports = CuponesModel;
