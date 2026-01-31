/**
 * ====================================================================
 * JOB: MONITOREAR WEBHOOKS
 * ====================================================================
 * Monitorea el estado de procesamiento de webhooks y alerta si hay
 * demasiados errores.
 *
 * Ejecución: Cada hora (0 * * * *)
 *
 * Funcionalidad:
 * - Cuenta webhooks fallidos en la última hora
 * - Si hay más de 10 errores, loguea alerta crítica
 * - Registra métricas de webhooks procesados
 *
 * @module suscripciones-negocio/jobs/monitorear-webhooks
 * @version 1.0.0
 * @date Enero 2026
 */

const cron = require('node-cron');
const { WebhooksProcesadosModel } = require('../models');
const logger = require('../../../utils/logger');

// Configuración
const UMBRAL_ERRORES_HORA = 10;      // Alertar si hay más de 10 errores por hora
const UMBRAL_ERRORES_CRITICO = 25;   // Alerta crítica si hay más de 25

class MonitorearWebhooksJob {

    /**
     * Inicializar el cron job
     * Se ejecuta cada hora en el minuto 30
     */
    static init() {
        // Ejecutar cada hora en el minuto 30
        cron.schedule('30 * * * *', async () => {
            logger.info('[MonitorearWebhooksJob] Iniciando monitoreo de webhooks...');
            await this.ejecutar();
        });

        logger.info('[MonitorearWebhooksJob] Job programado: cada hora (minuto 30)');
    }

    /**
     * Ejecutar el monitoreo
     */
    static async ejecutar() {
        try {
            const ahora = new Date();
            const haceUnaHora = new Date(ahora.getTime() - 60 * 60 * 1000);

            // Obtener estadísticas de webhooks de la última hora
            const estadisticas = await this._obtenerEstadisticas(haceUnaHora, ahora);

            // Loguear resumen
            logger.info('[MonitorearWebhooksJob] Resumen de webhooks última hora', {
                periodo: {
                    desde: haceUnaHora.toISOString(),
                    hasta: ahora.toISOString()
                },
                ...estadisticas
            });

            // Verificar umbrales de alerta
            await this._verificarAlertas(estadisticas);

        } catch (error) {
            logger.error('[MonitorearWebhooksJob] Error en monitoreo', {
                error: error.message,
                stack: error.stack
            });
        }
    }

    /**
     * Obtener estadísticas de webhooks
     * @private
     */
    static async _obtenerEstadisticas(desde, hasta) {
        const RLSContextManager = require('../../../utils/rlsContextManager');

        return await RLSContextManager.withBypass(async (db) => {
            // Contar webhooks por resultado
            const queryPorResultado = `
                SELECT
                    resultado,
                    COUNT(*) as total
                FROM webhooks_procesados_org
                WHERE procesado_en >= $1 AND procesado_en < $2
                GROUP BY resultado
            `;

            const resultadoPorResultado = await db.query(queryPorResultado, [desde, hasta]);

            // Contar por tipo de evento
            const queryPorEvento = `
                SELECT
                    tipo_evento,
                    resultado,
                    COUNT(*) as total
                FROM webhooks_procesados_org
                WHERE procesado_en >= $1 AND procesado_en < $2
                GROUP BY tipo_evento, resultado
                ORDER BY total DESC
                LIMIT 20
            `;

            const resultadoPorEvento = await db.query(queryPorEvento, [desde, hasta]);

            // Contar por organización con más errores
            const queryPorOrg = `
                SELECT
                    organizacion_id,
                    resultado,
                    COUNT(*) as total
                FROM webhooks_procesados_org
                WHERE procesado_en >= $1 AND procesado_en < $2
                  AND resultado IN ('error', 'fallo')
                GROUP BY organizacion_id, resultado
                ORDER BY total DESC
                LIMIT 10
            `;

            const resultadoPorOrg = await db.query(queryPorOrg, [desde, hasta]);

            // Procesar resultados
            const porResultado = {};
            resultadoPorResultado.rows.forEach(row => {
                porResultado[row.resultado] = parseInt(row.total);
            });

            const totalProcesados = Object.values(porResultado).reduce((a, b) => a + b, 0);
            const totalErrores = (porResultado.error || 0) + (porResultado.fallo || 0);
            const totalExitosos = porResultado.procesado || 0;

            return {
                totalProcesados,
                totalExitosos,
                totalErrores,
                totalDuplicados: porResultado.duplicado || 0,
                totalIgnorados: porResultado.ignorado || 0,
                porResultado,
                porEvento: resultadoPorEvento.rows,
                organizacionesConErrores: resultadoPorOrg.rows,
                tasaExito: totalProcesados > 0
                    ? ((totalExitosos / totalProcesados) * 100).toFixed(2)
                    : 100
            };
        });
    }

    /**
     * Verificar umbrales y emitir alertas
     * @private
     */
    static async _verificarAlertas(estadisticas) {
        const { totalErrores, organizacionesConErrores, tasaExito } = estadisticas;

        // Alerta crítica
        if (totalErrores >= UMBRAL_ERRORES_CRITICO) {
            logger.error('🚨 [ALERTA CRÍTICA] Demasiados webhooks fallidos', {
                totalErrores,
                umbral: UMBRAL_ERRORES_CRITICO,
                tasaExito: `${tasaExito}%`,
                organizacionesAfectadas: organizacionesConErrores.length,
                mensaje: `Se detectaron ${totalErrores} errores de webhooks en la última hora. ` +
                         `Esto supera el umbral crítico de ${UMBRAL_ERRORES_CRITICO}. ` +
                         `Verificar conectividad con MercadoPago y estado del sistema.`
            });

            // TODO: Aquí se podría enviar notificación a admin
            // await NotificacionesService.enviarAlertaAdmin({
            //     tipo: 'webhook_error_critico',
            //     mensaje: `${totalErrores} webhooks fallidos en la última hora`,
            //     detalles: estadisticas
            // });

            return;
        }

        // Alerta warning
        if (totalErrores >= UMBRAL_ERRORES_HORA) {
            logger.warn('⚠️  [ALERTA] Alto número de webhooks fallidos', {
                totalErrores,
                umbral: UMBRAL_ERRORES_HORA,
                tasaExito: `${tasaExito}%`,
                organizacionesAfectadas: organizacionesConErrores.length,
                mensaje: `Se detectaron ${totalErrores} errores de webhooks en la última hora. ` +
                         `Monitorear la situación.`
            });

            return;
        }

        // Si la tasa de éxito es baja pero no hay muchos errores absolutos
        if (parseFloat(tasaExito) < 90 && estadisticas.totalProcesados > 10) {
            logger.warn('⚠️  [ALERTA] Baja tasa de éxito en webhooks', {
                tasaExito: `${tasaExito}%`,
                totalProcesados: estadisticas.totalProcesados,
                totalErrores,
                mensaje: `Tasa de éxito del ${tasaExito}% está por debajo del 90%.`
            });
        }

        // Todo bien
        if (totalErrores === 0) {
            logger.debug('[MonitorearWebhooksJob] Sin errores en la última hora');
        }
    }

    /**
     * Ejecutar manualmente (para testing)
     */
    static async ejecutarManual() {
        logger.info('[MonitorearWebhooksJob] Ejecutando manualmente...');
        await this.ejecutar();
    }
}

module.exports = MonitorearWebhooksJob;
