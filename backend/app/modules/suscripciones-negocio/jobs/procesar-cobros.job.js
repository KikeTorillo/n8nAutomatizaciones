/**
 * ====================================================================
 * CRON JOB: PROCESAR COBROS AUTOMÁTICOS
 * ====================================================================
 * Ejecuta el procesamiento de cobros automáticos diarios.
 * Se ejecuta todos los días a las 6:00 AM.
 *
 * @module jobs/procesar-cobros
 */

const cron = require('node-cron');
const { SuscripcionesModel } = require('../models');
const CobroService = require('../services/cobro.service');
const logger = require('../../../utils/logger');
const RLSContextManager = require('../../../utils/rlsContextManager');

class ProcesarCobrosJob {

    /**
     * Iniciar cron job
     */
    static init() {
        // Ejecutar todos los días a las 6:00 AM (zona horaria del servidor)
        cron.schedule('0 6 * * *', async () => {
            await this.ejecutar();
        }, {
            scheduled: true,
            timezone: "America/Mexico_City"
        });

        logger.info('✅ Cron job "procesar-cobros" inicializado (6:00 AM diario)');
    }

    /**
     * Ejecutar procesamiento de cobros del día
     */
    static async ejecutar() {
        const horaInicio = new Date();
        logger.info('═══════════════════════════════════════════════');
        logger.info('🔄 Iniciando procesamiento de cobros automáticos');
        logger.info('═══════════════════════════════════════════════');

        try {
            // Obtener fecha de hoy en formato YYYY-MM-DD
            const hoy = new Date().toISOString().split('T')[0];

            // Obtener todas las suscripciones que deben cobrarse hoy
            const suscripciones = await this._obtenerSuscripcionesParaCobrar(hoy);

            logger.info(`📋 Total de suscripciones a procesar: ${suscripciones.length}`);

            if (suscripciones.length === 0) {
                logger.info('✅ No hay cobros pendientes para hoy');
                return;
            }

            // Contadores para resumen
            const resumen = {
                total: suscripciones.length,
                exitosos: 0,
                fallidos: 0,
                errores: 0
            };

            // Procesar cada suscripción
            for (const suscripcion of suscripciones) {
                try {
                    logger.info(`\n💳 Procesando cobro: Suscripción ${suscripcion.id} (Org ${suscripcion.organizacion_id})`);

                    const resultado = await CobroService.procesarCobro(suscripcion);

                    if (resultado.exitoso) {
                        resumen.exitosos++;
                        logger.info(`✅ Cobro exitoso: Suscripción ${suscripcion.id}`);
                    } else {
                        resumen.fallidos++;
                        logger.warn(`⚠️  Cobro fallido: Suscripción ${suscripcion.id} - ${resultado.error}`);
                    }

                } catch (error) {
                    resumen.errores++;
                    logger.error(`❌ Error procesando suscripción ${suscripcion.id}`, {
                        error: error.message,
                        stack: error.stack
                    });
                }

                // Pequeño delay para no saturar APIs externas
                await this._delay(500);
            }

            // Resumen final
            const horaFin = new Date();
            const duracion = Math.round((horaFin - horaInicio) / 1000);

            logger.info('\n═══════════════════════════════════════════════');
            logger.info('📊 RESUMEN DE PROCESAMIENTO DE COBROS');
            logger.info('═══════════════════════════════════════════════');
            logger.info(`✅ Exitosos: ${resumen.exitosos}`);
            logger.info(`⚠️  Fallidos: ${resumen.fallidos}`);
            logger.info(`❌ Errores: ${resumen.errores}`);
            logger.info(`⏱️  Duración: ${duracion} segundos`);
            logger.info('═══════════════════════════════════════════════\n');

        } catch (error) {
            logger.error('❌ Error crítico en procesamiento de cobros', {
                error: error.message,
                stack: error.stack
            });
        }
    }

    /**
     * Obtener suscripciones que deben cobrarse hoy
     *
     * @param {string} fecha - Fecha en formato YYYY-MM-DD
     * @returns {Promise<Array>} - Lista de suscripciones
     */
    static async _obtenerSuscripcionesParaCobrar(fecha) {
        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                SELECT
                    s.*,
                    p.nombre as plan_nombre,
                    p.moneda,
                    c.email as cliente_email,
                    c.nombre as cliente_nombre
                FROM suscripciones_org s
                INNER JOIN planes_suscripcion_org p ON s.plan_id = p.id
                LEFT JOIN clientes c ON s.cliente_id = c.id
                WHERE s.fecha_proximo_cobro = $1
                  AND s.estado = 'activa'
                  AND s.auto_cobro = TRUE
                ORDER BY s.organizacion_id, s.id
            `;

            const result = await db.query(query, [fecha]);
            return result.rows;
        });
    }

    /**
     * Delay helper
     *
     * @param {number} ms - Milisegundos
     * @returns {Promise<void>}
     */
    static _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = ProcesarCobrosJob;
