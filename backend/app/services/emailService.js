/**
 * Servicio de Email - Abstracción para envío de correos
 * Soporta múltiples templates y proveedores SMTP
 */

const transporter = require('./email/transporter');
const logger = require('../utils/logger');
const { generatePasswordResetEmail, generatePasswordResetText } = require('./email/templates/passwordReset');
const { generateInvitacionEmail, generateInvitacionText } = require('./email/templates/invitacionProfesional');
const { generateActivacionEmail, generateActivacionText } = require('./email/templates/activacionCuenta');
const { generateMagicLinkEmail, generateMagicLinkText } = require('./email/templates/magicLink');

class EmailService {
    constructor() {
        this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
        this.emailFrom = process.env.EMAIL_FROM || '"Nexo" <noreply@nexo.app>';
    }

    /**
     * Envía un email de recuperación de contraseña
     * @param {Object} params - Parámetros del email
     * @param {string} params.email - Email del destinatario
     * @param {string} params.nombre - Nombre del usuario
     * @param {string} params.resetToken - Token de recuperación
     * @param {number} [params.expirationHours=1] - Horas de expiración del token
     * @returns {Promise<Object>} Resultado del envío
     */
    async enviarRecuperacionPassword({ email, nombre, resetToken, expirationHours = 1 }) {
        try {
            // Construir URL de reset (incluye /auth/ para coincidir con las rutas del frontend)
            const resetUrl = `${this.frontendUrl}/auth/reset-password/${resetToken}`;

            // Generar contenido del email
            const htmlContent = generatePasswordResetEmail({
                nombre,
                resetUrl,
                expirationHours
            });

            const textContent = generatePasswordResetText({
                nombre,
                resetUrl,
                expirationHours
            });

            // Configuración del email
            const mailOptions = {
                from: this.emailFrom,
                to: email,
                subject: '🔐 Recuperación de Contraseña - Nexo',
                text: textContent, // Versión texto plano (fallback)
                html: htmlContent  // Versión HTML
            };

            // Enviar email
            const result = await this._sendEmail(mailOptions);

            if (result.success) {
                logger.info(`📧 Email de recuperación enviado exitosamente a: ${email}`);
            }

            return result;

        } catch (error) {
            logger.error(`❌ Error enviando email de recuperación a ${email}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Envía un email de invitación a un profesional
     * @param {Object} params - Parámetros del email
     * @param {string} params.email - Email del destinatario
     * @param {string} params.nombre - Nombre del invitado
     * @param {string} params.token - Token de invitación
     * @param {string} params.organizacion_nombre - Nombre de la organización
     * @param {string} [params.profesional_nombre] - Nombre del rol/profesional
     * @param {string} params.expira_en - Fecha de expiración
     * @param {boolean} [params.es_reenvio=false] - Si es un reenvío
     * @returns {Promise<Object>} Resultado del envío
     */
    async enviarInvitacionProfesional({
        email,
        nombre,
        token,
        organizacion_nombre,
        profesional_nombre,
        expira_en,
        es_reenvio = false
    }) {
        try {
            // Construir URL de registro
            const registroUrl = `${this.frontendUrl}/registro-invitacion/${token}`;

            // Generar contenido del email
            const htmlContent = generateInvitacionEmail({
                nombre,
                registroUrl,
                organizacion_nombre,
                profesional_nombre: profesional_nombre || nombre,
                expira_en,
                es_reenvio
            });

            const textContent = generateInvitacionText({
                nombre,
                registroUrl,
                organizacion_nombre,
                profesional_nombre: profesional_nombre || nombre,
                expira_en,
                es_reenvio
            });

            // Configuración del email
            const mailOptions = {
                from: this.emailFrom,
                to: email,
                subject: `👋 ${es_reenvio ? '[Recordatorio] ' : ''}Invitación de ${organizacion_nombre}`,
                text: textContent,
                html: htmlContent
            };

            // Enviar email
            const result = await this._sendEmail(mailOptions);

            if (result.success) {
                logger.info(`📧 Invitación ${es_reenvio ? 'reenviada' : 'enviada'} a: ${email}`);
            }

            return result;

        } catch (error) {
            logger.error(`❌ Error enviando invitación a ${email}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Envía un email de invitación para usuario directo (sin profesional)
     * Dic 2025: Nuevo flujo para usuarios que no están vinculados a profesionales
     * @param {Object} params - Parámetros del email
     * @param {string} params.email - Email del destinatario
     * @param {string} params.nombre - Nombre del usuario
     * @param {string} params.token - Token de invitación
     * @param {string} params.organizacion_nombre - Nombre de la organización
     * @param {string} params.rol - Rol asignado al usuario
     * @param {string} params.expira_en - Fecha de expiración
     * @returns {Promise<Object>} Resultado del envío
     */
    async enviarInvitacionUsuarioDirecto({
        email,
        nombre,
        token,
        organizacion_nombre,
        rol,
        expira_en
    }) {
        try {
            // Construir URL de registro (misma que invitación profesional)
            const registroUrl = `${this.frontendUrl}/registro-invitacion/${token}`;

            // Mapear rol a texto legible
            const rolTexto = {
                'admin': 'Administrador',
                'propietario': 'Propietario',
                'empleado': 'Empleado'
            }[rol] || 'Usuario';

            // Generar contenido del email (reutilizamos template de invitación)
            const htmlContent = generateInvitacionEmail({
                nombre,
                registroUrl,
                organizacion_nombre,
                profesional_nombre: `${nombre} (${rolTexto})`,
                expira_en,
                es_reenvio: false
            });

            const textContent = generateInvitacionText({
                nombre,
                registroUrl,
                organizacion_nombre,
                profesional_nombre: `${nombre} (${rolTexto})`,
                expira_en,
                es_reenvio: false
            });

            // Configuración del email
            const mailOptions = {
                from: this.emailFrom,
                to: email,
                subject: `👋 Invitación para unirte a ${organizacion_nombre}`,
                text: textContent,
                html: htmlContent
            };

            // Enviar email
            const result = await this._sendEmail(mailOptions);

            if (result.success) {
                logger.info(`📧 Invitación de usuario directo enviada a: ${email}`);
            }

            return result;

        } catch (error) {
            logger.error(`❌ Error enviando invitación de usuario directo a ${email}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Envía un email de activación de cuenta
     * @param {Object} params - Parámetros del email
     * @param {string} params.email - Email del destinatario
     * @param {string} params.nombre - Nombre del usuario
     * @param {string} params.token - Token de activación
     * @param {string} params.nombre_negocio - Nombre del negocio registrado
     * @param {string} params.expira_en - Fecha de expiración
     * @param {boolean} [params.es_reenvio=false] - Si es un reenvío
     * @returns {Promise<Object>} Resultado del envío
     */
    async enviarActivacionCuenta({
        email,
        nombre,
        token,
        nombre_negocio,
        expira_en,
        es_reenvio = false
    }) {
        try {
            // Construir URL de activación
            const activacionUrl = `${this.frontendUrl}/activar-cuenta/${token}`;

            // Generar contenido del email
            const htmlContent = generateActivacionEmail({
                nombre,
                activacionUrl,
                nombre_negocio,
                expira_en,
                es_reenvio
            });

            const textContent = generateActivacionText({
                nombre,
                activacionUrl,
                nombre_negocio,
                expira_en,
                es_reenvio
            });

            // Configuración del email
            const mailOptions = {
                from: this.emailFrom,
                to: email,
                subject: `🚀 ${es_reenvio ? '[Recordatorio] ' : ''}Activa tu cuenta - ${nombre_negocio}`,
                text: textContent,
                html: htmlContent
            };

            // Enviar email
            const result = await this._sendEmail(mailOptions);

            if (result.success) {
                logger.info(`📧 Email de activación ${es_reenvio ? 'reenviado' : 'enviado'} a: ${email}`);
            }

            return result;

        } catch (error) {
            logger.error(`❌ Error enviando email de activación a ${email}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Envía un email de magic link para login sin contraseña
     * @param {Object} params - Parámetros del email
     * @param {string} params.email - Email del destinatario
     * @param {string} params.nombre - Nombre del usuario
     * @param {string} params.token - Token del magic link
     * @param {string} params.expira_en - Fecha de expiración
     * @returns {Promise<Object>} Resultado del envío
     */
    async enviarMagicLink({
        email,
        nombre,
        token,
        expira_en
    }) {
        try {
            // Construir URL del magic link
            const magicLinkUrl = `${this.frontendUrl}/auth/magic-link/${token}`;

            // Generar contenido del email
            const htmlContent = generateMagicLinkEmail({
                nombre,
                magicLinkUrl,
                expira_en
            });

            const textContent = generateMagicLinkText({
                nombre,
                magicLinkUrl,
                expira_en
            });

            // Configuración del email
            const mailOptions = {
                from: this.emailFrom,
                to: email,
                subject: '🔐 Inicia sesión en Nexo',
                text: textContent,
                html: htmlContent
            };

            // Enviar email
            const result = await this._sendEmail(mailOptions);

            if (result.success) {
                logger.info(`📧 Magic link enviado a: ${email}`);
            }

            return result;

        } catch (error) {
            logger.error(`❌ Error enviando magic link a ${email}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Envía un email genérico (método interno)
     * @param {Object} mailOptions - Opciones del email (nodemailer format)
     * @returns {Promise<Object>} Resultado del envío
     * @private
     */
    async _sendEmail(mailOptions) {
        try {
            // Obtener transporter
            const emailTransporter = transporter.getTransporter();

            // Si no hay transporter configurado, loguear advertencia
            if (!emailTransporter) {
                logger.warn('⚠️ Email NO enviado: transporter no configurado');
                logger.warn(`📩 Email que se hubiera enviado a: ${mailOptions.to}`);
                logger.warn(`📝 Asunto: ${mailOptions.subject}`);

                // En desarrollo/testing, retornar éxito simulado
                if (process.env.NODE_ENV !== 'production') {
                    return {
                        success: true,
                        simulated: true,
                        message: 'Email simulado (SMTP no configurado)'
                    };
                }

                // En producción, lanzar error
                throw new Error('SMTP no configurado - no se puede enviar email');
            }

            // Enviar email real
            const info = await emailTransporter.sendMail(mailOptions);

            return {
                success: true,
                simulated: false,
                messageId: info.messageId,
                accepted: info.accepted,
                rejected: info.rejected,
                response: info.response
            };

        } catch (error) {
            logger.error(`❌ Error en _sendEmail: ${error.message}`);

            // Si estamos en modo testing, no lanzar error
            if (process.env.NODE_ENV === 'test') {
                return {
                    success: false,
                    error: error.message,
                    simulated: true
                };
            }

            throw error;
        }
    }

    /**
     * Verifica la configuración SMTP
     * @returns {Promise<boolean>} True si la configuración es válida
     */
    async verificarConfiguracion() {
        try {
            const emailTransporter = transporter.getTransporter();

            if (!emailTransporter) {
                logger.warn('⚠️ SMTP no configurado');
                return false;
            }

            const isValid = await transporter.verifyConnection();
            return isValid;

        } catch (error) {
            logger.error(`❌ Error verificando configuración SMTP: ${error.message}`);
            return false;
        }
    }

    /**
     * Cierra las conexiones del transporter
     */
    close() {
        transporter.close();
    }
}

// Exportar instancia singleton
module.exports = new EmailService();
