/**
 * ====================================================================
 * CRON JOB: REGISTRAR USO DIARIO DE USUARIOS
 * ====================================================================
 * Registra el conteo diario de usuarios activos por organización
 * para el sistema de facturación por usuarios (seat-based billing).
 *
 * Se ejecuta diariamente a las 23:55 para capturar el estado final del día.
 *
 * @module jobs/registrar-uso-usuarios
 * @version 1.0.0
 * @date Enero 2026
 */

const cron = require('node-cron');
const RLSContextManager = require('../../../utils/rlsContextManager');
const UsageTrackingService = require('../services/usage-tracking.service');
const logger = require('../../../utils/logger');

class RegistrarUsoUsuariosJob {

    /**
     * Iniciar cron job
     */
    static init() {
        // Ejecutar todos los días a las 23:55 (zona horaria del servidor)
        cron.schedule('55 23 * * *', async () => {
            await this.ejecutar();
        }, {
            scheduled: true,
            timezone: "America/Mexico_City"
        });

        logger.info('✅ Cron job "registrar-uso-usuarios" inicializado (23:55 diario)');
    }

    /**
     * Ejecutar registro de uso de usuarios
     */
    static async ejecutar() {
        const horaInicio = new Date();
        logger.info('═══════════════════════════════════════════════');
        logger.info('📊 Iniciando registro de uso diario de usuarios');
        logger.info('═══════════════════════════════════════════════');

        try {
            // Obtener todas las suscripciones activas que requieren tracking
            const suscripciones = await this._obtenerSuscripcionesActivas();

            logger.info(`📋 Total de suscripciones a procesar: ${suscripciones.length}`);

            if (suscripciones.length === 0) {
                logger.info('✅ No hay suscripciones activas para registrar');
                return;
            }

            // Contadores para resumen
            const resumen = {
                total: suscripciones.length,
                procesadas: 0,
                omitidas: 0,
                errores: 0
            };

            // Procesar cada suscripción
            for (const suscripcion of suscripciones) {
                try {
                    const resultado = await UsageTrackingService.registrarUsoDiario(suscripcion.id);

                    if (resultado) {
                        resumen.procesadas++;
                        logger.debug(`✅ Uso registrado: Suscripción ${suscripcion.id}, ${resultado.usuarios_activos} usuarios`);
                    } else {
                        resumen.omitidas++;
                    }

                } catch (error) {
                    resumen.errores++;
                    logger.error(`❌ Error registrando uso para suscripción ${suscripcion.id}`, {
                        error: error.message
                    });
                }
            }

            // Resumen final
            const horaFin = new Date();
            const duracion = Math.round((horaFin - horaInicio) / 1000);

            logger.info('\n═══════════════════════════════════════════════');
            logger.info('📊 RESUMEN DE REGISTRO DE USO DE USUARIOS');
            logger.info('═══════════════════════════════════════════════');
            logger.info(`✅ Procesadas: ${resumen.procesadas}`);
            logger.info(`⏭️  Omitidas: ${resumen.omitidas}`);
            logger.info(`❌ Errores: ${resumen.errores}`);
            logger.info(`⏱️  Duración: ${duracion} segundos`);
            logger.info('═══════════════════════════════════════════════\n');

        } catch (error) {
            logger.error('❌ Error crítico en registro de uso de usuarios', {
                error: error.message,
                stack: error.stack
            });
        }
    }

    /**
     * Obtener suscripciones activas que requieren tracking de usuarios
     * Solo suscripciones de Nexo Team (platform billing) con seat-based pricing
     *
     * @returns {Promise<Array>} - Lista de suscripciones
     */
    static async _obtenerSuscripcionesActivas() {
        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                SELECT
                    s.id, s.organizacion_id, s.estado,
                    s.usuarios_max_periodo,
                    p.usuarios_incluidos, p.precio_usuario_adicional
                FROM suscripciones_org s
                INNER JOIN planes_suscripcion_org p ON s.plan_id = p.id
                WHERE s.estado IN ('activa', 'trial', 'grace_period')
                  AND p.organizacion_id = 1  -- Solo planes de Nexo Team (platform billing)
                ORDER BY s.organizacion_id, s.id
            `;

            const result = await db.query(query);
            return result.rows;
        });
    }
}

module.exports = RegistrarUsoUsuariosJob;
