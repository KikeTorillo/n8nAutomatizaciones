/**
 * ====================================================================
 * CONTROLLER: WEBHOOKS
 * ====================================================================
 * Gestión de webhooks públicos de Stripe y MercadoPago.
 * CRÍTICO: Validación HMAC obligatoria para seguridad.
 *
 * @module controllers/webhooks
 */

const asyncHandler = require('../../../middleware/asyncHandler');
const { PagosModel, SuscripcionesModel, WebhooksProcesadosModel } = require('../models');
const StripeService = require('../services/stripe.service');
// MercadoPagoService se importa dinámicamente en webhookMercadoPago
// para obtener la instancia correcta según organizacionId
const NotificacionesService = require('../services/notificaciones.service');
const { ResponseHelper } = require('../../../utils/helpers');
const logger = require('../../../utils/logger');

class WebhooksController {

    /**
     * Webhook de Stripe
     * POST /api/v1/suscripciones-negocio/webhooks/stripe
     *
     * CRÍTICO: Endpoint público (sin auth), validación HMAC obligatoria
     */
    static webhookStripe = asyncHandler(async (req, res) => {
        const signature = req.headers['stripe-signature'];

        if (!signature) {
            logger.error('Webhook Stripe sin signature header');
            return ResponseHelper.error(res, 'Missing signature', 400);
        }

        try {
            // Validar webhook usando HMAC (requiere raw body)
            const event = StripeService.validarWebhook(req.body, signature);

            logger.info(`Webhook Stripe recibido: ${event.type}`, {
                event_id: event.id
            });

            // Procesar evento según tipo
            switch (event.type) {
                case 'payment_intent.succeeded':
                    await this._procesarPaymentIntentSucceeded(event.data.object);
                    break;

                case 'payment_intent.payment_failed':
                    await this._procesarPaymentIntentFailed(event.data.object);
                    break;

                case 'customer.subscription.deleted':
                    await this._procesarSuscripcionCancelada(event.data.object);
                    break;

                case 'customer.subscription.updated':
                    await this._procesarSuscripcionActualizada(event.data.object);
                    break;

                default:
                    logger.debug(`Evento Stripe no manejado: ${event.type}`);
            }

            return ResponseHelper.success(res, { received: true });

        } catch (error) {
            logger.error('Error procesando webhook Stripe', { error: error.message });
            return ResponseHelper.error(res, 'Webhook validation failed', 400);
        }
    });

    /**
     * Webhook de MercadoPago (Multi-Tenant)
     * POST /api/v1/suscripciones-negocio/webhooks/mercadopago/:organizacionId
     *
     * CRÍTICO: Endpoint público (sin auth), validación HMAC obligatoria
     * IDEMPOTENCIA: Implementada via x-request-id + tabla webhooks_procesados
     *
     * Cada organización configura su webhook en MercadoPago con su URL específica:
     * https://api.nexo.com/api/v1/suscripciones-negocio/webhooks/mercadopago/1
     *
     * Esto permite usar las credenciales correctas de cada organización para validar.
     */
    static webhookMercadoPago = asyncHandler(async (req, res) => {
        // 1. Extraer organizacionId de la URL (zero-trust del body)
        const organizacionId = parseInt(req.params.organizacionId);

        if (!organizacionId || isNaN(organizacionId)) {
            logger.warn('Webhook MercadoPago sin organizacionId válido', {
                params: req.params
            });
            return ResponseHelper.error(res, 'organizacionId requerido en URL', 400);
        }

        const signature = req.headers['x-signature'];
        const requestId = req.headers['x-request-id'];
        const dataId = req.query['data.id'];
        const ipOrigen = req.ip || req.headers['x-forwarded-for'] || null;

        logger.info('Webhook MercadoPago recibido', {
            organizacionId,
            action: req.body.action,
            type: req.body.type,
            data_id: dataId,
            request_id: requestId
        });

        // 2. IDEMPOTENCIA: Verificar si ya fue procesado
        if (requestId) {
            const yaProcesado = await WebhooksProcesadosModel.yaFueProcesado('mercadopago', requestId);
            if (yaProcesado) {
                logger.info('Webhook duplicado ignorado (idempotencia)', {
                    requestId,
                    organizacionId
                });
                return ResponseHelper.success(res, {
                    received: true,
                    deduplicated: true
                });
            }
        }

        // 3. Obtener instancia de MercadoPago para ESTA organización
        let mpService;
        try {
            const MercadoPagoServiceMain = require('../../../services/mercadopago.service');
            mpService = await MercadoPagoServiceMain.getForOrganization(organizacionId);
        } catch (error) {
            logger.error('No hay conector MercadoPago para organización', {
                organizacionId,
                error: error.message
            });

            // Registrar webhook con error
            if (requestId) {
                await WebhooksProcesadosModel.registrar({
                    gateway: 'mercadopago',
                    requestId,
                    eventType: req.body.type || 'unknown',
                    dataId,
                    organizacionId,
                    resultado: 'error',
                    mensaje: `Conector no configurado: ${error.message}`,
                    ipOrigen
                });
            }

            return ResponseHelper.error(res, 'Conector no configurado', 400);
        }

        // 4. Validar HMAC con credenciales de ESTA organización
        const esValido = mpService.validarWebhook(signature, requestId, dataId);

        if (!esValido) {
            logger.warn('Webhook MercadoPago inválido', {
                organizacionId,
                signature: signature?.substring(0, 20) + '...',
                requestId
            });

            // Registrar webhook con error de validación
            if (requestId) {
                await WebhooksProcesadosModel.registrar({
                    gateway: 'mercadopago',
                    requestId,
                    eventType: req.body.type || 'unknown',
                    dataId,
                    organizacionId,
                    resultado: 'error',
                    mensaje: 'Validación HMAC fallida',
                    ipOrigen
                });
            }

            return ResponseHelper.error(res, 'Invalid signature', 400);
        }

        // 5. Procesar evento (ya validado)
        const { type, action, data } = req.body;
        let resultado = 'success';
        let mensaje = null;

        try {
            if (type === 'payment') {
                await this._procesarPagoMercadoPago(data.id, organizacionId, mpService);
            } else if (type === 'subscription_preapproval') {
                await this._procesarSuscripcionMercadoPago(data.id, action, organizacionId);
            } else if (type === 'subscription_authorized_payment') {
                // Pago de suscripción autorizado - procesar como pago
                await this._procesarPagoSuscripcionMercadoPago(data.id, organizacionId, mpService);
            } else {
                resultado = 'skipped';
                mensaje = `Evento no manejado: ${type}`;
                logger.debug(`Evento MercadoPago no manejado: ${type}`, { action });
            }

        } catch (error) {
            resultado = 'error';
            mensaje = error.message;
            logger.error('Error procesando webhook MercadoPago', {
                organizacionId,
                error: error.message
            });
        }

        // 6. Registrar webhook procesado (idempotencia)
        if (requestId) {
            await WebhooksProcesadosModel.registrar({
                gateway: 'mercadopago',
                requestId,
                eventType: type || 'unknown',
                dataId: data?.id?.toString(),
                organizacionId,
                resultado,
                mensaje,
                ipOrigen
            });
        }

        // Siempre responder 200 para evitar reintentos innecesarios de MP
        return ResponseHelper.success(res, { received: true, resultado });
    });

    // ====================================================================
    // PROCESADORES DE EVENTOS STRIPE
    // ====================================================================

    /**
     * Procesar PaymentIntent exitoso (Stripe)
     */
    static async _procesarPaymentIntentSucceeded(paymentIntent) {
        try {
            const { suscripcion_id, pago_id, organizacion_id } = paymentIntent.metadata;

            if (!pago_id || !organizacion_id) {
                logger.warn('PaymentIntent sin metadata completo', { payment_intent_id: paymentIntent.id });
                return;
            }

            // Actualizar pago a completado
            await PagosModel.actualizarEstado(pago_id, 'completado', organizacion_id);

            // Actualizar suscripción
            if (suscripcion_id) {
                await SuscripcionesModel.procesarCobroExitoso(suscripcion_id, organizacion_id);
            }

            logger.info(`PaymentIntent exitoso procesado: ${paymentIntent.id}`);

        } catch (error) {
            logger.error('Error procesando PaymentIntent exitoso', { error: error.message });
        }
    }

    /**
     * Procesar PaymentIntent fallido (Stripe)
     */
    static async _procesarPaymentIntentFailed(paymentIntent) {
        try {
            const { suscripcion_id, pago_id, organizacion_id } = paymentIntent.metadata;

            if (!pago_id || !organizacion_id) {
                return;
            }

            // Actualizar pago a fallido
            await PagosModel.actualizarEstado(pago_id, 'fallido', organizacion_id);

            // Registrar fallo en suscripción
            if (suscripcion_id) {
                await SuscripcionesModel.registrarFalloCobro(
                    suscripcion_id,
                    organizacion_id,
                    paymentIntent.last_payment_error?.message || 'Payment failed'
                );
            }

            logger.info(`PaymentIntent fallido procesado: ${paymentIntent.id}`);

        } catch (error) {
            logger.error('Error procesando PaymentIntent fallido', { error: error.message });
        }
    }

    /**
     * Procesar suscripción cancelada (Stripe)
     */
    static async _procesarSuscripcionCancelada(subscription) {
        try {
            const { suscripcion_id, organizacion_id } = subscription.metadata;

            if (!suscripcion_id || !organizacion_id) {
                return;
            }

            await SuscripcionesModel.cambiarEstado(
                suscripcion_id,
                'cancelada',
                organizacion_id,
                { razon: 'Cancelada desde Stripe' }
            );

            logger.info(`Suscripción Stripe cancelada: ${subscription.id}`);

        } catch (error) {
            logger.error('Error procesando cancelación Stripe', { error: error.message });
        }
    }

    /**
     * Procesar suscripción actualizada (Stripe)
     */
    static async _procesarSuscripcionActualizada(subscription) {
        logger.debug(`Suscripción Stripe actualizada: ${subscription.id}`, {
            status: subscription.status
        });
        // TODO: Implementar lógica de actualización si es necesario
    }

    // ====================================================================
    // PROCESADORES DE EVENTOS MERCADOPAGO
    // ====================================================================

    /**
     * Procesar pago de MercadoPago (Multi-Tenant)
     *
     * @param {string} paymentId - ID del pago en MercadoPago
     * @param {number} organizacionId - ID de la organización (de la URL del webhook)
     * @param {Object} mpService - Instancia de MercadoPagoService con credenciales correctas
     */
    static async _procesarPagoMercadoPago(paymentId, organizacionId, mpService) {
        try {
            // Obtener pago de MP usando la instancia de la organización
            const pago = await mpService.obtenerPago(paymentId);

            logger.info('Procesando pago MercadoPago', {
                payment_id: paymentId,
                status: pago.status,
                organizacionId
            });

            // Buscar pago en nuestra BD por transaction_id
            // Nota: organizacionId viene de la URL, no del metadata de MP
            const pagoLocal = await PagosModel.buscarPorTransactionId(
                'mercadopago',
                paymentId.toString(),
                organizacionId
            );

            if (!pagoLocal) {
                logger.warn('Pago MercadoPago no encontrado en BD', {
                    payment_id: paymentId,
                    organizacionId
                });
                return;
            }

            // Actualizar estado según MercadoPago
            if (pago.status === 'approved') {
                await PagosModel.actualizarEstado(pagoLocal.id, 'completado', pagoLocal.organizacion_id);

                // Actualizar suscripción
                if (pagoLocal.suscripcion_id) {
                    const suscripcion = await SuscripcionesModel.buscarPorId(
                        pagoLocal.suscripcion_id,
                        pagoLocal.organizacion_id
                    );
                    await SuscripcionesModel.procesarCobroExitoso(
                        pagoLocal.suscripcion_id,
                        pagoLocal.organizacion_id
                    );

                    // Enviar email de confirmación de pago
                    if (suscripcion) {
                        await NotificacionesService.enviarConfirmacionPago(suscripcion, {
                            ...pagoLocal,
                            monto: pago.transaction_amount,
                            transaction_id: paymentId.toString()
                        });
                    }
                }

                logger.info('✅ Pago MercadoPago procesado exitosamente', {
                    payment_id: paymentId,
                    suscripcion_id: pagoLocal.suscripcion_id,
                    organizacionId
                });
            } else if (pago.status === 'rejected' || pago.status === 'cancelled') {
                await PagosModel.actualizarEstado(pagoLocal.id, 'fallido', pagoLocal.organizacion_id);

                // Enviar email de pago fallido
                if (pagoLocal.suscripcion_id) {
                    const suscripcion = await SuscripcionesModel.buscarPorId(
                        pagoLocal.suscripcion_id,
                        pagoLocal.organizacion_id
                    );
                    if (suscripcion) {
                        const razonFallo = pago.status_detail || 'Pago rechazado por el procesador';
                        await NotificacionesService.enviarFalloPago(suscripcion, pagoLocal, razonFallo);
                    }
                }

                logger.info('⚠️ Pago MercadoPago rechazado/cancelado', {
                    payment_id: paymentId,
                    status: pago.status,
                    organizacionId
                });
            }

        } catch (error) {
            logger.error('Error procesando pago MercadoPago', {
                payment_id: paymentId,
                organizacionId,
                error: error.message
            });
        }
    }

    /**
     * Procesar evento de suscripción MercadoPago (Multi-Tenant)
     * Evento: subscription_preapproval
     *
     * Este es el evento principal para suscripciones. Cuando el usuario autoriza
     * la suscripción en MercadoPago, se dispara este webhook con status "authorized".
     *
     * @param {string} subscriptionId - ID de la suscripción (preapproval) en MercadoPago
     * @param {string} action - Acción del evento (created, updated, etc.)
     * @param {number} organizacionId - ID de la organización
     */
    static async _procesarSuscripcionMercadoPago(subscriptionId, action, organizacionId) {
        try {
            logger.info('Procesando suscripción MercadoPago (subscription_preapproval)', {
                subscription_id: subscriptionId,
                action,
                organizacionId
            });

            // 1. Obtener instancia de MercadoPago para esta organización
            const MercadoPagoServiceMain = require('../../../services/mercadopago.service');
            const mpService = await MercadoPagoServiceMain.getForOrganization(organizacionId);

            // 2. Obtener la suscripción de MercadoPago
            const mpSuscripcion = await mpService.obtenerSuscripcion(subscriptionId);

            logger.info('Estado de suscripción en MercadoPago', {
                subscription_id: subscriptionId,
                status: mpSuscripcion.status,
                payer_email: mpSuscripcion.payer_email
            });

            // 3. Buscar suscripción en nuestra BD por el ID de gateway
            // NOTA: Pasamos null para buscar globalmente, ya que:
            // - El webhook viene con org del VENDEDOR (Nexo Team = 1)
            // - Pero las suscripciones pertenecen al CLIENTE (org 2, 3, etc.)
            const suscripcion = await SuscripcionesModel.buscarPorGatewayId(
                subscriptionId,
                null  // Buscar sin filtro de organización
            );

            if (!suscripcion) {
                logger.warn('Suscripción no encontrada para subscription_id_gateway', {
                    subscription_id: subscriptionId,
                    organizacionId
                });
                return;
            }

            logger.info('Suscripción encontrada en BD', {
                suscripcion_id: suscripcion.id,
                organizacion_id_cliente: suscripcion.organizacion_id,
                estado_actual: suscripcion.estado
            });

            // 4. Si la suscripción está "authorized", activarla
            // NOTA: Usamos métodos Bypass porque los planes (Nexo Team org 1)
            // y las suscripciones (cliente org N) están en orgs diferentes
            if (mpSuscripcion.status === 'authorized') {
                await SuscripcionesModel.cambiarEstadoBypass(
                    suscripcion.id,
                    'activa',
                    { razon: 'Autorizada vía webhook MercadoPago (subscription_preapproval)' }
                );

                // Procesar como cobro exitoso (actualiza fecha próximo cobro, etc.)
                await SuscripcionesModel.procesarCobroExitosoBypass(
                    suscripcion.id,
                    suscripcion
                );

                logger.info('✅ Suscripción activada vía webhook subscription_preapproval', {
                    suscripcion_id: suscripcion.id,
                    subscription_id_gateway: subscriptionId,
                    organizacionId: suscripcion.organizacion_id
                });

            } else if (mpSuscripcion.status === 'cancelled') {
                await SuscripcionesModel.cambiarEstadoBypass(
                    suscripcion.id,
                    'cancelada',
                    { razon: 'Cancelada en MercadoPago' }
                );

                // Enviar email de cancelación
                await NotificacionesService.enviarCancelacion(suscripcion, 'Cancelada desde MercadoPago');

                logger.info('⚠️ Suscripción cancelada vía webhook', {
                    suscripcion_id: suscripcion.id,
                    subscription_id_gateway: subscriptionId
                });

            } else if (mpSuscripcion.status === 'paused') {
                await SuscripcionesModel.cambiarEstadoBypass(
                    suscripcion.id,
                    'pausada',
                    { razon: 'Pausada en MercadoPago' }
                );

                logger.info('⏸️ Suscripción pausada vía webhook', {
                    suscripcion_id: suscripcion.id,
                    subscription_id_gateway: subscriptionId
                });

            } else {
                logger.debug('Estado de suscripción no requiere acción', {
                    status: mpSuscripcion.status,
                    subscription_id: subscriptionId
                });
            }

        } catch (error) {
            logger.error('Error procesando suscripción MercadoPago', {
                subscription_id: subscriptionId,
                action,
                organizacionId,
                error: error.message,
                stack: error.stack
            });
        }
    }

    /**
     * Procesar pago autorizado de suscripción MercadoPago (Multi-Tenant)
     * Evento: subscription_authorized_payment
     *
     * Este evento se dispara cuando un pago de una suscripción (preapproval) es autorizado.
     *
     * @param {string} authorizedPaymentId - ID del pago autorizado en MercadoPago
     * @param {number} organizacionId - ID de la organización
     * @param {Object} mpService - Instancia de MercadoPagoService
     */
    static async _procesarPagoSuscripcionMercadoPago(authorizedPaymentId, organizacionId, mpService) {
        try {
            logger.info('Procesando pago de suscripción MercadoPago', {
                authorized_payment_id: authorizedPaymentId,
                organizacionId
            });

            // Obtener detalles del pago autorizado de MP
            // El authorized_payment tiene referencia al preapproval_id
            const pagoAutorizado = await mpService.obtenerPagoAutorizado(authorizedPaymentId);

            if (!pagoAutorizado) {
                logger.warn('Pago autorizado no encontrado en MercadoPago', {
                    authorized_payment_id: authorizedPaymentId
                });
                return;
            }

            const preapprovalId = pagoAutorizado.preapproval_id;
            const status = pagoAutorizado.status;

            logger.info('Detalles pago autorizado MercadoPago', {
                preapproval_id: preapprovalId,
                status,
                monto: pagoAutorizado.transaction_amount
            });

            // Buscar suscripción en nuestra BD por preapproval_id
            // NOTA: Pasamos null para buscar globalmente, ya que:
            // - El webhook viene con org del VENDEDOR (Nexo Team = 1)
            // - Pero las suscripciones pertenecen al CLIENTE (org 2, 3, etc.)
            const suscripcion = await SuscripcionesModel.buscarPorGatewayId(
                preapprovalId,
                null  // Buscar sin filtro de organización
            );

            if (!suscripcion) {
                logger.warn('Suscripción no encontrada para preapproval', {
                    preapproval_id: preapprovalId,
                    organizacionId
                });
                return;
            }

            logger.info('Suscripción encontrada para pago autorizado', {
                suscripcion_id: suscripcion.id,
                organizacion_id_suscripcion: suscripcion.organizacion_id,
                estado_actual: suscripcion.estado
            });

            // Si el pago está aprobado o procesado, activar la suscripción
            // NOTA: MercadoPago usa "processed" para pagos de suscripción exitosos
            // NOTA: Usamos Bypass porque planes y suscripciones están en orgs diferentes
            if (status === 'approved' || status === 'processed') {
                // Solo cambiar estado si no está ya activa
                if (suscripcion.estado !== 'activa') {
                    await SuscripcionesModel.cambiarEstadoBypass(
                        suscripcion.id,
                        'activa',
                        { razon: 'Pago autorizado en MercadoPago (subscription_authorized_payment)' }
                    );
                }

                // Buscar pago pendiente existente para esta suscripción y actualizarlo
                const pagoExistente = await PagosModel.buscarPendientePorSuscripcion(suscripcion.id);

                if (pagoExistente) {
                    // Actualizar el pago existente
                    await PagosModel.actualizarEstadoBypass(
                        pagoExistente.id,
                        'completado',
                        {
                            transaction_id: authorizedPaymentId,
                            fecha_pago: new Date()
                        }
                    );
                    logger.info('✅ Pago existente actualizado a completado', {
                        pago_id: pagoExistente.id,
                        transaction_id: authorizedPaymentId
                    });
                } else {
                    // Si no hay pago pendiente, crear uno nuevo
                    await PagosModel.crear({
                        suscripcion_id: suscripcion.id,
                        monto: pagoAutorizado.transaction_amount,
                        moneda: pagoAutorizado.currency_id || 'MXN',
                        estado: 'completado',
                        gateway: 'mercadopago',
                        transaction_id: authorizedPaymentId,
                        fecha_pago: new Date()
                    }, suscripcion.organizacion_id);
                    logger.info('✅ Nuevo pago creado como completado', {
                        suscripcion_id: suscripcion.id,
                        transaction_id: authorizedPaymentId
                    });
                }

                // Procesar como cobro exitoso (actualiza fecha próximo cobro)
                await SuscripcionesModel.procesarCobroExitosoBypass(
                    suscripcion.id,
                    suscripcion
                );

                // Enviar email de confirmación de pago
                await NotificacionesService.enviarConfirmacionPago(suscripcion, {
                    id: authorizedPaymentId,
                    monto: pagoAutorizado.transaction_amount,
                    moneda: pagoAutorizado.currency_id || 'MXN',
                    transaction_id: authorizedPaymentId,
                    creado_en: new Date()
                });

                logger.info('✅ Suscripción procesada por pago autorizado', {
                    suscripcion_id: suscripcion.id,
                    preapproval_id: preapprovalId,
                    status
                });
            } else if (status === 'rejected' || status === 'cancelled') {
                // Enviar email de pago fallido
                const razonFallo = pagoAutorizado.rejection_code || 'Pago rechazado';
                await NotificacionesService.enviarFalloPago(suscripcion, {
                    monto: pagoAutorizado.transaction_amount
                }, razonFallo);

                logger.warn('Pago de suscripción rechazado/cancelado', {
                    suscripcion_id: suscripcion.id,
                    status,
                    organizacionId
                });
            }

        } catch (error) {
            logger.error('Error procesando pago de suscripción MercadoPago', {
                authorized_payment_id: authorizedPaymentId,
                organizacionId,
                error: error.message
            });
        }
    }
}

module.exports = WebhooksController;
