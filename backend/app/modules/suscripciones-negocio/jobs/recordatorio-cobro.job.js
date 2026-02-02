/**
 * ====================================================================
 * CRON JOB: RECORDATORIO DE COBRO
 * ====================================================================
 * Envía recordatorios de próximo cobro a suscriptores.
 * Se ejecuta todos los días a las 10:00 AM.
 *
 * Busca suscripciones con fecha_proximo_cobro en 3 días y envía
 * un email recordatorio usando NotificacionesService.
 *
 * @module jobs/recordatorio-cobro
 */

const cron = require('node-cron');
const NotificacionesService = require('../services/notificaciones.service');
const logger = require('../../../utils/logger');
const RLSContextManager = require('../../../utils/rlsContextManager');

class RecordatorioCobroJob {

    /**
     * Días de anticipación para enviar recordatorio
     * @constant {number}
     */
    static DIAS_ANTICIPACION = 3;

    /**
     * Iniciar cron job
     */
    static init() {
        // Ejecutar todos los días a las 10:00 AM (zona horaria del servidor)
        cron.schedule('0 10 * * *', async () => {
            await this.ejecutar();
        }, {
            scheduled: true,
            timezone: "America/Mexico_City"
        });

        logger.info('Cron job "recordatorio-cobro" inicializado (10:00 AM diario)');
    }

    /**
     * Ejecutar envío de recordatorios de cobro
     */
    static async ejecutar() {
        const horaInicio = new Date();
        logger.info('===============================================');
        logger.info('Iniciando envío de recordatorios de cobro');
        logger.info('===============================================');

        try {
            // Calcular fecha objetivo (hoy + 3 días)
            const fechaObjetivo = this._calcularFechaObjetivo();

            logger.info(`Buscando suscripciones con cobro el: ${fechaObjetivo}`);

            // Obtener suscripciones con cobro en 3 días
            const suscripciones = await this._obtenerSuscripcionesParaRecordar(fechaObjetivo);

            logger.info(`Total de suscripciones a notificar: ${suscripciones.length}`);

            if (suscripciones.length === 0) {
                logger.info('No hay recordatorios pendientes para enviar');
                return;
            }

            // Contadores para resumen
            const resumen = {
                total: suscripciones.length,
                enviados: 0,
                sin_email: 0,
                errores: 0
            };

            // Procesar cada suscripción
            for (const suscripcion of suscripciones) {
                try {
                    // Verificar que tenga email
                    const email = suscripcion.cliente_email || suscripcion.suscriptor_externo?.email;

                    if (!email) {
                        resumen.sin_email++;
                        logger.warn(`Suscripción ${suscripcion.id} sin email disponible`);
                        continue;
                    }

                    logger.info(`Enviando recordatorio: Suscripción ${suscripcion.id} (${email})`);

                    // Enviar recordatorio
                    const resultado = await NotificacionesService.enviarRecordatorioCobro(
                        suscripcion,
                        this.DIAS_ANTICIPACION
                    );

                    if (resultado.success !== false) {
                        resumen.enviados++;
                        logger.info(`Recordatorio enviado: Suscripción ${suscripcion.id}`);
                    } else {
                        resumen.errores++;
                        logger.warn(`Fallo al enviar recordatorio: Suscripción ${suscripcion.id} - ${resultado.reason || resultado.error}`);
                    }

                } catch (error) {
                    resumen.errores++;
                    logger.error(`Error procesando suscripción ${suscripcion.id}`, {
                        error: error.message,
                        stack: error.stack
                    });
                }

                // Pequeño delay para no saturar el servicio de email
                await this._delay(200);
            }

            // Resumen final
            const horaFin = new Date();
            const duracion = Math.round((horaFin - horaInicio) / 1000);

            logger.info('===============================================');
            logger.info('RESUMEN DE RECORDATORIOS DE COBRO');
            logger.info('===============================================');
            logger.info(`Enviados: ${resumen.enviados}`);
            logger.info(`Sin email: ${resumen.sin_email}`);
            logger.info(`Errores: ${resumen.errores}`);
            logger.info(`Duracion: ${duracion} segundos`);
            logger.info('===============================================');

        } catch (error) {
            logger.error('Error critico en envío de recordatorios', {
                error: error.message,
                stack: error.stack
            });
        }
    }

    /**
     * Calcular fecha objetivo (hoy + días de anticipación)
     * @private
     * @returns {string} Fecha en formato YYYY-MM-DD
     */
    static _calcularFechaObjetivo() {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() + this.DIAS_ANTICIPACION);
        return fecha.toISOString().split('T')[0];
    }

    /**
     * Obtener suscripciones con cobro en la fecha especificada
     *
     * @param {string} fecha - Fecha en formato YYYY-MM-DD
     * @returns {Promise<Array>} - Lista de suscripciones
     */
    static async _obtenerSuscripcionesParaRecordar(fecha) {
        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                SELECT
                    s.id,
                    s.organizacion_id,
                    s.plan_id,
                    s.cliente_id,
                    s.suscriptor_externo,
                    s.periodo,
                    s.estado,
                    s.fecha_proximo_cobro,
                    s.precio_actual,
                    s.moneda,
                    p.nombre as plan_nombre,
                    p.codigo as plan_codigo,
                    c.nombre as cliente_nombre,
                    c.email as cliente_email
                FROM suscripciones_org s
                INNER JOIN planes_suscripcion_org p ON s.plan_id = p.id
                LEFT JOIN clientes c ON s.cliente_id = c.id
                WHERE s.fecha_proximo_cobro = $1
                  AND s.estado = 'activa'
                  AND s.auto_cobro = TRUE
                  AND s.notificaciones_activas = TRUE
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

module.exports = RecordatorioCobroJob;
