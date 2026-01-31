/**
 * ====================================================================
 * SERVICE: COBROS AUTOMÁTICOS
 * ====================================================================
 * Lógica central de procesamiento de cobros automáticos de suscripciones.
 *
 * @module services/cobro
 */

const { SuscripcionesModel, PagosModel } = require('../models');
const StripeService = require('./stripe.service');
const MercadoPagoService = require('./mercadopago.service');
const NotificacionesService = require('./notificaciones.service');
const { ErrorHelper } = require('../../../utils/helpers');
const { retryWithBackoff, isRetriableError } = require('../../../utils/retryWithBackoff');
const logger = require('../../../utils/logger');

// Configuración de retry para cobros
const COBRO_RETRY_OPTIONS = {
    maxRetries: 3,
    baseDelay: 2000,       // 2 segundos inicial
    maxDelay: 30000,       // 30 segundos máximo
    factor: 2,             // Duplicar cada intento
    name: 'cobro',
    retryIf: isRetriableError
};

class CobroService {

    /**
     * Procesar cobro de una suscripción
     *
     * @param {Object} suscripcion - Suscripción a cobrar
     * @returns {Promise<Object>} - {exitoso: boolean, pago?: Object, error?: string}
     */
    static async procesarCobro(suscripcion) {
        try {
            logger.info(`Procesando cobro para suscripción ${suscripcion.id}`);

            // Validar que la suscripción esté activa y tenga auto_cobro
            if (!suscripcion.auto_cobro) {
                return {
                    exitoso: false,
                    error: 'Suscripción sin auto-cobro habilitado'
                };
            }

            if (suscripcion.estado !== 'activa') {
                return {
                    exitoso: false,
                    error: `Suscripción en estado ${suscripcion.estado}, no se puede cobrar`
                };
            }

            // Validar que tenga payment_method_id configurado
            if (!suscripcion.payment_method_id && suscripcion.gateway !== 'manual') {
                return {
                    exitoso: false,
                    error: 'No hay método de pago configurado'
                };
            }

            // Calcular monto a cobrar
            const monto = this._calcularMontoCobro(suscripcion);

            // Registrar pago pendiente
            const pagoData = {
                suscripcion_id: suscripcion.id,
                monto,
                moneda: suscripcion.moneda,
                estado: 'pendiente',
                gateway: suscripcion.gateway,
                fecha_inicio_periodo: this._calcularInicioPeriodo(suscripcion),
                fecha_fin_periodo: this._calcularFinPeriodo(suscripcion),
                metadata: {
                    plan_nombre: suscripcion.plan_nombre,
                    periodo: suscripcion.periodo
                }
            };

            const pago = await PagosModel.crear(pagoData, suscripcion.organizacion_id);

            // Procesar cobro según gateway
            let resultadoCobro;

            switch (suscripcion.gateway) {
                case 'stripe':
                    resultadoCobro = await this._procesarCobroStripe(suscripcion, pago, monto);
                    break;

                case 'mercadopago':
                    resultadoCobro = await this._procesarCobroMercadoPago(suscripcion, pago, monto);
                    break;

                case 'manual':
                    // Cobro manual: marcar como pendiente y enviar notificación
                    await NotificacionesService.enviarSolicitudPago(suscripcion, pago);
                    return {
                        exitoso: true,
                        pago,
                        mensaje: 'Notificación de pago enviada'
                    };

                default:
                    throw new Error(`Gateway no soportado: ${suscripcion.gateway}`);
            }

            if (resultadoCobro.exitoso) {
                // Actualizar pago a completado
                await PagosModel.actualizarEstado(pago.id, 'completado', suscripcion.organizacion_id);

                // Actualizar suscripción (fecha próximo cobro, meses activo)
                await SuscripcionesModel.procesarCobroExitoso(
                    suscripcion.id,
                    suscripcion.organizacion_id
                );

                // Enviar confirmación
                await NotificacionesService.enviarConfirmacionPago(suscripcion, pago);

                logger.info(`Cobro exitoso: Suscripción ${suscripcion.id}, Pago ${pago.id}`);

                return {
                    exitoso: true,
                    pago
                };
            } else {
                // Registrar fallo
                await PagosModel.actualizarEstado(pago.id, 'fallido', suscripcion.organizacion_id);
                await SuscripcionesModel.registrarFalloCobro(
                    suscripcion.id,
                    suscripcion.organizacion_id,
                    resultadoCobro.error
                );

                // Enviar notificación de fallo
                await NotificacionesService.enviarFalloPago(suscripcion, pago, resultadoCobro.error);

                logger.warn(`Cobro fallido: Suscripción ${suscripcion.id} - ${resultadoCobro.error}`);

                return {
                    exitoso: false,
                    error: resultadoCobro.error,
                    pago
                };
            }

        } catch (error) {
            logger.error('Error procesando cobro', {
                suscripcion_id: suscripcion.id,
                error: error.message
            });

            return {
                exitoso: false,
                error: error.message
            };
        }
    }

    /**
     * Reintentar cobro fallido
     *
     * @param {Object} suscripcion - Suscripción con cobro fallido
     * @returns {Promise<Object>} - Resultado del reintento
     */
    static async reintentarCobro(suscripcion) {
        logger.info(`Reintentando cobro: Suscripción ${suscripcion.id}`);

        // Validar que no haya excedido intentos máximos
        const MAX_REINTENTOS = 3;

        if (suscripcion.intentos_cobro >= MAX_REINTENTOS) {
            // Suspender suscripción
            await SuscripcionesModel.cambiarEstado(
                suscripcion.id,
                'suspendida',
                suscripcion.organizacion_id,
                { razon: `Máximo de ${MAX_REINTENTOS} intentos de cobro alcanzado` }
            );

            await NotificacionesService.enviarSuspensionPorFalloCobro(suscripcion);

            return {
                exitoso: false,
                error: 'Máximo de reintentos alcanzado, suscripción suspendida'
            };
        }

        // Procesar cobro normalmente
        return await this.procesarCobro(suscripcion);
    }

    /**
     * Procesar cobro con Stripe
     *
     * @param {Object} suscripcion - Suscripción
     * @param {Object} pago - Registro de pago
     * @param {number} monto - Monto a cobrar
     * @returns {Promise<Object>} - {exitoso, error?, transactionId?}
     */
    static async _procesarCobroStripe(suscripcion, pago, monto) {
        try {
            const paymentIntent = await StripeService.crearPaymentIntent({
                amount: Math.round(monto * 100), // Convertir a centavos
                currency: suscripcion.moneda.toLowerCase(),
                customer: suscripcion.customer_id_gateway,
                payment_method: suscripcion.payment_method_id,
                off_session: true,
                confirm: true,
                metadata: {
                    suscripcion_id: suscripcion.id,
                    pago_id: pago.id,
                    organizacion_id: suscripcion.organizacion_id
                }
            });

            if (paymentIntent.status === 'succeeded') {
                // Actualizar pago con datos de Stripe
                await PagosModel.actualizar(pago.id, {
                    payment_intent_id: paymentIntent.id,
                    charge_id: paymentIntent.latest_charge,
                    transaction_id: paymentIntent.id
                }, suscripcion.organizacion_id);

                return {
                    exitoso: true,
                    transactionId: paymentIntent.id
                };
            } else {
                return {
                    exitoso: false,
                    error: `Payment Intent estado: ${paymentIntent.status}`
                };
            }

        } catch (error) {
            logger.error('Error en cobro Stripe', { error: error.message });

            return {
                exitoso: false,
                error: error.message
            };
        }
    }

    /**
     * Procesar cobro con MercadoPago
     * Usa retry con backoff exponencial para manejar errores transitorios
     *
     * @param {Object} suscripcion - Suscripción
     * @param {Object} pago - Registro de pago
     * @param {number} monto - Monto a cobrar
     * @returns {Promise<Object>} - {exitoso, error?, transactionId?}
     */
    static async _procesarCobroMercadoPago(suscripcion, pago, monto) {
        try {
            // Usar retry con backoff exponencial
            const pagoMP = await retryWithBackoff(async () => {
                // Multi-tenant: pasar organizacionId para usar credenciales de la org
                return await MercadoPagoService.crearPago({
                    transaction_amount: monto,
                    token: suscripcion.payment_method_id, // Tarjeta tokenizada
                    description: `Suscripción ${suscripcion.plan_nombre} - ${suscripcion.periodo}`,
                    installments: 1,
                    payment_method_id: 'visa', // Esto debería venir de los datos del payment method
                    payer: {
                        email: suscripcion.cliente_email || suscripcion.suscriptor_externo?.email
                    },
                    metadata: {
                        suscripcion_id: suscripcion.id,
                        pago_id: pago.id,
                        organizacion_id: suscripcion.organizacion_id
                    }
                }, suscripcion.organizacion_id);
            }, {
                ...COBRO_RETRY_OPTIONS,
                name: `cobro-mp-${suscripcion.id}`,
                onRetry: (error, attempt, delay) => {
                    logger.warn(`[Cobro] Reintentando cobro MercadoPago`, {
                        suscripcionId: suscripcion.id,
                        pagoId: pago.id,
                        attempt,
                        delayMs: Math.round(delay),
                        error: error.message
                    });
                }
            });

            if (pagoMP.status === 'approved') {
                // Actualizar pago con datos de MercadoPago
                await PagosModel.actualizar(pago.id, {
                    transaction_id: pagoMP.id.toString(),
                    metadata: {
                        ...pago.metadata,
                        mp_status: pagoMP.status,
                        mp_status_detail: pagoMP.status_detail
                    }
                }, suscripcion.organizacion_id);

                return {
                    exitoso: true,
                    transactionId: pagoMP.id.toString()
                };
            } else {
                return {
                    exitoso: false,
                    error: `MercadoPago estado: ${pagoMP.status} - ${pagoMP.status_detail}`
                };
            }

        } catch (error) {
            logger.error('Error en cobro MercadoPago (después de reintentos)', {
                error: error.message,
                suscripcionId: suscripcion.id,
                pagoId: pago.id
            });

            return {
                exitoso: false,
                error: error.message
            };
        }
    }

    /**
     * Calcular monto a cobrar considerando descuentos recurrentes
     *
     * @param {Object} suscripcion - Suscripción
     * @returns {number} - Monto final
     */
    static _calcularMontoCobro(suscripcion) {
        const precioBase = parseFloat(suscripcion.precio_actual) || 0;
        let descuento = 0;

        // Verificar si hay descuento y si sigue vigente
        if (suscripcion.descuento_monto && suscripcion.descuento_monto > 0) {
            const duracion = suscripcion.duracion_descuento || 'una_vez';
            const mesesActivo = suscripcion.meses_activo || 0;
            const mesesDuracion = suscripcion.meses_duracion || 0;

            if (duracion === 'siempre') {
                // Descuento permanente
                descuento = parseFloat(suscripcion.descuento_monto);
            } else if (duracion === 'meses' && mesesDuracion > 0) {
                // Descuento por X meses
                if (mesesActivo < mesesDuracion) {
                    descuento = parseFloat(suscripcion.descuento_monto);
                }
            }
            // 'una_vez' no aplica en cobros recurrentes (solo primer pago)
        }

        return Math.max(precioBase - descuento, 0);
    }

    /**
     * Calcular fecha de inicio del período de cobro
     *
     * @param {Object} suscripcion - Suscripción
     * @returns {Date} - Fecha inicio período
     */
    static _calcularInicioPeriodo(suscripcion) {
        const hoy = new Date();
        return new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    }

    /**
     * Calcular fecha de fin del período de cobro
     *
     * @param {Object} suscripcion - Suscripción
     * @returns {Date} - Fecha fin período
     */
    static _calcularFinPeriodo(suscripcion) {
        const inicio = this._calcularInicioPeriodo(suscripcion);
        const fin = new Date(inicio);

        switch (suscripcion.periodo) {
            case 'mensual':
                fin.setMonth(fin.getMonth() + 1);
                break;
            case 'trimestral':
                fin.setMonth(fin.getMonth() + 3);
                break;
            case 'semestral':
                fin.setMonth(fin.getMonth() + 6);
                break;
            case 'anual':
                fin.setFullYear(fin.getFullYear() + 1);
                break;
        }

        fin.setDate(fin.getDate() - 1); // Último día del período
        return fin;
    }
}

module.exports = CobroService;
