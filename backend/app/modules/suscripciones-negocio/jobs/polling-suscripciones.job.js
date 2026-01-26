/**
 * ====================================================================
 * CRON JOB: POLLING DE SUSCRIPCIONES PENDIENTES
 * ====================================================================
 * Fallback para cuando los webhooks de MercadoPago no llegan.
 * Verifica el estado de suscripciones pendiente_pago y las activa
 * si el pago fue autorizado en MercadoPago.
 *
 * Se ejecuta cada 5 minutos.
 *
 * @module jobs/polling-suscripciones
 */

const cron = require('node-cron');
const SuscripcionesModel = require('../models/suscripciones.model');
const MercadoPagoService = require('../../../services/mercadopago.service');
const logger = require('../../../utils/logger');
const { NEXO_TEAM_ORG_ID } = require('../../../config/constants');

class PollingSuscripcionesJob {

    /**
     * Iniciar cron job
     */
    static init() {
        // Ejecutar cada 5 minutos
        cron.schedule('*/5 * * * *', async () => {
            await this.ejecutar();
        }, {
            scheduled: true,
            timezone: "America/Mexico_City"
        });

        logger.info('✅ Cron job "polling-suscripciones" inicializado (cada 5 min)');
    }

    /**
     * Ejecutar verificación de suscripciones pendientes
     */
    static async ejecutar() {
        try {
            // Buscar suscripciones en pendiente_pago con subscription_id_gateway
            // NOTA: El método usa withBypass para ver todas las suscripciones de todas las orgs
            const pendientes = await SuscripcionesModel.buscarPendientesConGateway();

            if (pendientes.length === 0) {
                logger.debug('[Polling] No hay suscripciones pendientes para verificar');
                return;
            }

            logger.info(`[Polling] Verificando ${pendientes.length} suscripciones pendientes`);

            let mpService;
            try {
                mpService = await MercadoPagoService.getForOrganization(NEXO_TEAM_ORG_ID);
            } catch (error) {
                logger.error('[Polling] No se pudo obtener servicio MercadoPago', {
                    error: error.message
                });
                return;
            }

            // Contadores para resumen
            const resumen = {
                verificadas: 0,
                activadas: 0,
                canceladas: 0,
                pendientes: 0,
                errores: 0
            };

            for (const sus of pendientes) {
                try {
                    resumen.verificadas++;

                    // Consultar estado en MercadoPago
                    const mpSuscripcion = await mpService.obtenerSuscripcion(sus.subscription_id_gateway);

                    logger.debug(`[Polling] Suscripción ${sus.id} estado en MP: ${mpSuscripcion.status}`);

                    if (mpSuscripcion.status === 'authorized') {
                        // El usuario ya autorizó el pago, activar suscripción
                        // NOTA: Usamos métodos Bypass porque los planes (Nexo Team org 1)
                        // y las suscripciones (cliente org N) están en orgs diferentes
                        await SuscripcionesModel.cambiarEstadoBypass(
                            sus.id,
                            'activa',
                            { razon: 'Autorizada vía polling (webhook fallback)' }
                        );

                        // Procesar cobro exitoso (actualiza fecha próximo cobro, etc.)
                        // Pasamos los datos de la suscripción para evitar query adicional
                        await SuscripcionesModel.procesarCobroExitosoBypass(sus.id, sus);

                        // Cancelar suscripciones anteriores (trial, otras activas) para evitar duplicados
                        if (sus.cliente_id) {
                            const canceladas = await SuscripcionesModel.cancelarSuscripcionesAnterioresBypass(
                                sus.cliente_id,
                                sus.id,
                                `Upgrade a plan ${sus.plan_nombre || 'nuevo'}`
                            );
                            if (canceladas.length > 0) {
                                logger.info(`[Polling] Suscripciones anteriores canceladas: ${canceladas.join(', ')}`);
                            }
                        }

                        resumen.activadas++;
                        logger.info(`[Polling] ✅ Suscripción ${sus.id} activada (MP status: authorized)`);

                    } else if (mpSuscripcion.status === 'cancelled') {
                        await SuscripcionesModel.cambiarEstadoBypass(
                            sus.id,
                            'cancelada',
                            { razon: 'Cancelada en MercadoPago' }
                        );
                        resumen.canceladas++;
                        logger.info(`[Polling] ⚠️ Suscripción ${sus.id} cancelada en MP`);

                    } else {
                        // status 'pending' = aún no ha pagado, no hacer nada
                        resumen.pendientes++;
                    }

                    // Pequeño delay para no saturar la API de MP
                    await this._delay(200);

                } catch (error) {
                    resumen.errores++;
                    logger.error(`[Polling] Error verificando suscripción ${sus.id}`, {
                        error: error.message,
                        subscriptionIdGateway: sus.subscription_id_gateway
                    });
                }
            }

            // Log resumen solo si hubo actividad significativa
            if (resumen.activadas > 0 || resumen.canceladas > 0 || resumen.errores > 0) {
                logger.info('[Polling] Resumen:', {
                    verificadas: resumen.verificadas,
                    activadas: resumen.activadas,
                    canceladas: resumen.canceladas,
                    pendientes: resumen.pendientes,
                    errores: resumen.errores
                });
            }

        } catch (error) {
            logger.error('[Polling] Error en verificación de suscripciones', {
                error: error.message,
                stack: error.stack
            });
        }
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

module.exports = PollingSuscripcionesJob;
