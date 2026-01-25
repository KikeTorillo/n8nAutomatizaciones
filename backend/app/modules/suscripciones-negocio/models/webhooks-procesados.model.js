/**
 * ====================================================================
 * MODEL: WEBHOOKS PROCESADOS
 * ====================================================================
 * Gestión de idempotencia para webhooks de pasarelas de pago.
 * Previene procesamiento duplicado de eventos por reintentos.
 *
 * @module models/webhooks-procesados
 */

const RLSContextManager = require('../../../utils/RLSContextManager');
const logger = require('../../../utils/logger');

class WebhooksProcesadosModel {

    /**
     * Verifica si un webhook ya fue procesado
     *
     * @param {string} gateway - Gateway de pago ('mercadopago', 'stripe')
     * @param {string} requestId - ID único del request (x-request-id header)
     * @returns {Promise<boolean>} true si ya fue procesado
     */
    static async yaFueProcesado(gateway, requestId) {
        if (!requestId) return false;

        return await RLSContextManager.withBypass(async (db) => {
            const result = await db.query(
                `SELECT 1 FROM webhooks_procesados
                 WHERE gateway = $1 AND request_id = $2`,
                [gateway, requestId]
            );
            return result.rows.length > 0;
        });
    }

    /**
     * Registra un webhook como procesado (idempotencia)
     * Usa ON CONFLICT DO NOTHING para manejar race conditions
     *
     * @param {Object} params - Parámetros del webhook
     * @param {string} params.gateway - Gateway de pago
     * @param {string} params.requestId - ID único del request
     * @param {string} params.eventType - Tipo de evento
     * @param {string} [params.dataId] - ID del recurso (pago, suscripción)
     * @param {number} [params.organizacionId] - ID de la organización
     * @param {string} params.resultado - 'success', 'error', 'skipped'
     * @param {string} [params.mensaje] - Mensaje adicional
     * @param {string} [params.ipOrigen] - IP del request
     * @returns {Promise<Object|null>} Registro creado o null si ya existía
     */
    static async registrar({
        gateway,
        requestId,
        eventType,
        dataId = null,
        organizacionId = null,
        resultado,
        mensaje = null,
        ipOrigen = null
    }) {
        if (!requestId) {
            logger.warn('Webhook sin request_id, no se puede registrar para idempotencia');
            return null;
        }

        return await RLSContextManager.withBypass(async (db) => {
            const result = await db.query(
                `INSERT INTO webhooks_procesados
                 (gateway, request_id, event_type, data_id, organizacion_id, resultado, mensaje, ip_origen)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8::inet)
                 ON CONFLICT (gateway, request_id) DO NOTHING
                 RETURNING *`,
                [gateway, requestId, eventType, dataId, organizacionId, resultado, mensaje, ipOrigen]
            );

            if (result.rows.length === 0) {
                // Ya existía (race condition manejada)
                logger.debug('Webhook ya registrado previamente', { gateway, requestId });
                return null;
            }

            return result.rows[0];
        });
    }

    /**
     * Obtiene información de un webhook procesado
     *
     * @param {string} gateway - Gateway de pago
     * @param {string} requestId - ID único del request
     * @returns {Promise<Object|null>} Registro del webhook o null
     */
    static async obtener(gateway, requestId) {
        return await RLSContextManager.withBypass(async (db) => {
            const result = await db.query(
                `SELECT * FROM webhooks_procesados
                 WHERE gateway = $1 AND request_id = $2`,
                [gateway, requestId]
            );
            return result.rows[0] || null;
        });
    }

    /**
     * Lista webhooks procesados con filtros
     *
     * @param {Object} filtros - Filtros opcionales
     * @param {string} [filtros.gateway] - Gateway específico
     * @param {string} [filtros.resultado] - Resultado específico
     * @param {number} [filtros.organizacionId] - Organización específica
     * @param {Date} [filtros.desde] - Fecha desde
     * @param {Date} [filtros.hasta] - Fecha hasta
     * @param {number} [filtros.limit=100] - Límite de resultados
     * @returns {Promise<Array>} Lista de webhooks
     */
    static async listar(filtros = {}) {
        const { gateway, resultado, organizacionId, desde, hasta, limit = 100 } = filtros;

        return await RLSContextManager.withBypass(async (db) => {
            let query = `SELECT * FROM webhooks_procesados WHERE 1=1`;
            const params = [];
            let paramIndex = 1;

            if (gateway) {
                query += ` AND gateway = $${paramIndex++}`;
                params.push(gateway);
            }

            if (resultado) {
                query += ` AND resultado = $${paramIndex++}`;
                params.push(resultado);
            }

            if (organizacionId) {
                query += ` AND organizacion_id = $${paramIndex++}`;
                params.push(organizacionId);
            }

            if (desde) {
                query += ` AND procesado_en >= $${paramIndex++}`;
                params.push(desde);
            }

            if (hasta) {
                query += ` AND procesado_en <= $${paramIndex++}`;
                params.push(hasta);
            }

            query += ` ORDER BY procesado_en DESC LIMIT $${paramIndex}`;
            params.push(limit);

            const result = await db.query(query, params);
            return result.rows;
        });
    }

    /**
     * Cuenta webhooks por resultado en un período
     *
     * @param {string} gateway - Gateway de pago
     * @param {Date} desde - Fecha desde
     * @returns {Promise<Object>} Conteo por resultado
     */
    static async contarPorResultado(gateway, desde) {
        return await RLSContextManager.withBypass(async (db) => {
            const result = await db.query(
                `SELECT resultado, COUNT(*) as total
                 FROM webhooks_procesados
                 WHERE gateway = $1 AND procesado_en >= $2
                 GROUP BY resultado`,
                [gateway, desde]
            );

            const conteo = { success: 0, error: 0, skipped: 0 };
            result.rows.forEach(row => {
                conteo[row.resultado] = parseInt(row.total);
            });

            return conteo;
        });
    }

    /**
     * Elimina webhooks antiguos (para mantenimiento)
     *
     * @param {number} diasAntiguedad - Días de antigüedad para eliminar
     * @returns {Promise<number>} Número de registros eliminados
     */
    static async limpiarAntiguos(diasAntiguedad = 30) {
        return await RLSContextManager.withBypass(async (db) => {
            const result = await db.query(
                `DELETE FROM webhooks_procesados
                 WHERE procesado_en < NOW() - INTERVAL '${diasAntiguedad} days'
                 RETURNING id`
            );

            const eliminados = result.rowCount;
            if (eliminados > 0) {
                logger.info('Webhooks antiguos eliminados', {
                    cantidad: eliminados,
                    diasAntiguedad
                });
            }

            return eliminados;
        });
    }
}

module.exports = WebhooksProcesadosModel;
