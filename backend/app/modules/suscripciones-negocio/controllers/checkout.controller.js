/**
 * ====================================================================
 * CONTROLLER: CHECKOUT
 * ====================================================================
 * Controlador para el flujo de checkout con MercadoPago.
 *
 * Endpoints:
 * - POST /checkout/iniciar - Inicia proceso de pago
 * - POST /checkout/validar-cupon - Valida cupón de descuento
 * - GET /checkout/resultado - Obtiene resultado del pago
 *
 * @module controllers/checkout
 */

const PlanesModel = require('../models/planes.model');
const SuscripcionesModel = require('../models/suscripciones.model');
const CuponesModel = require('../models/cupones.model');
const PagosModel = require('../models/pagos.model');
const MercadoPagoService = require('../../../services/mercadopago.service');
const { ErrorHelper } = require('../../../utils/helpers');
const logger = require('../../../utils/logger');

// URL del frontend (con fallback)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

class CheckoutController {

    /**
     * POST /checkout/iniciar
     *
     * Inicia el proceso de checkout:
     * 1. Valida el plan
     * 2. Valida cupón (si hay)
     * 3. Crea suscripción en estado pendiente_pago
     * 4. Crea registro de pago pendiente
     * 5. Crea preferencia en MercadoPago
     * 6. Retorna init_point para redirección
     */
    async iniciarCheckout(req, res) {
        const { plan_id, periodo, cupon_codigo, suscriptor_externo } = req.body;
        const organizacionId = req.user.organizacion_id;
        const usuarioId = req.user.id;

        // 1. Validar que el plan existe y está activo
        const plan = await PlanesModel.buscarPorId(plan_id, organizacionId);
        ErrorHelper.throwIfNotFound(plan, 'Plan de suscripción');

        if (!plan.activo) {
            ErrorHelper.throwValidation('El plan seleccionado no está disponible');
        }

        // 2. Calcular precio según período
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

        // 3. Validar y aplicar cupón (si existe)
        let descuento = 0;
        let cuponAplicado = null;

        if (cupon_codigo) {
            const validacion = await CuponesModel.validar(cupon_codigo, organizacionId, { plan_id });

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

        // 4. Calcular precio final
        const precioFinal = Math.max(0, precioBase - descuento);

        // Si el precio es 0 (cupón 100%), activar directamente
        if (precioFinal === 0) {
            const suscripcion = await SuscripcionesModel.crear({
                plan_id,
                cliente_id: req.user.cliente_id || null,
                suscriptor_externo: suscriptor_externo || null,
                periodo,
                es_trial: false,
                gateway: 'cupon_100',
                cupon_codigo: cupon_codigo
            }, organizacionId, usuarioId);

            // Cambiar a activa directamente
            await SuscripcionesModel.cambiarEstado(suscripcion.id, 'activa', organizacionId);

            // Incrementar uso del cupón
            if (cuponAplicado) {
                await CuponesModel.incrementarUso(cuponAplicado.id, organizacionId);
            }

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

        // 5. Crear suscripción en estado pendiente_pago
        const suscripcion = await SuscripcionesModel.crearPendiente({
            plan_id,
            cliente_id: req.user.cliente_id || null,
            suscriptor_externo: suscriptor_externo || null,
            periodo,
            precio_actual: precioFinal,
            gateway: 'mercadopago',
            cupon_aplicado_id: cuponAplicado?.id || null,
            descuento_porcentaje: cuponAplicado?.tipo_descuento === 'porcentaje' ? cuponAplicado.porcentaje_descuento : null,
            descuento_monto: descuento > 0 ? descuento : null
        }, organizacionId, usuarioId);

        // 6. Crear registro de pago pendiente
        const pago = await PagosModel.crear({
            suscripcion_id: suscripcion.id,
            monto: precioFinal,
            moneda: plan.moneda || 'MXN',
            estado: 'pendiente',
            gateway: 'mercadopago'
        }, organizacionId);

        // 7. Crear preferencia en MercadoPago
        const externalReference = `sus_${suscripcion.id}_pago_${pago.id}`;

        const mpResponse = await MercadoPagoService.crearSuscripcionConInitPoint({
            nombre: `Suscripción ${plan.nombre} - ${periodo}`,
            precio: precioFinal,
            moneda: plan.moneda || 'MXN',
            email: suscriptor_externo?.email || req.user.email,
            returnUrl: `${FRONTEND_URL}/payment/callback`,
            externalReference
        });

        // 8. Actualizar suscripción con ID de MercadoPago
        await SuscripcionesModel.actualizarGatewayIds(suscripcion.id, {
            subscription_id_gateway: mpResponse.id
        }, organizacionId);

        logger.info(`Checkout iniciado: Suscripción ${suscripcion.id}, Plan ${plan.nombre}, Precio ${precioFinal}`);

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
        const organizacionId = req.user.organizacion_id;

        // Validar cupón
        const validacion = await CuponesModel.validar(codigo, organizacionId, { plan_id });

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
     */
    async obtenerResultado(req, res) {
        const { suscripcion_id, external_reference, collection_status } = req.query;
        const organizacionId = req.user.organizacion_id;

        let suscripcionIdFinal = suscripcion_id;

        // Parsear external_reference si viene (formato: sus_123_pago_456)
        if (!suscripcionIdFinal && external_reference) {
            const match = external_reference.match(/sus_(\d+)/);
            if (match) {
                suscripcionIdFinal = parseInt(match[1]);
            }
        }

        if (!suscripcionIdFinal) {
            ErrorHelper.throwValidation('Se requiere suscripcion_id o external_reference');
        }

        // Obtener suscripción
        const suscripcion = await SuscripcionesModel.buscarPorId(suscripcionIdFinal, organizacionId);
        ErrorHelper.throwIfNotFound(suscripcion, 'Suscripción');

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
                // Determinar por el estado de la suscripción
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
