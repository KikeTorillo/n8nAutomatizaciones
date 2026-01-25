/**
 * ====================================================================
 * SERVICE: NOTIFICACIONES SUSCRIPCIONES
 * ====================================================================
 * Servicio de envío de notificaciones por email para suscripciones.
 *
 * Ene 2026 - Implementación completa de dunning emails
 *
 * @module services/notificaciones
 */

const logger = require('../../../utils/logger');
const emailService = require('../../../services/emailService');
const templates = require('../../../services/email/templates/suscripciones');

// URL del frontend para links en emails
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

class NotificacionesSuscripcionesService {

    /**
     * Enviar confirmación de pago exitoso
     *
     * @param {Object} suscripcion - Suscripción
     * @param {Object} pago - Pago procesado
     * @returns {Promise<Object>} Resultado del envío
     */
    static async enviarConfirmacionPago(suscripcion, pago) {
        try {
            const email = this._obtenerEmail(suscripcion);
            const nombre = this._obtenerNombre(suscripcion);

            if (!email) {
                logger.warn(`No se pudo enviar confirmación de pago: email no disponible para suscripción ${suscripcion.id}`);
                return { success: false, reason: 'email_no_disponible' };
            }

            logger.info(`Enviando confirmación de pago a ${email}`, {
                suscripcion_id: suscripcion.id,
                pago_id: pago.id
            });

            const htmlContent = templates.generatePagoExitosoEmail({
                nombre,
                planNombre: suscripcion.plan_nombre,
                periodo: suscripcion.periodo,
                monto: parseFloat(pago.monto),
                moneda: pago.moneda || suscripcion.moneda || 'MXN',
                fechaPago: pago.fecha_pago || pago.creado_en || new Date(),
                fechaProximoCobro: suscripcion.fecha_proximo_cobro,
                transaccionId: pago.transaction_id
            });

            const textContent = templates.generatePagoExitosoText({
                nombre,
                planNombre: suscripcion.plan_nombre,
                periodo: suscripcion.periodo,
                monto: parseFloat(pago.monto),
                moneda: pago.moneda || suscripcion.moneda || 'MXN',
                fechaPago: pago.fecha_pago || pago.creado_en || new Date(),
                fechaProximoCobro: suscripcion.fecha_proximo_cobro,
                transaccionId: pago.transaction_id
            });

            return await emailService.enviarEmail({
                to: email,
                subject: `Pago confirmado - ${suscripcion.plan_nombre}`,
                html: htmlContent,
                text: textContent
            });

        } catch (error) {
            logger.error('Error enviando confirmación de pago', { error: error.message, suscripcion_id: suscripcion.id });
            return { success: false, error: error.message };
        }
    }

    /**
     * Enviar notificación de fallo de pago
     *
     * @param {Object} suscripcion - Suscripción
     * @param {Object} pago - Pago fallido
     * @param {string} razonFallo - Razón del fallo
     * @param {number} intentosRestantes - Intentos de cobro restantes
     * @returns {Promise<Object>} Resultado del envío
     */
    static async enviarFalloPago(suscripcion, pago, razonFallo, intentosRestantes = 2) {
        try {
            const email = this._obtenerEmail(suscripcion);
            const nombre = this._obtenerNombre(suscripcion);

            if (!email) {
                logger.warn(`No se pudo enviar fallo de pago: email no disponible para suscripción ${suscripcion.id}`);
                return { success: false, reason: 'email_no_disponible' };
            }

            logger.info(`Enviando notificación de fallo de pago a ${email}`, {
                suscripcion_id: suscripcion.id,
                pago_id: pago?.id,
                razon: razonFallo
            });

            const urlActualizar = `${FRONTEND_URL}/mi-plan`;

            const htmlContent = templates.generatePagoFallidoEmail({
                nombre,
                planNombre: suscripcion.plan_nombre,
                monto: parseFloat(pago?.monto || suscripcion.precio_actual),
                moneda: suscripcion.moneda || 'MXN',
                razonFallo,
                urlActualizar,
                intentosRestantes
            });

            const textContent = templates.generatePagoFallidoText({
                nombre,
                planNombre: suscripcion.plan_nombre,
                monto: parseFloat(pago?.monto || suscripcion.precio_actual),
                moneda: suscripcion.moneda || 'MXN',
                razonFallo,
                urlActualizar,
                intentosRestantes
            });

            return await emailService.enviarEmail({
                to: email,
                subject: 'Pago fallido - Acción requerida',
                html: htmlContent,
                text: textContent
            });

        } catch (error) {
            logger.error('Error enviando notificación de fallo', { error: error.message, suscripcion_id: suscripcion.id });
            return { success: false, error: error.message };
        }
    }

    /**
     * Enviar recordatorio de próximo cobro (3 días antes)
     *
     * @param {Object} suscripcion - Suscripción
     * @param {number} diasRestantes - Días hasta el cobro
     * @returns {Promise<Object>} Resultado del envío
     */
    static async enviarRecordatorioCobro(suscripcion, diasRestantes = 3) {
        try {
            const email = this._obtenerEmail(suscripcion);
            const nombre = this._obtenerNombre(suscripcion);

            if (!email) {
                logger.warn(`No se pudo enviar recordatorio: email no disponible para suscripción ${suscripcion.id}`);
                return { success: false, reason: 'email_no_disponible' };
            }

            logger.info(`Enviando recordatorio de cobro a ${email}`, {
                suscripcion_id: suscripcion.id,
                fecha_cobro: suscripcion.fecha_proximo_cobro,
                dias_restantes: diasRestantes
            });

            const htmlContent = templates.generateRecordatorioCobroEmail({
                nombre,
                planNombre: suscripcion.plan_nombre,
                monto: parseFloat(suscripcion.precio_actual),
                moneda: suscripcion.moneda || 'MXN',
                fechaCobro: suscripcion.fecha_proximo_cobro,
                diasRestantes
            });

            const textContent = templates.generateRecordatorioCobroText({
                nombre,
                planNombre: suscripcion.plan_nombre,
                monto: parseFloat(suscripcion.precio_actual),
                moneda: suscripcion.moneda || 'MXN',
                fechaCobro: suscripcion.fecha_proximo_cobro,
                diasRestantes
            });

            return await emailService.enviarEmail({
                to: email,
                subject: `Recordatorio - Próximo cobro de suscripción`,
                html: htmlContent,
                text: textContent
            });

        } catch (error) {
            logger.error('Error enviando recordatorio', { error: error.message, suscripcion_id: suscripcion.id });
            return { success: false, error: error.message };
        }
    }

    /**
     * Enviar notificación de entrada a grace period
     *
     * @param {Object} suscripcion - Suscripción en grace period
     * @returns {Promise<Object>} Resultado del envío
     */
    static async enviarGracePeriod(suscripcion) {
        try {
            const email = this._obtenerEmail(suscripcion);
            const nombre = this._obtenerNombre(suscripcion);

            if (!email) {
                logger.warn(`No se pudo enviar grace period: email no disponible para suscripción ${suscripcion.id}`);
                return { success: false, reason: 'email_no_disponible' };
            }

            logger.info(`Enviando notificación de grace period a ${email}`, {
                suscripcion_id: suscripcion.id
            });

            // Calcular días de gracia desde la fecha_gracia
            const { GRACE_PERIOD_DAYS } = require('../../../config/constants');
            const fechaLimite = suscripcion.fecha_gracia || new Date(Date.now() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);

            const urlRenovar = `${FRONTEND_URL}/mi-plan`;

            const htmlContent = templates.generateGracePeriodEmail({
                nombre,
                planNombre: suscripcion.plan_nombre,
                diasGracia: GRACE_PERIOD_DAYS,
                fechaLimite,
                urlRenovar
            });

            const textContent = templates.generateGracePeriodText({
                nombre,
                planNombre: suscripcion.plan_nombre,
                diasGracia: GRACE_PERIOD_DAYS,
                fechaLimite,
                urlRenovar
            });

            return await emailService.enviarEmail({
                to: email,
                subject: 'Período de gracia - Acción urgente',
                html: htmlContent,
                text: textContent
            });

        } catch (error) {
            logger.error('Error enviando grace period', { error: error.message, suscripcion_id: suscripcion.id });
            return { success: false, error: error.message };
        }
    }

    /**
     * Enviar notificación de suspensión
     *
     * @param {Object} suscripcion - Suscripción suspendida
     * @returns {Promise<Object>} Resultado del envío
     */
    static async enviarSuspension(suscripcion) {
        try {
            const email = this._obtenerEmail(suscripcion);
            const nombre = this._obtenerNombre(suscripcion);

            if (!email) {
                logger.warn(`No se pudo enviar suspensión: email no disponible para suscripción ${suscripcion.id}`);
                return { success: false, reason: 'email_no_disponible' };
            }

            logger.info(`Enviando notificación de suspensión a ${email}`, {
                suscripcion_id: suscripcion.id
            });

            const urlReactivar = `${FRONTEND_URL}/planes`;

            const htmlContent = templates.generateSuspensionEmail({
                nombre,
                planNombre: suscripcion.plan_nombre,
                fechaSuspension: new Date(),
                diasConservacion: 30,
                urlReactivar
            });

            const textContent = templates.generateSuspensionText({
                nombre,
                planNombre: suscripcion.plan_nombre,
                fechaSuspension: new Date(),
                diasConservacion: 30,
                urlReactivar
            });

            return await emailService.enviarEmail({
                to: email,
                subject: 'Cuenta suspendida - Acción urgente',
                html: htmlContent,
                text: textContent
            });

        } catch (error) {
            logger.error('Error enviando suspensión', { error: error.message, suscripcion_id: suscripcion.id });
            return { success: false, error: error.message };
        }
    }

    /**
     * Enviar confirmación de cancelación
     *
     * @param {Object} suscripcion - Suscripción cancelada
     * @param {string} motivoCancelacion - Motivo proporcionado por el usuario
     * @returns {Promise<Object>} Resultado del envío
     */
    static async enviarCancelacion(suscripcion, motivoCancelacion = null) {
        try {
            const email = this._obtenerEmail(suscripcion);
            const nombre = this._obtenerNombre(suscripcion);

            if (!email) {
                logger.warn(`No se pudo enviar cancelación: email no disponible para suscripción ${suscripcion.id}`);
                return { success: false, reason: 'email_no_disponible' };
            }

            logger.info(`Enviando confirmación de cancelación a ${email}`, {
                suscripcion_id: suscripcion.id
            });

            const urlReactivar = `${FRONTEND_URL}/planes`;

            const htmlContent = templates.generateCancelacionEmail({
                nombre,
                planNombre: suscripcion.plan_nombre,
                fechaCancelacion: new Date(),
                fechaAccesoHasta: suscripcion.fecha_proximo_cobro || suscripcion.fecha_fin,
                motivoCancelacion: motivoCancelacion || suscripcion.razon_cancelacion,
                urlReactivar
            });

            const textContent = templates.generateCancelacionText({
                nombre,
                planNombre: suscripcion.plan_nombre,
                fechaCancelacion: new Date(),
                fechaAccesoHasta: suscripcion.fecha_proximo_cobro || suscripcion.fecha_fin,
                motivoCancelacion: motivoCancelacion || suscripcion.razon_cancelacion,
                urlReactivar
            });

            return await emailService.enviarEmail({
                to: email,
                subject: 'Suscripción cancelada',
                html: htmlContent,
                text: textContent
            });

        } catch (error) {
            logger.error('Error enviando cancelación', { error: error.message, suscripcion_id: suscripcion.id });
            return { success: false, error: error.message };
        }
    }

    /**
     * Enviar notificación de fin de trial
     *
     * @param {Object} suscripcion - Suscripción en trial
     * @returns {Promise<Object>} Resultado del envío
     */
    static async enviarFinTrial(suscripcion) {
        try {
            const email = this._obtenerEmail(suscripcion);
            const nombre = this._obtenerNombre(suscripcion);

            if (!email) {
                logger.warn(`No se pudo enviar fin de trial: email no disponible para suscripción ${suscripcion.id}`);
                return { success: false, reason: 'email_no_disponible' };
            }

            logger.info(`Enviando notificación de fin de trial a ${email}`, {
                suscripcion_id: suscripcion.id,
                fecha_fin_trial: suscripcion.fecha_fin_trial
            });

            // Reutilizamos el template de recordatorio pero con mensaje adaptado
            const diasRestantes = Math.max(0, Math.ceil(
                (new Date(suscripcion.fecha_fin_trial) - new Date()) / (1000 * 60 * 60 * 24)
            ));

            const htmlContent = templates.generateRecordatorioCobroEmail({
                nombre,
                planNombre: suscripcion.plan_nombre + ' (Prueba)',
                monto: parseFloat(suscripcion.precio_actual),
                moneda: suscripcion.moneda || 'MXN',
                fechaCobro: suscripcion.fecha_fin_trial,
                diasRestantes
            });

            const textContent = templates.generateRecordatorioCobroText({
                nombre,
                planNombre: suscripcion.plan_nombre + ' (Prueba)',
                monto: parseFloat(suscripcion.precio_actual),
                moneda: suscripcion.moneda || 'MXN',
                fechaCobro: suscripcion.fecha_fin_trial,
                diasRestantes
            });

            return await emailService.enviarEmail({
                to: email,
                subject: 'Tu período de prueba está por finalizar',
                html: htmlContent,
                text: textContent
            });

        } catch (error) {
            logger.error('Error enviando fin de trial', { error: error.message, suscripcion_id: suscripcion.id });
            return { success: false, error: error.message };
        }
    }

    // ====================================================================
    // MÉTODOS AUXILIARES
    // ====================================================================

    /**
     * Obtener email del suscriptor
     * @private
     */
    static _obtenerEmail(suscripcion) {
        return suscripcion.cliente_email ||
               suscripcion.suscriptor_externo?.email ||
               null;
    }

    /**
     * Obtener nombre del suscriptor
     * @private
     */
    static _obtenerNombre(suscripcion) {
        return suscripcion.cliente_nombre ||
               suscripcion.suscriptor_externo?.nombre ||
               'Cliente';
    }
}

module.exports = NotificacionesSuscripcionesService;
