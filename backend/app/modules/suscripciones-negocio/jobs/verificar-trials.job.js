/**
 * ====================================================================
 * CRON JOB: VERIFICAR TRIALS EXPIRADOS
 * ====================================================================
 * Verifica y procesa suscripciones trial expiradas.
 * Se ejecuta todos los días a las 7:00 AM.
 *
 * @module jobs/verificar-trials
 */

const cron = require('node-cron');
const { SuscripcionesModel } = require('../models');
const NotificacionesService = require('../services/notificaciones.service');
const logger = require('../../../utils/logger');
const RLSContextManager = require('../../../utils/rlsContextManager');

class VerificarTrialsJob {

    /**
     * Iniciar cron job
     */
    static init() {
        // Ejecutar todos los días a las 7:00 AM
        cron.schedule('0 7 * * *', async () => {
            await this.ejecutar();
        }, {
            scheduled: true,
            timezone: "America/Mexico_City"
        });

        logger.info('✅ Cron job "verificar-trials" inicializado (7:00 AM diario)');
    }

    /**
     * Ejecutar verificación de trials expirados
     */
    static async ejecutar() {
        const horaInicio = new Date();
        logger.info('═══════════════════════════════════════════════');
        logger.info('🔍 Iniciando verificación de trials expirados');
        logger.info('═══════════════════════════════════════════════');

        try {
            const hoy = new Date().toISOString().split('T')[0];

            // Obtener trials expirados
            const trialsExpirados = await this._obtenerTrialsExpirados(hoy);

            logger.info(`📋 Total de trials expirados: ${trialsExpirados.length}`);

            if (trialsExpirados.length === 0) {
                logger.info('✅ No hay trials expirados');
                return;
            }

            // Contadores
            const resumen = {
                total: trialsExpirados.length,
                convertidos_activa: 0,
                marcados_vencida: 0,
                errores: 0
            };

            // Procesar cada trial
            for (const suscripcion of trialsExpirados) {
                try {
                    logger.info(`\n⏱️  Procesando trial: Suscripción ${suscripcion.id} (Org ${suscripcion.organizacion_id})`);

                    // Verificar si tiene método de pago configurado
                    const tieneMetodoPago = suscripcion.payment_method_id !== null;

                    if (tieneMetodoPago) {
                        // Convertir a activa
                        await SuscripcionesModel.cambiarEstado(
                            suscripcion.id,
                            'activa',
                            suscripcion.organizacion_id,
                            { razon: 'Trial expirado, convertido a suscripción activa' }
                        );

                        resumen.convertidos_activa++;
                        logger.info(`✅ Trial convertido a activa: Suscripción ${suscripcion.id}`);

                    } else {
                        // Marcar como vencida (no tiene método de pago)
                        await SuscripcionesModel.cambiarEstado(
                            suscripcion.id,
                            'vencida',
                            suscripcion.organizacion_id,
                            { razon: 'Trial expirado sin método de pago' }
                        );

                        // Enviar notificación de trial expirado sin método de pago
                        await NotificacionesService.enviarFinTrial(suscripcion);

                        resumen.marcados_vencida++;
                        logger.warn(`⚠️  Trial marcado como vencida (sin payment method): Suscripción ${suscripcion.id}`);
                    }

                } catch (error) {
                    resumen.errores++;
                    logger.error(`❌ Error procesando trial ${suscripcion.id}`, {
                        error: error.message,
                        stack: error.stack
                    });
                }
            }

            // Obtener trials próximos a expirar (3 días antes)
            const trialsProximosExpirar = await this._obtenerTrialsProximosExpirar(hoy, 3);

            logger.info(`\n📧 Enviando recordatorios: ${trialsProximosExpirar.length} trials próximos a expirar`);

            for (const suscripcion of trialsProximosExpirar) {
                try {
                    await NotificacionesService.enviarFinTrial(suscripcion);
                    logger.info(`📧 Recordatorio enviado: Suscripción ${suscripcion.id}`);
                } catch (error) {
                    logger.error(`Error enviando recordatorio: ${suscripcion.id}`, { error: error.message });
                }
            }

            // Resumen final
            const horaFin = new Date();
            const duracion = Math.round((horaFin - horaInicio) / 1000);

            logger.info('\n═══════════════════════════════════════════════');
            logger.info('📊 RESUMEN DE VERIFICACIÓN DE TRIALS');
            logger.info('═══════════════════════════════════════════════');
            logger.info(`✅ Convertidos a activa: ${resumen.convertidos_activa}`);
            logger.info(`⚠️  Marcados como vencida: ${resumen.marcados_vencida}`);
            logger.info(`❌ Errores: ${resumen.errores}`);
            logger.info(`📧 Recordatorios enviados: ${trialsProximosExpirar.length}`);
            logger.info(`⏱️  Duración: ${duracion} segundos`);
            logger.info('═══════════════════════════════════════════════\n');

        } catch (error) {
            logger.error('❌ Error crítico en verificación de trials', {
                error: error.message,
                stack: error.stack
            });
        }
    }

    /**
     * Obtener trials expirados hoy
     *
     * @param {string} fecha - Fecha en formato YYYY-MM-DD
     * @returns {Promise<Array>} - Lista de trials expirados
     */
    static async _obtenerTrialsExpirados(fecha) {
        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                SELECT
                    s.*,
                    p.nombre as plan_nombre,
                    c.email as cliente_email,
                    c.nombre as cliente_nombre
                FROM suscripciones_org s
                INNER JOIN planes_suscripcion_org p ON s.plan_id = p.id
                LEFT JOIN clientes c ON s.cliente_id = c.id
                WHERE s.es_trial = TRUE
                  AND s.estado = 'trial'
                  AND s.fecha_fin_trial <= $1
                ORDER BY s.organizacion_id, s.id
            `;

            const result = await db.query(query, [fecha]);
            return result.rows;
        });
    }

    /**
     * Obtener trials próximos a expirar (para enviar recordatorios)
     *
     * @param {string} fechaHoy - Fecha actual
     * @param {number} diasAntes - Días antes de la expiración
     * @returns {Promise<Array>} - Lista de trials
     */
    static async _obtenerTrialsProximosExpirar(fechaHoy, diasAntes) {
        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                SELECT
                    s.*,
                    p.nombre as plan_nombre,
                    c.email as cliente_email,
                    c.nombre as cliente_nombre
                FROM suscripciones_org s
                INNER JOIN planes_suscripcion_org p ON s.plan_id = p.id
                LEFT JOIN clientes c ON s.cliente_id = c.id
                WHERE s.es_trial = TRUE
                  AND s.estado = 'trial'
                  AND s.fecha_fin_trial = $1::date + INTERVAL '${diasAntes} days'
                ORDER BY s.organizacion_id, s.id
            `;

            const result = await db.query(query, [fechaHoy]);
            return result.rows;
        });
    }
}

module.exports = VerificarTrialsJob;
