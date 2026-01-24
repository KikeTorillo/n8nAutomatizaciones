/**
 * ====================================================================
 * MODEL: PAGOS DE SUSCRIPCIONES
 * ====================================================================
 * Gestión del historial de pagos de suscripciones.
 *
 * @module models/pagos
 */

const RLSContextManager = require('../../../utils/rlsContextManager');
const { ErrorHelper, ParseHelper } = require('../../../utils/helpers');
const logger = require('../../../utils/logger');

class PagosModel {

    /**
     * Listar pagos con paginación y filtros
     *
     * @param {Object} options - Opciones de filtrado y paginación
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object>} - {items, paginacion}
     */
    static async listar(options = {}, organizacionId) {
        const {
            page = 1,
            limit = 20,
            estado,
            suscripcion_id,
            gateway,
            fecha_desde,
            fecha_hasta
        } = options;

        const { offset } = ParseHelper.parsePagination({ page, limit });

        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereConditions = [];
            let params = [];
            let paramCount = 1;

            // Filtros
            if (estado) {
                whereConditions.push(`p.estado = $${paramCount++}`);
                params.push(estado);
            }

            if (suscripcion_id) {
                whereConditions.push(`p.suscripcion_id = $${paramCount++}`);
                params.push(suscripcion_id);
            }

            if (gateway) {
                whereConditions.push(`p.gateway = $${paramCount++}`);
                params.push(gateway);
            }

            if (fecha_desde) {
                whereConditions.push(`p.fecha_pago >= $${paramCount++}`);
                params.push(fecha_desde);
            }

            if (fecha_hasta) {
                whereConditions.push(`p.fecha_pago <= $${paramCount++}`);
                params.push(fecha_hasta);
            }

            const whereClause = whereConditions.length > 0
                ? `WHERE ${whereConditions.join(' AND ')}`
                : '';

            // Query de conteo
            const countQuery = `
                SELECT COUNT(*) as total
                FROM pagos_suscripcion p
                ${whereClause}
            `;

            const countResult = await db.query(countQuery, params);
            const total = parseInt(countResult.rows[0].total);

            // Query principal
            const query = `
                SELECT
                    p.*,
                    s.cliente_id,
                    s.suscriptor_externo,
                    pl.nombre as plan_nombre,
                    c.nombre as cliente_nombre
                FROM pagos_suscripcion p
                INNER JOIN suscripciones_org s ON p.suscripcion_id = s.id
                INNER JOIN planes_suscripcion_org pl ON s.plan_id = pl.id
                LEFT JOIN clientes c ON s.cliente_id = c.id
                ${whereClause}
                ORDER BY p.creado_en DESC
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
     * Buscar pago por ID
     *
     * @param {number} id - ID del pago
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object|null>} - Pago encontrado o null
     */
    static async buscarPorId(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    p.*,
                    s.cliente_id,
                    s.suscriptor_externo,
                    pl.nombre as plan_nombre,
                    c.nombre as cliente_nombre,
                    c.email as cliente_email
                FROM pagos_suscripcion p
                INNER JOIN suscripciones_org s ON p.suscripcion_id = s.id
                INNER JOIN planes_suscripcion_org pl ON s.plan_id = pl.id
                LEFT JOIN clientes c ON s.cliente_id = c.id
                WHERE p.id = $1
            `;

            const result = await db.query(query, [id]);
            return result.rows[0] || null;
        });
    }

    /**
     * Crear registro de pago
     *
     * @param {Object} pagoData - Datos del pago
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object>} - Pago creado
     */
    static async crear(pagoData, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const {
                suscripcion_id,
                monto,
                moneda = 'MXN',
                estado = 'pendiente',
                gateway,
                transaction_id,
                payment_intent_id,
                charge_id,
                metodo_pago,
                ultimos_digitos,
                fecha_inicio_periodo,
                fecha_fin_periodo,
                metadata = {},
                procesado_por
            } = pagoData;

            const query = `
                INSERT INTO pagos_suscripcion (
                    organizacion_id, suscripcion_id,
                    monto, moneda, estado,
                    gateway, transaction_id, payment_intent_id, charge_id,
                    metodo_pago, ultimos_digitos,
                    fecha_inicio_periodo, fecha_fin_periodo,
                    metadata, procesado_por
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                RETURNING *
            `;

            const values = [
                organizacionId,
                suscripcion_id,
                monto,
                moneda,
                estado,
                gateway,
                transaction_id,
                payment_intent_id,
                charge_id,
                metodo_pago,
                ultimos_digitos,
                fecha_inicio_periodo,
                fecha_fin_periodo,
                JSON.stringify(metadata),
                procesado_por
            ];

            const result = await db.query(query, values);

            logger.info(`Pago registrado: ID ${result.rows[0].id} - Monto: ${monto} ${moneda}`);

            return result.rows[0];
        });
    }

    /**
     * Crear registro de pago usando bypass RLS
     * Usado por checkout público donde no hay contexto de usuario autenticado
     *
     * @param {Object} pagoData - Datos del pago
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object>} - Pago creado
     */
    static async crearBypass(pagoData, organizacionId) {
        return await RLSContextManager.withBypass(async (db) => {
            const {
                suscripcion_id,
                monto,
                moneda = 'MXN',
                estado = 'pendiente',
                gateway,
                transaction_id,
                payment_intent_id,
                charge_id,
                metodo_pago,
                ultimos_digitos,
                fecha_inicio_periodo,
                fecha_fin_periodo,
                metadata = {}
            } = pagoData;

            const query = `
                INSERT INTO pagos_suscripcion (
                    organizacion_id, suscripcion_id,
                    monto, moneda, estado,
                    gateway, transaction_id, payment_intent_id, charge_id,
                    metodo_pago, ultimos_digitos,
                    fecha_inicio_periodo, fecha_fin_periodo,
                    metadata
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                RETURNING *
            `;

            const values = [
                organizacionId,
                suscripcion_id,
                monto,
                moneda,
                estado,
                gateway,
                transaction_id,
                payment_intent_id,
                charge_id,
                metodo_pago,
                ultimos_digitos,
                fecha_inicio_periodo,
                fecha_fin_periodo,
                JSON.stringify(metadata)
            ];

            const result = await db.query(query, values);

            logger.info(`[Bypass] Pago registrado: ID ${result.rows[0].id} - Monto: ${monto} ${moneda}`);

            return result.rows[0];
        });
    }

    /**
     * Actualizar estado del pago
     *
     * @param {number} id - ID del pago
     * @param {string} nuevoEstado - Nuevo estado (pendiente, completado, fallido, reembolsado)
     * @param {number} organizacionId - ID de la organización
     * @param {Object} options - Opciones adicionales
     * @returns {Promise<Object>} - Pago actualizado
     */
    static async actualizarEstado(id, nuevoEstado, organizacionId, options = {}) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const pago = await this.buscarPorId(id, organizacionId);
            ErrorHelper.throwIfNotFound(pago, 'Pago');

            const estadosValidos = ['pendiente', 'completado', 'fallido', 'reembolsado'];
            if (!estadosValidos.includes(nuevoEstado)) {
                ErrorHelper.throwValidation(`Estado inválido: ${nuevoEstado}`);
            }

            let query;
            let values;

            if (nuevoEstado === 'completado') {
                query = `
                    UPDATE pagos_suscripcion
                    SET estado = $1,
                        fecha_pago = NOW()
                    WHERE id = $2
                    RETURNING *
                `;
                values = [nuevoEstado, id];

                // Actualizar total_pagado en suscripción
                await db.query(
                    `UPDATE suscripciones_org
                     SET total_pagado = total_pagado + $1
                     WHERE id = $2`,
                    [pago.monto, pago.suscripcion_id]
                );
            } else {
                query = `
                    UPDATE pagos_suscripcion
                    SET estado = $1
                    WHERE id = $2
                    RETURNING *
                `;
                values = [nuevoEstado, id];
            }

            const result = await db.query(query, values);

            logger.info(`Pago ${id} cambió a estado: ${nuevoEstado}`);

            return result.rows[0];
        });
    }

    /**
     * Actualizar campos de un pago (para guardar IDs del gateway)
     *
     * @param {number} id - ID del pago
     * @param {Object} datos - Datos a actualizar
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object>} - Pago actualizado
     */
    static async actualizar(id, datos, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const pago = await this.buscarPorId(id, organizacionId);
            ErrorHelper.throwIfNotFound(pago, 'Pago');

            const camposPermitidos = [
                'payment_intent_id', 'charge_id', 'transaction_id',
                'metodo_pago', 'ultimos_digitos', 'metadata'
            ];

            const updates = [];
            const values = [];
            let paramCount = 1;

            for (const campo of camposPermitidos) {
                if (datos[campo] !== undefined) {
                    if (campo === 'metadata') {
                        updates.push(`metadata = COALESCE(metadata, '{}'::jsonb) || $${paramCount++}::jsonb`);
                        values.push(JSON.stringify(datos[campo]));
                    } else {
                        updates.push(`${campo} = $${paramCount++}`);
                        values.push(datos[campo]);
                    }
                }
            }

            if (updates.length === 0) {
                return pago;
            }

            values.push(id);

            const query = `
                UPDATE pagos_suscripcion
                SET ${updates.join(', ')}, actualizado_en = NOW()
                WHERE id = $${paramCount}
                RETURNING *
            `;

            const result = await db.query(query, values);

            logger.info(`Pago ${id} actualizado: ${Object.keys(datos).join(', ')}`);

            return result.rows[0];
        });
    }

    /**
     * Procesar reembolso
     *
     * @param {number} id - ID del pago
     * @param {number} montoReembolso - Monto a reembolsar
     * @param {string} razon - Razón del reembolso
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object>} - Pago actualizado
     */
    static async procesarReembolso(id, montoReembolso, razon, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const pago = await this.buscarPorId(id, organizacionId);
            ErrorHelper.throwIfNotFound(pago, 'Pago');

            if (pago.estado !== 'completado') {
                ErrorHelper.throwValidation('Solo se pueden reembolsar pagos completados');
            }

            if (montoReembolso > pago.monto) {
                ErrorHelper.throwValidation('El monto de reembolso no puede ser mayor al monto del pago');
            }

            const query = `
                UPDATE pagos_suscripcion
                SET estado = 'reembolsado',
                    reembolsado = TRUE,
                    fecha_reembolso = NOW(),
                    monto_reembolsado = $1,
                    razon_reembolso = $2
                WHERE id = $3
                RETURNING *
            `;

            const result = await db.query(query, [montoReembolso, razon, id]);

            // Actualizar total_pagado en suscripción
            await db.query(
                `UPDATE suscripciones_org
                 SET total_pagado = total_pagado - $1
                 WHERE id = $2`,
                [montoReembolso, pago.suscripcion_id]
            );

            logger.info(`Reembolso procesado: Pago ${id} - Monto: ${montoReembolso}`);

            return result.rows[0];
        });
    }

    /**
     * Buscar pago por transaction_id del gateway
     *
     * @param {string} gateway - Nombre del gateway
     * @param {string} transactionId - ID de transacción
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object|null>} - Pago encontrado o null
     */
    static async buscarPorTransactionId(gateway, transactionId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT * FROM pagos_suscripcion
                WHERE gateway = $1 AND transaction_id = $2
            `;

            const result = await db.query(query, [gateway, transactionId]);
            return result.rows[0] || null;
        });
    }

    /**
     * Obtener resumen de pagos (para dashboard)
     *
     * @param {Object} options - Opciones de filtrado
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object>} - Resumen de pagos
     */
    static async obtenerResumen(options = {}, organizacionId) {
        const { mes_actual = true } = options;

        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereClause = '';

            if (mes_actual) {
                whereClause = `WHERE DATE_TRUNC('month', fecha_pago) = DATE_TRUNC('month', CURRENT_DATE)`;
            }

            const query = `
                SELECT
                    COUNT(*) as total_pagos,
                    COUNT(*) FILTER (WHERE estado = 'completado') as pagos_exitosos,
                    COUNT(*) FILTER (WHERE estado = 'fallido') as pagos_fallidos,
                    SUM(monto) FILTER (WHERE estado = 'completado') as monto_total,
                    SUM(monto_reembolsado) as total_reembolsado
                FROM pagos_suscripcion
                ${whereClause}
            `;

            const result = await db.query(query);
            return result.rows[0];
        });
    }
}

module.exports = PagosModel;
