/**
 * ====================================================================
 * CRON JOB: AJUSTAR MONTO DE PREAPPROVAL
 * ====================================================================
 * Actualiza el transaction_amount en MercadoPago para suscripciones
 * con usuarios adicionales antes del próximo cobro automático.
 *
 * Se ejecuta el día 28 de cada mes a las 20:00 (antes del cobro de MP).
 *
 * @module jobs/ajustar-preapproval
 * @version 1.0.0
 * @date Enero 2026
 */

const cron = require('node-cron');
const RLSContextManager = require('../../../utils/rlsContextManager');
const MercadoPagoService = require('../../../services/mercadopago.service');
const UsageTrackingService = require('../services/usage-tracking.service');
const logger = require('../../../utils/logger');

class AjustarPreapprovalJob {

    /**
     * Iniciar cron job
     * Se ejecuta el día 28 de cada mes a las 20:00
     */
    static init() {
        cron.schedule('0 20 28 * *', async () => {
            await this.ejecutar();
        }, {
            scheduled: true,
            timezone: "America/Mexico_City"
        });

        logger.info('✅ Cron job "ajustar-preapproval" inicializado (día 28, 20:00)');
    }

    /**
     * Ejecutar ajuste de preapprovals
     */
    static async ejecutar() {
        const horaInicio = new Date();
        logger.info('═══════════════════════════════════════════════');
        logger.info('🔄 Iniciando ajuste de preapprovals MercadoPago');
        logger.info('═══════════════════════════════════════════════');

        try {
            const suscripciones = await this._obtenerSuscripcionesParaAjustar();

            logger.info(`📋 Suscripciones a evaluar: ${suscripciones.length}`);

            if (suscripciones.length === 0) {
                logger.info('✅ No hay suscripciones que ajustar');
                return;
            }

            const resumen = {
                total: suscripciones.length,
                ajustadas: 0,
                sinCambio: 0,
                errores: 0
            };

            for (const suscripcion of suscripciones) {
                try {
                    const resultado = await this._procesarSuscripcion(suscripcion);

                    if (resultado.ajustado) {
                        resumen.ajustadas++;
                        logger.info(`✅ Ajustado: Suscripción ${suscripcion.id} → $${resultado.nuevoMonto}`);
                    } else {
                        resumen.sinCambio++;
                    }

                } catch (error) {
                    resumen.errores++;
                    logger.error(`❌ Error en suscripción ${suscripcion.id}`, {
                        error: error.message
                    });
                }

                // Delay entre llamadas para no saturar la API de MP
                await this._delay(1000);
            }

            const duracion = Math.round((new Date() - horaInicio) / 1000);
            logger.info('═══════════════════════════════════════════════');
            logger.info('📊 RESUMEN DE AJUSTE DE PREAPPROVALS');
            logger.info(`✅ Ajustados: ${resumen.ajustadas}`);
            logger.info(`⏭️ Sin cambio: ${resumen.sinCambio}`);
            logger.info(`❌ Errores: ${resumen.errores}`);
            logger.info(`⏱️  Duración: ${duracion} segundos`);
            logger.info('═══════════════════════════════════════════════\n');

        } catch (error) {
            logger.error('❌ Error crítico en ajuste de preapprovals', {
                error: error.message,
                stack: error.stack
            });
        }
    }

    /**
     * Obtener suscripciones MercadoPago que necesitan evaluación
     */
    static async _obtenerSuscripcionesParaAjustar() {
        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                SELECT
                    s.id,
                    s.subscription_id_gateway,
                    s.organizacion_id,
                    s.precio_actual,
                    s.usuarios_max_periodo,
                    s.moneda,
                    s.fecha_proximo_cobro,
                    p.id as plan_id,
                    p.nombre as plan_nombre,
                    p.precio_mensual,
                    p.usuarios_incluidos,
                    p.precio_usuario_adicional,
                    c.organizacion_vinculada_id
                FROM suscripciones_org s
                INNER JOIN planes_suscripcion_org p ON s.plan_id = p.id
                LEFT JOIN clientes c ON s.cliente_id = c.id
                WHERE s.estado = 'activa'
                  AND s.gateway = 'mercadopago'
                  AND s.subscription_id_gateway IS NOT NULL
                  AND p.precio_usuario_adicional IS NOT NULL
                  AND p.precio_usuario_adicional > 0
                  AND p.organizacion_id = 1
                ORDER BY s.fecha_proximo_cobro ASC
            `;

            const result = await db.query(query);
            return result.rows;
        });
    }

    /**
     * Procesar una suscripción individual
     */
    static async _procesarSuscripcion(suscripcion) {
        const {
            id: suscripcionId,
            subscription_id_gateway: preapprovalId,
            organizacion_id: organizacionId,
            usuarios_max_periodo: usuariosMax,
            moneda,
            plan_nombre: planNombre,
            precio_mensual: precioMensual,
            usuarios_incluidos: usuariosIncluidos,
            precio_usuario_adicional: precioUsuarioExtra
        } = suscripcion;

        // Calcular monto total con usuarios extra
        const usuariosExtra = Math.max(0, (usuariosMax || 0) - usuariosIncluidos);
        const montoUsuariosExtra = usuariosExtra * precioUsuarioExtra;
        const nuevoMonto = parseFloat(precioMensual) + montoUsuariosExtra;

        logger.debug(`Evaluando suscripción ${suscripcionId}:`, {
            planNombre,
            precioBase: precioMensual,
            usuariosIncluidos,
            usuariosMax,
            usuariosExtra,
            nuevoMonto
        });

        // Obtener monto actual en MercadoPago
        const mpService = await MercadoPagoService.getForOrganization(1);

        let mpSuscripcion;
        try {
            mpSuscripcion = await mpService.obtenerSuscripcion(preapprovalId);
        } catch (error) {
            logger.warn(`No se pudo obtener preapproval ${preapprovalId}`);
            return { ajustado: false, error: error.message };
        }

        const montoActualMP = mpSuscripcion.auto_recurring?.transaction_amount || 0;

        // Si el monto es igual, no hay que actualizar
        if (Math.abs(montoActualMP - nuevoMonto) < 0.01) {
            return {
                ajustado: false,
                razon: 'Monto ya es correcto',
                montoActual: montoActualMP,
                nuevoMonto
            };
        }

        // Actualizar el preapproval en MercadoPago
        await mpService.actualizarMontoPreapproval(
            preapprovalId,
            nuevoMonto,
            moneda || 'MXN'
        );

        // Registrar el ajuste en la BD
        if (usuariosExtra > 0) {
            await UsageTrackingService.registrarAjusteUsuarios({
                organizacionId,
                suscripcionId,
                monto: montoUsuariosExtra,
                usuariosBase: usuariosIncluidos,
                usuariosFacturados: usuariosMax,
                precioUnitario: precioUsuarioExtra
            });
        }

        return {
            ajustado: true,
            montoAnterior: montoActualMP,
            nuevoMonto,
            usuariosExtra,
            montoUsuariosExtra
        };
    }

    /**
     * Delay helper para evitar rate limiting
     * @param {number} ms - Milisegundos a esperar
     */
    static _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = AjustarPreapprovalJob;
