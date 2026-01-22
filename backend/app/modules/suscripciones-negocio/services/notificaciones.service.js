/**
 * ====================================================================
 * SERVICE: NOTIFICACIONES
 * ====================================================================
 * Servicio de envío de notificaciones por email para suscripciones.
 *
 * @module services/notificaciones
 */

const logger = require('../../../utils/logger');

class NotificacionesService {

    /**
     * Enviar confirmación de pago exitoso
     *
     * @param {Object} suscripcion - Suscripción
     * @param {Object} pago - Pago procesado
     * @returns {Promise<void>}
     */
    static async enviarConfirmacionPago(suscripcion, pago) {
        try {
            const email = this._obtenerEmail(suscripcion);
            const nombre = this._obtenerNombre(suscripcion);

            logger.info(`Enviando confirmación de pago a ${email}`, {
                suscripcion_id: suscripcion.id,
                pago_id: pago.id
            });

            // TODO: Integrar con servicio de emails (nodemailer, SendGrid, etc.)
            // Por ahora solo logging

            const asunto = 'Confirmación de pago - Suscripción';
            const mensaje = this._generarMensajeConfirmacionPago(nombre, suscripcion, pago);

            logger.debug('Email de confirmación', { email, asunto });

            // await EmailService.send({
            //   to: email,
            //   subject: asunto,
            //   html: mensaje
            // });

        } catch (error) {
            logger.error('Error enviando confirmación de pago', { error: error.message });
        }
    }

    /**
     * Enviar notificación de fallo de pago
     *
     * @param {Object} suscripcion - Suscripción
     * @param {Object} pago - Pago fallido
     * @param {string} razonFallo - Razón del fallo
     * @returns {Promise<void>}
     */
    static async enviarFalloPago(suscripcion, pago, razonFallo) {
        try {
            const email = this._obtenerEmail(suscripcion);
            const nombre = this._obtenerNombre(suscripcion);

            logger.info(`Enviando notificación de fallo de pago a ${email}`, {
                suscripcion_id: suscripcion.id,
                pago_id: pago.id,
                razon: razonFallo
            });

            const asunto = 'Pago fallido - Acción requerida';
            const mensaje = this._generarMensajeFalloPago(nombre, suscripcion, pago, razonFallo);

            logger.debug('Email de fallo de pago', { email, asunto });

            // TODO: await EmailService.send({ to: email, subject: asunto, html: mensaje });

        } catch (error) {
            logger.error('Error enviando notificación de fallo', { error: error.message });
        }
    }

    /**
     * Enviar solicitud de pago manual
     *
     * @param {Object} suscripcion - Suscripción
     * @param {Object} pago - Pago pendiente
     * @returns {Promise<void>}
     */
    static async enviarSolicitudPago(suscripcion, pago) {
        try {
            const email = this._obtenerEmail(suscripcion);
            const nombre = this._obtenerNombre(suscripcion);

            logger.info(`Enviando solicitud de pago manual a ${email}`, {
                suscripcion_id: suscripcion.id,
                pago_id: pago.id
            });

            const asunto = 'Pago pendiente - Suscripción';
            const mensaje = this._generarMensajeSolicitudPago(nombre, suscripcion, pago);

            logger.debug('Email solicitud de pago', { email, asunto });

            // TODO: await EmailService.send({ to: email, subject: asunto, html: mensaje });

        } catch (error) {
            logger.error('Error enviando solicitud de pago', { error: error.message });
        }
    }

    /**
     * Enviar notificación de suspensión por fallo de cobro
     *
     * @param {Object} suscripcion - Suscripción suspendida
     * @returns {Promise<void>}
     */
    static async enviarSuspensionPorFalloCobro(suscripcion) {
        try {
            const email = this._obtenerEmail(suscripcion);
            const nombre = this._obtenerNombre(suscripcion);

            logger.info(`Enviando notificación de suspensión a ${email}`, {
                suscripcion_id: suscripcion.id
            });

            const asunto = 'Suscripción suspendida - Acción urgente';
            const mensaje = this._generarMensajeSuspension(nombre, suscripcion);

            logger.debug('Email de suspensión', { email, asunto });

            // TODO: await EmailService.send({ to: email, subject: asunto, html: mensaje });

        } catch (error) {
            logger.error('Error enviando notificación de suspensión', { error: error.message });
        }
    }

    /**
     * Enviar recordatorio de próximo cobro (3 días antes)
     *
     * @param {Object} suscripcion - Suscripción
     * @returns {Promise<void>}
     */
    static async enviarRecordatorioCobro(suscripcion) {
        try {
            const email = this._obtenerEmail(suscripcion);
            const nombre = this._obtenerNombre(suscripcion);

            logger.info(`Enviando recordatorio de cobro a ${email}`, {
                suscripcion_id: suscripcion.id,
                fecha_cobro: suscripcion.fecha_proximo_cobro
            });

            const asunto = 'Recordatorio - Próximo cobro de suscripción';
            const mensaje = this._generarMensajeRecordatorio(nombre, suscripcion);

            logger.debug('Email recordatorio', { email, asunto });

            // TODO: await EmailService.send({ to: email, subject: asunto, html: mensaje });

        } catch (error) {
            logger.error('Error enviando recordatorio', { error: error.message });
        }
    }

    /**
     * Enviar notificación de fin de trial
     *
     * @param {Object} suscripcion - Suscripción en trial
     * @returns {Promise<void>}
     */
    static async enviarFinTrial(suscripcion) {
        try {
            const email = this._obtenerEmail(suscripcion);
            const nombre = this._obtenerNombre(suscripcion);

            logger.info(`Enviando notificación de fin de trial a ${email}`, {
                suscripcion_id: suscripcion.id,
                fecha_fin_trial: suscripcion.fecha_fin_trial
            });

            const asunto = 'Tu período de prueba está por finalizar';
            const mensaje = this._generarMensajeFinTrial(nombre, suscripcion);

            logger.debug('Email fin de trial', { email, asunto });

            // TODO: await EmailService.send({ to: email, subject: asunto, html: mensaje });

        } catch (error) {
            logger.error('Error enviando notificación de fin de trial', { error: error.message });
        }
    }

    /**
     * Enviar confirmación de cancelación
     *
     * @param {Object} suscripcion - Suscripción cancelada
     * @returns {Promise<void>}
     */
    static async enviarConfirmacionCancelacion(suscripcion) {
        try {
            const email = this._obtenerEmail(suscripcion);
            const nombre = this._obtenerNombre(suscripcion);

            logger.info(`Enviando confirmación de cancelación a ${email}`, {
                suscripcion_id: suscripcion.id
            });

            const asunto = 'Suscripción cancelada';
            const mensaje = this._generarMensajeCancelacion(nombre, suscripcion);

            logger.debug('Email cancelación', { email, asunto });

            // TODO: await EmailService.send({ to: email, subject: asunto, html: mensaje });

        } catch (error) {
            logger.error('Error enviando confirmación de cancelación', { error: error.message });
        }
    }

    // ====================================================================
    // MÉTODOS AUXILIARES
    // ====================================================================

    /**
     * Obtener email del suscriptor
     *
     * @param {Object} suscripcion - Suscripción
     * @returns {string} - Email
     */
    static _obtenerEmail(suscripcion) {
        return suscripcion.cliente_email || suscripcion.suscriptor_externo?.email || 'noreply@example.com';
    }

    /**
     * Obtener nombre del suscriptor
     *
     * @param {Object} suscripcion - Suscripción
     * @returns {string} - Nombre
     */
    static _obtenerNombre(suscripcion) {
        return suscripcion.cliente_nombre || suscripcion.suscriptor_externo?.nombre || 'Cliente';
    }

    /**
     * Generar mensaje HTML de confirmación de pago
     */
    static _generarMensajeConfirmacionPago(nombre, suscripcion, pago) {
        return `
            <h2>¡Pago procesado exitosamente!</h2>
            <p>Hola ${nombre},</p>
            <p>Tu pago de <strong>${pago.moneda} $${pago.monto}</strong> ha sido procesado correctamente.</p>
            <p><strong>Detalles:</strong></p>
            <ul>
                <li>Plan: ${suscripcion.plan_nombre}</li>
                <li>Período: ${suscripcion.periodo}</li>
                <li>Próximo cobro: ${suscripcion.fecha_proximo_cobro}</li>
            </ul>
            <p>¡Gracias por tu confianza!</p>
        `;
    }

    /**
     * Generar mensaje HTML de fallo de pago
     */
    static _generarMensajeFalloPago(nombre, suscripcion, pago, razonFallo) {
        return `
            <h2>Tu pago no pudo ser procesado</h2>
            <p>Hola ${nombre},</p>
            <p>No pudimos procesar tu pago de <strong>${pago.moneda} $${pago.monto}</strong>.</p>
            <p><strong>Razón:</strong> ${razonFallo}</p>
            <p>Por favor, actualiza tu método de pago para evitar la suspensión del servicio.</p>
            <p><a href="/suscripciones/${suscripcion.id}">Actualizar método de pago</a></p>
        `;
    }

    /**
     * Generar mensaje HTML de solicitud de pago manual
     */
    static _generarMensajeSolicitudPago(nombre, suscripcion, pago) {
        return `
            <h2>Pago pendiente</h2>
            <p>Hola ${nombre},</p>
            <p>Tu pago de <strong>${pago.moneda} $${pago.monto}</strong> está pendiente.</p>
            <p>Por favor, realiza el pago para continuar con tu suscripción.</p>
            <p><a href="/pagos/${pago.id}">Realizar pago</a></p>
        `;
    }

    /**
     * Generar mensaje HTML de suspensión
     */
    static _generarMensajeSuspension(nombre, suscripcion) {
        return `
            <h2>Suscripción suspendida</h2>
            <p>Hola ${nombre},</p>
            <p>Tu suscripción ha sido suspendida debido a múltiples fallos de pago.</p>
            <p>Para reactivar tu servicio, actualiza tu método de pago.</p>
            <p><a href="/suscripciones/${suscripcion.id}">Reactivar suscripción</a></p>
        `;
    }

    /**
     * Generar mensaje HTML de recordatorio
     */
    static _generarMensajeRecordatorio(nombre, suscripcion) {
        return `
            <h2>Próximo cobro de suscripción</h2>
            <p>Hola ${nombre},</p>
            <p>Te recordamos que el próximo cobro de tu suscripción será el <strong>${suscripcion.fecha_proximo_cobro}</strong>.</p>
            <p><strong>Monto:</strong> ${suscripcion.moneda} $${suscripcion.precio_actual}</p>
            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
        `;
    }

    /**
     * Generar mensaje HTML de fin de trial
     */
    static _generarMensajeFinTrial(nombre, suscripcion) {
        return `
            <h2>Tu período de prueba está por finalizar</h2>
            <p>Hola ${nombre},</p>
            <p>Tu período de prueba finaliza el <strong>${suscripcion.fecha_fin_trial}</strong>.</p>
            <p>Para continuar con el servicio, asegúrate de tener un método de pago configurado.</p>
            <p><a href="/suscripciones/${suscripcion.id}">Configurar método de pago</a></p>
        `;
    }

    /**
     * Generar mensaje HTML de cancelación
     */
    static _generarMensajeCancelacion(nombre, suscripcion) {
        return `
            <h2>Suscripción cancelada</h2>
            <p>Hola ${nombre},</p>
            <p>Tu suscripción ha sido cancelada exitosamente.</p>
            <p>Esperamos verte pronto.</p>
        `;
    }
}

module.exports = NotificacionesService;
