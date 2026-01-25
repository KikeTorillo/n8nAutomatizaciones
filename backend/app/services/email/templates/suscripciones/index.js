/**
 * ====================================================================
 * EMAIL TEMPLATES: SUSCRIPCIONES
 * ====================================================================
 * Templates de email para el módulo de suscripciones.
 *
 * Ene 2026 - Dunning emails y notificaciones transaccionales
 */

const { generatePagoExitosoEmail, generatePagoExitosoText } = require('./pagoExitoso');
const { generatePagoFallidoEmail, generatePagoFallidoText } = require('./pagoFallido');
const { generateRecordatorioCobroEmail, generateRecordatorioCobroText } = require('./recordatorioCobro');
const { generateGracePeriodEmail, generateGracePeriodText } = require('./gracePeriod');
const { generateSuspensionEmail, generateSuspensionText } = require('./suspension');
const { generateCancelacionEmail, generateCancelacionText } = require('./cancelacion');

module.exports = {
    // Pago exitoso
    generatePagoExitosoEmail,
    generatePagoExitosoText,

    // Pago fallido
    generatePagoFallidoEmail,
    generatePagoFallidoText,

    // Recordatorio de cobro (3 días antes)
    generateRecordatorioCobroEmail,
    generateRecordatorioCobroText,

    // Entrada a grace period
    generateGracePeriodEmail,
    generateGracePeriodText,

    // Suspensión de cuenta
    generateSuspensionEmail,
    generateSuspensionText,

    // Cancelación de suscripción
    generateCancelacionEmail,
    generateCancelacionText
};
