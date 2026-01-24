/**
 * ====================================================================
 * CONTROLLER: CHECKOUT
 * ====================================================================
 * Controlador para el flujo de checkout con MercadoPago.
 *
 * Soporta dos modos de billing vía Strategy Pattern:
 * - Platform Billing: Nexo Team vende a organizaciones (dogfooding)
 * - Customer Billing: Organizaciones venden a sus clientes (futuro)
 *
 * Endpoints:
 * - POST /checkout/iniciar - Inicia proceso de pago
 * - POST /checkout/validar-cupon - Valida cupón de descuento
 * - GET /checkout/resultado - Obtiene resultado del pago
 *
 * @module controllers/checkout
 * @version 2.0.0 - Strategy Pattern Refactor (Enero 2026)
 */

const PlanesModel = require('../models/planes.model');
const SuscripcionesModel = require('../models/suscripciones.model');
const CuponesModel = require('../models/cupones.model');
const PagosModel = require('../models/pagos.model');
const MercadoPagoService = require('../../../services/mercadopago.service');
const { ErrorHelper } = require('../../../utils/helpers');
const logger = require('../../../utils/logger');
const { NEXO_TEAM_ORG_ID } = require('../../../config/constants');
const { createBillingStrategy } = require('../strategies');

// URL del frontend (con fallback)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

class CheckoutController {

    /**
     * POST /checkout/iniciar
     *
     * Inicia el proceso de checkout:
     * 1. Determina estrategia de billing (Platform vs Customer)
     * 2. Valida el plan del vendor
     * 3. Verifica que no exista suscripción duplicada
     * 4. Valida cupón (si hay)
     * 5. Crea suscripción en estado pendiente_pago
     * 6. Crea registro de pago pendiente
     * 7. Crea preferencia en MercadoPago
     * 8. Retorna init_point para redirección
     */
    async iniciarCheckout(req, res) {
        const { plan_id, periodo, cupon_codigo, es_venta_propia, cliente_id: clienteIdBody } = req.body;
        const organizacionId = req.user.organizacion_id;
        const usuarioId = req.user.id;

        // ═══════════════════════════════════════════════════════════════
        // PASO 1: Determinar estrategia de billing
        // ═══════════════════════════════════════════════════════════════
        const billingContext = {
            organizacionId,
            esVentaPropia: es_venta_propia || false,
            clienteId: clienteIdBody || null,
            user: req.user
        };

        const billingStrategy = createBillingStrategy(billingContext);
        const billingType = billingStrategy.getBillingType();

        logger.info(`[Checkout ${billingType}] Iniciando checkout para org ${organizacionId}`);

        // ═══════════════════════════════════════════════════════════════
        // PASO 2: Validar suscriptor según estrategia
        // ═══════════════════════════════════════════════════════════════
        await billingStrategy.validateSubscriber(billingContext);

        // ═══════════════════════════════════════════════════════════════
        // PASO 3: Obtener IDs correctos según estrategia
        // ═══════════════════════════════════════════════════════════════
        const vendorId = billingStrategy.getVendorId(billingContext);
        const clienteId = await billingStrategy.getClienteId(billingContext);

        logger.debug(`[Checkout ${billingType}] Vendor: ${vendorId}, Cliente: ${clienteId}`);

        // ═══════════════════════════════════════════════════════════════
        // PASO 4: Validar que el plan existe y está activo
        // ═══════════════════════════════════════════════════════════════
        const plan = await PlanesModel.buscarPorId(plan_id, vendorId);
        ErrorHelper.throwIfNotFound(plan, 'Plan de suscripción');

        if (!plan.activo) {
            ErrorHelper.throwValidation('El plan seleccionado no está disponible');
        }

        // ═══════════════════════════════════════════════════════════════
        // PASO 5: Validación de duplicados
        // ═══════════════════════════════════════════════════════════════
        const suscripcionExistente = await SuscripcionesModel.buscarActivaPorClienteYPlan(
            clienteId,
            plan_id,
            vendorId,
            req.user.email
        );

        if (suscripcionExistente) {
            // Si está pendiente_pago y tiene gateway_id, retornar init_point existente
            if (suscripcionExistente.estado === 'pendiente_pago' && suscripcionExistente.subscription_id_gateway) {
                logger.info(`[Checkout ${billingType}] Retornando init_point existente para suscripción ${suscripcionExistente.id}`);

                const mpService = await MercadoPagoService.getForOrganization(vendorId);
                try {
                    const mpSuscripcion = await mpService.obtenerSuscripcion(suscripcionExistente.subscription_id_gateway);

                    return res.json({
                        success: true,
                        message: 'Checkout pendiente existente. Use el mismo link para completar el pago.',
                        data: {
                            init_point: mpSuscripcion.init_point,
                            suscripcion_id: suscripcionExistente.id,
                            plan: {
                                id: plan.id,
                                nombre: plan.nombre,
                                codigo: plan.codigo
                            },
                            existente: true
                        }
                    });
                } catch (mpError) {
                    logger.warn(`[Checkout ${billingType}] No se pudo obtener suscripción de MP: ${mpError.message}. Creando nueva.`);
                }
            }

            // Si está activa, trial o pausada → Error 409
            if (['activa', 'trial', 'pausada'].includes(suscripcionExistente.estado)) {
                ErrorHelper.throwConflict(
                    `Ya tienes una suscripción ${suscripcionExistente.estado === 'activa' ? 'activa' :
                        suscripcionExistente.estado === 'trial' ? 'en período de prueba' : 'pausada'
                    } para el plan "${plan.nombre}". ` +
                    `Puedes cambiar de plan desde tu página de Mi Plan.`
                );
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // PASO 6: Calcular precio según período
        // ═══════════════════════════════════════════════════════════════
        let precioBase;
        switch (periodo) {
            case 'mensual':
                precioBase = parseFloat(plan.precio_mensual);
                break;
            case 'trimestral':
                precioBase = parseFloat(plan.precio_trimestral) || parseFloat(plan.precio_mensual) * 3;
                break;
            case 'semestral':
                precioBase = parseFloat(plan.precio_mensual) * 6;
                break;
            case 'anual':
                precioBase = parseFloat(plan.precio_anual) || parseFloat(plan.precio_mensual) * 12;
                break;
            default:
                precioBase = parseFloat(plan.precio_mensual);
        }

        // ═══════════════════════════════════════════════════════════════
        // PASO 7: Validar y aplicar cupón (si existe)
        // ═══════════════════════════════════════════════════════════════
        let descuento = 0;
        let cuponAplicado = null;

        if (cupon_codigo) {
            const validacion = await CuponesModel.validar(cupon_codigo, vendorId, { plan_id });

            if (validacion.valido) {
                cuponAplicado = validacion.cupon;

                if (cuponAplicado.tipo_descuento === 'porcentaje') {
                    descuento = (precioBase * cuponAplicado.porcentaje_descuento) / 100;
                } else {
                    descuento = parseFloat(cuponAplicado.monto_descuento) || 0;
                }

                // No puede superar el precio
                descuento = Math.min(descuento, precioBase);
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // PASO 8: Calcular precio final
        // ═══════════════════════════════════════════════════════════════
        const precioFinal = Math.max(0, precioBase - descuento);

        // Suscriptor externo según estrategia (normalmente null cuando hay cliente_id)
        const suscriptorExternoFinal = billingStrategy.buildSuscriptorExterno(billingContext);

        // ═══════════════════════════════════════════════════════════════
        // PASO 9: Si precio es 0 (cupón 100%), activar directamente
        // ═══════════════════════════════════════════════════════════════
        if (precioFinal === 0) {
            const suscripcion = await SuscripcionesModel.crear({
                plan_id,
                cliente_id: clienteId,
                suscriptor_externo: suscriptorExternoFinal,
                periodo,
                es_trial: false,
                gateway: 'cupon_100',
                cupon_codigo: cupon_codigo
            }, vendorId, usuarioId);

            // Cambiar a activa directamente
            await SuscripcionesModel.cambiarEstado(suscripcion.id, 'activa', vendorId);

            // Incrementar uso del cupón
            if (cuponAplicado) {
                await CuponesModel.incrementarUso(cuponAplicado.id, vendorId);
            }

            logger.info(`[Checkout ${billingType}] Suscripción ${suscripcion.id} activada con cupón 100%`);

            return res.json({
                success: true,
                message: 'Suscripción activada con cupón 100%',
                data: {
                    suscripcion_id: suscripcion.id,
                    estado: 'activa',
                    redirect_url: `${FRONTEND_URL}/payment/callback?status=approved&suscripcion_id=${suscripcion.id}`
                }
            });
        }

        // ═══════════════════════════════════════════════════════════════
        // PASO 10: Crear suscripción en estado pendiente_pago
        // ═══════════════════════════════════════════════════════════════
        const suscripcion = await SuscripcionesModel.crearPendiente({
            plan_id,
            cliente_id: clienteId,
            suscriptor_externo: suscriptorExternoFinal,
            periodo,
            precio_actual: precioFinal,
            moneda: plan.moneda || 'MXN',
            gateway: 'mercadopago',
            cupon_aplicado_id: cuponAplicado?.id || null,
            descuento_porcentaje: cuponAplicado?.tipo_descuento === 'porcentaje' ? cuponAplicado.porcentaje_descuento : null,
            descuento_monto: descuento > 0 ? descuento : null
        }, vendorId, usuarioId);

        // ═══════════════════════════════════════════════════════════════
        // PASO 11: Crear registro de pago pendiente
        // ═══════════════════════════════════════════════════════════════
        const pago = await PagosModel.crear({
            suscripcion_id: suscripcion.id,
            monto: precioFinal,
            moneda: plan.moneda || 'MXN',
            estado: 'pendiente',
            gateway: 'mercadopago'
        }, vendorId);

        // ═══════════════════════════════════════════════════════════════
        // PASO 12: Crear preferencia en MercadoPago
        // ═══════════════════════════════════════════════════════════════
        // Formato: org_{vendorId}_sus_{suscripcionId}_pago_{pagoId}_cliente_{orgCliente}
        const externalReference = `org_${vendorId}_sus_${suscripcion.id}_pago_${pago.id}_cliente_${organizacionId}`;
        const mpService = await MercadoPagoService.getForOrganization(vendorId);

        // Determinar email del pagador
        let emailPagador;
        if (process.env.MERCADOPAGO_ENVIRONMENT === 'sandbox') {
            emailPagador = process.env.MERCADOPAGO_TEST_PAYER_EMAIL;
            logger.info(`[Checkout ${billingType}] Sandbox activo, usando email: ${emailPagador}`);
        } else {
            emailPagador = req.user.email;
        }

        const mpResponse = await mpService.crearSuscripcionConInitPoint({
            nombre: `Suscripción ${plan.nombre} - ${periodo}`,
            precio: precioFinal,
            moneda: plan.moneda || 'MXN',
            email: emailPagador,
            returnUrl: `${FRONTEND_URL}/payment/callback`,
            externalReference
        });

        // ═══════════════════════════════════════════════════════════════
        // PASO 13: Actualizar suscripción con ID de MercadoPago
        // ═══════════════════════════════════════════════════════════════
        await SuscripcionesModel.actualizarGatewayIds(suscripcion.id, {
            subscription_id_gateway: mpResponse.id
        }, vendorId);

        logger.info(`[Checkout ${billingType}] Suscripción ${suscripcion.id} creada - Plan: ${plan.nombre}, Precio: ${precioFinal}, Cliente: ${clienteId}`);

        res.json({
            success: true,
            message: 'Checkout iniciado correctamente',
            data: {
                init_point: mpResponse.init_point,
                suscripcion_id: suscripcion.id,
                pago_id: pago.id,
                plan: {
                    id: plan.id,
                    nombre: plan.nombre,
                    codigo: plan.codigo
                },
                precio: {
                    base: precioBase,
                    descuento: descuento,
                    final: precioFinal,
                    moneda: plan.moneda || 'MXN'
                },
                cupon_aplicado: cuponAplicado ? {
                    codigo: cuponAplicado.codigo,
                    tipo: cuponAplicado.tipo_descuento,
                    valor: cuponAplicado.tipo_descuento === 'porcentaje'
                        ? `${cuponAplicado.porcentaje_descuento}%`
                        : `$${cuponAplicado.monto_descuento}`
                } : null
            }
        });
    }

    /**
     * POST /checkout/validar-cupon
     *
     * Valida un cupón y calcula el descuento aplicable
     */
    async validarCupon(req, res) {
        const { codigo, plan_id, precio_base } = req.body;

        // Validar cupón (los cupones son de Nexo Team en Platform Billing)
        // TODO: En Customer Billing, obtener vendorId de la estrategia
        const validacion = await CuponesModel.validar(codigo, NEXO_TEAM_ORG_ID, { plan_id });

        if (!validacion.valido) {
            return res.json({
                success: true,
                data: {
                    valido: false,
                    razon: validacion.razon,
                    cupon: null
                }
            });
        }

        const cupon = validacion.cupon;

        // Calcular descuento si se proporciona precio base
        let descuento_calculado = null;
        let precio_final = null;

        if (precio_base && precio_base > 0) {
            if (cupon.tipo_descuento === 'porcentaje') {
                descuento_calculado = (precio_base * cupon.porcentaje_descuento) / 100;
            } else {
                descuento_calculado = parseFloat(cupon.monto_descuento) || 0;
            }

            // No puede superar el precio
            descuento_calculado = Math.min(descuento_calculado, precio_base);
            precio_final = Math.max(0, precio_base - descuento_calculado);
        }

        res.json({
            success: true,
            data: {
                valido: true,
                cupon: {
                    id: cupon.id,
                    codigo: cupon.codigo,
                    nombre: cupon.nombre,
                    tipo_descuento: cupon.tipo_descuento,
                    porcentaje_descuento: cupon.porcentaje_descuento,
                    monto_descuento: cupon.monto_descuento,
                    duracion_descuento: cupon.duracion_descuento,
                    meses_duracion: cupon.meses_duracion
                },
                descuento_calculado,
                precio_final
            }
        });
    }

    /**
     * GET /checkout/resultado
     *
     * Obtiene el resultado de un pago (usado por el frontend después del callback)
     *
     * Parámetros aceptados:
     * - suscripcion_id: ID interno de la suscripción
     * - external_reference: Referencia externa (formato: org_X_sus_123_pago_456)
     * - preapproval_id: ID de la suscripción en MercadoPago
     */
    async obtenerResultado(req, res) {
        const { suscripcion_id, external_reference, preapproval_id, collection_status } = req.query;
        const organizacionId = req.user.organizacion_id;

        let suscripcion = null;

        // En Platform Billing, las suscripciones están en Nexo Team
        // pero el usuario puede ser de otra org
        const vendorId = NEXO_TEAM_ORG_ID;

        // 1. Buscar por suscripcion_id directamente
        if (suscripcion_id) {
            // Primero intentar en el vendor (Nexo Team)
            suscripcion = await SuscripcionesModel.buscarPorId(suscripcion_id, vendorId);

            // Si no está en vendor, buscar en la org del usuario (fallback)
            if (!suscripcion) {
                suscripcion = await SuscripcionesModel.buscarPorId(suscripcion_id, organizacionId);
            }
        }

        // 2. Parsear external_reference si viene (formato: org_X_sus_123_pago_456)
        if (!suscripcion && external_reference) {
            const match = external_reference.match(/sus_(\d+)/);
            if (match) {
                const susId = parseInt(match[1]);
                suscripcion = await SuscripcionesModel.buscarPorId(susId, vendorId);
                if (!suscripcion) {
                    suscripcion = await SuscripcionesModel.buscarPorId(susId, organizacionId);
                }
            }
        }

        // 3. Buscar por preapproval_id (subscription_id_gateway de MercadoPago)
        if (!suscripcion && preapproval_id) {
            suscripcion = await SuscripcionesModel.buscarPorGatewayId(preapproval_id, vendorId);
            if (!suscripcion) {
                suscripcion = await SuscripcionesModel.buscarPorGatewayId(preapproval_id, organizacionId);
            }
        }

        if (!suscripcion) {
            ErrorHelper.throwValidation('Se requiere suscripcion_id, external_reference o preapproval_id válido');
        }

        // Determinar estado del resultado
        let estadoResultado;
        switch (collection_status) {
            case 'approved':
                estadoResultado = 'aprobado';
                break;
            case 'pending':
            case 'in_process':
                estadoResultado = 'pendiente';
                break;
            case 'rejected':
            case 'cancelled':
                estadoResultado = 'rechazado';
                break;
            default:
                estadoResultado = suscripcion.estado === 'activa' ? 'aprobado' :
                    suscripcion.estado === 'pendiente_pago' ? 'pendiente' : 'desconocido';
        }

        res.json({
            success: true,
            data: {
                suscripcion: {
                    id: suscripcion.id,
                    estado: suscripcion.estado,
                    plan_nombre: suscripcion.plan_nombre,
                    precio_actual: suscripcion.precio_actual,
                    fecha_inicio: suscripcion.fecha_inicio,
                    fecha_proximo_cobro: suscripcion.fecha_proximo_cobro
                },
                resultado_pago: {
                    estado: estadoResultado,
                    collection_status
                }
            }
        });
    }
}

module.exports = new CheckoutController();
