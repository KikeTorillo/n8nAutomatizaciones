/**
 * Configuración del transporte de email (SMTP)
 * Soporta múltiples proveedores: Gmail, SendGrid, AWS SES, etc.
 */

const nodemailer = require('nodemailer');
const logger = require('../../utils/logger');

class EmailTransporter {
    constructor() {
        this.transporter = null;
        this.initialized = false;
    }

    /**
     * Inicializa el transporter con la configuración de entorno
     */
    initialize() {
        if (this.initialized) {
            return this.transporter;
        }

        try {
            // Validar que existan las variables de entorno necesarias
            if (!process.env.SMTP_HOST || !process.env.SMTP_PORT) {
                logger.warn('⚠️ Configuración SMTP incompleta. Emails NO se enviarán.');
                logger.warn('Configura SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD en .env');
                return null;
            }

            const config = {
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT, 10),
                secure: process.env.SMTP_PORT === '465', // true para 465, false para otros puertos
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASSWORD
                },
                // Opciones adicionales para mayor compatibilidad
                pool: true, // Usa pool de conexiones
                maxConnections: 5,
                maxMessages: 100,
                rateDelta: 1000, // 1 segundo
                rateLimit: 5 // 5 emails por segundo máximo
            };

            this.transporter = nodemailer.createTransport(config);
            this.initialized = true;

            logger.info(`✅ Email transporter inicializado: ${process.env.SMTP_HOST}`);

            // Verificar conexión (opcional, solo en desarrollo)
            if (process.env.NODE_ENV === 'development') {
                this.verifyConnection();
            }

            return this.transporter;
        } catch (error) {
            logger.error(`❌ Error inicializando email transporter: ${error.message}`);
            return null;
        }
    }

    /**
     * Verifica la conexión SMTP
     */
    async verifyConnection() {
        try {
            if (!this.transporter) {
                return false;
            }

            await this.transporter.verify();
            logger.info('✅ Conexión SMTP verificada correctamente');
            return true;
        } catch (error) {
            logger.error(`❌ Error verificando conexión SMTP: ${error.message}`);
            return false;
        }
    }

    /**
     * Obtiene el transporter (inicializándolo si es necesario)
     */
    getTransporter() {
        if (!this.initialized) {
            return this.initialize();
        }
        return this.transporter;
    }

    /**
     * Cierra el pool de conexiones
     */
    close() {
        if (this.transporter) {
            this.transporter.close();
            this.initialized = false;
            logger.info('📧 Email transporter cerrado');
        }
    }
}

// Exportar instancia singleton
module.exports = new EmailTransporter();
