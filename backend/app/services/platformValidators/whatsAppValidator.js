/**
 * ====================================================================
 * ✅ WHATSAPP VALIDATOR - VALIDACIÓN DE CREDENCIALES WHATSAPP
 * ====================================================================
 *
 * Servicio para validar credenciales de WhatsApp Business Cloud API (Oficial Meta).
 * Verifica que las credenciales sean válidas y obtiene información
 * de la cuenta.
 *
 * 📋 VALIDACIONES:
 * • Formato de API key y phone number ID
 * • Credenciales válidas en WhatsApp Business API
 * • Número de teléfono activo y verificado
 * • Información de la cuenta
 *
 * 🔗 DOCUMENTACIÓN WHATSAPP BUSINESS CLOUD API:
 * https://developers.facebook.com/docs/whatsapp/cloud-api
 *
 * @module services/platformValidators/whatsAppValidator
 */

const axios = require('axios');
const logger = require('../../utils/logger');
const SecureRandom = require('../../utils/helpers/SecureRandom');

class WhatsAppValidator {
    /**
     * ====================================================================
     * ✅ VALIDAR CREDENCIALES COMPLETAS
     * ====================================================================
     * Valida credenciales de WhatsApp Business Cloud API
     *
     * @param {Object} config - Configuración de WhatsApp
     * @param {string} config.api_key - Access token de WhatsApp Business
     * @param {string} config.phone_number_id - ID del número de teléfono
     * @param {string} config.business_account_id - ID de la cuenta de negocio (opcional)
     * @returns {Promise<Object>} Resultado de validación
     * {
     *   valido: boolean,
     *   bot_info: { phone_number_id, display_phone_number, quality_rating, ... },
     *   error: string (solo si valido = false)
     * }
     */
    static async validar(config) {
        try {
            // ════════════════════════════════════════════════════════════════
            // PASO 1: VALIDAR CAMPOS REQUERIDOS
            // ════════════════════════════════════════════════════════════════
            if (!config || typeof config !== 'object') {
                return {
                    valido: false,
                    error: 'La configuración es requerida y debe ser un objeto'
                };
            }

            if (!config.api_key) {
                return {
                    valido: false,
                    error: 'El campo api_key es obligatorio'
                };
            }

            if (!config.phone_number_id) {
                return {
                    valido: false,
                    error: 'El campo phone_number_id es obligatorio'
                };
            }

            // Validar formato básico
            if (typeof config.api_key !== 'string' || config.api_key.length < 10) {
                return {
                    valido: false,
                    error: 'El api_key debe ser un string válido de al menos 10 caracteres'
                };
            }

            if (typeof config.phone_number_id !== 'string') {
                return {
                    valido: false,
                    error: 'El phone_number_id debe ser un string'
                };
            }

            // ════════════════════════════════════════════════════════════════
            // SKIP VALIDACIÓN EN DESARROLLO (si está configurado)
            // ════════════════════════════════════════════════════════════════
            if (process.env.SKIP_WHATSAPP_VALIDATION === 'true') {
                logger.warn('⚠️ SKIP_WHATSAPP_VALIDATION activado - No se validó con WhatsApp Business API');

                return {
                    valido: true,
                    bot_info: {
                        phone_number_id: config.phone_number_id,
                        display_phone_number: '+1234567890',
                        verified_name: 'Development WhatsApp',
                        quality_rating: 'GREEN',
                        code_verification_status: 'VERIFIED'
                    }
                };
            }

            // ════════════════════════════════════════════════════════════════
            // PASO 2: VALIDAR CON WHATSAPP BUSINESS CLOUD API
            // ════════════════════════════════════════════════════════════════
            const phoneInfo = await this.obtenerInfoNumero(config.api_key, config.phone_number_id);

            if (!phoneInfo) {
                return {
                    valido: false,
                    error: 'Credenciales inválidas o número de teléfono no accesible'
                };
            }

            // ════════════════════════════════════════════════════════════════
            // PASO 3: VALIDAR ESTADO DEL NÚMERO
            // ════════════════════════════════════════════════════════════════
            if (phoneInfo.code_verification_status !== 'VERIFIED') {
                return {
                    valido: false,
                    error: `Número no verificado. Estado: ${phoneInfo.code_verification_status}`
                };
            }

            // ════════════════════════════════════════════════════════════════
            // CREDENCIALES VÁLIDAS ✅
            // ════════════════════════════════════════════════════════════════
            logger.info(`Credenciales de WhatsApp validadas: ${phoneInfo.display_phone_number}`);

            return {
                valido: true,
                bot_info: {
                    phone_number_id: phoneInfo.id,
                    display_phone_number: phoneInfo.display_phone_number,
                    verified_name: phoneInfo.verified_name,
                    quality_rating: phoneInfo.quality_rating,
                    code_verification_status: phoneInfo.code_verification_status
                }
            };
        } catch (error) {
            logger.error('Error al validar credenciales de WhatsApp:', error.message);

            return {
                valido: false,
                error: `Error al validar credenciales: ${error.message}`
            };
        }
    }

    /**
     * ====================================================================
     * 📡 OBTENER INFORMACIÓN DEL NÚMERO DE TELÉFONO
     * ====================================================================
     * Llama a la API de WhatsApp Business para obtener información
     * del número de teléfono
     *
     * @param {string} apiKey - Access token de WhatsApp Business
     * @param {string} phoneNumberId - ID del número de teléfono
     * @returns {Promise<Object|null>} Información del número o null si falla
     */
    static async obtenerInfoNumero(apiKey, phoneNumberId) {
        try {
            // WhatsApp Business Cloud API endpoint
            const url = `https://graph.facebook.com/v18.0/${phoneNumberId}`;

            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                },
                params: {
                    fields: 'id,display_phone_number,verified_name,quality_rating,code_verification_status'
                },
                timeout: 10000, // 10 segundos de timeout
                validateStatus: (status) => status === 200
            });

            // WhatsApp Business Cloud API retorna:
            // {
            //   id: "123456789",
            //   display_phone_number: "+1234567890",
            //   verified_name: "Mi Negocio",
            //   quality_rating: "GREEN",
            //   code_verification_status: "VERIFIED"
            // }
            if (response.data && response.data.id) {
                return response.data;
            }

            logger.warn('Respuesta inesperada de WhatsApp Business API:', response.data);
            return null;
        } catch (error) {
            // Errores comunes:
            // - 401: Token inválido o expirado
            // - 403: Permisos insuficientes
            // - 404: Número de teléfono no encontrado
            // - Network errors: API no disponible

            if (error.response) {
                const status = error.response.status;
                const errorData = error.response.data?.error || {};
                const message = errorData.message || 'Unknown error';

                logger.warn(`WhatsApp Business API error ${status}: ${message}`);

                if (status === 401) {
                    logger.warn('Token inválido o expirado');
                } else if (status === 403) {
                    logger.warn('Permisos insuficientes para acceder a este número');
                } else if (status === 404) {
                    logger.warn('Número de teléfono no encontrado');
                }
            } else if (error.code === 'ECONNABORTED') {
                logger.error('Timeout al conectar con WhatsApp Business API');
            } else {
                logger.error('Error de red al conectar con WhatsApp:', error.message);
            }

            return null;
        }
    }

    /**
     * ====================================================================
     * 🔍 VALIDAR FORMATO DE WEBHOOK VERIFY TOKEN
     * ====================================================================
     * Valida que el webhook verify token tenga un formato aceptable
     *
     * @param {string} verifyToken - Token de verificación del webhook
     * @returns {boolean} true si el formato es válido
     */
    static validarFormatoVerifyToken(verifyToken) {
        // Token debe ser alfanumérico, mínimo 8 caracteres
        if (!verifyToken || typeof verifyToken !== 'string') {
            return false;
        }

        // Entre 8 y 64 caracteres, solo alfanuméricos, guiones y guiones bajos
        const VERIFY_TOKEN_REGEX = /^[A-Za-z0-9_-]{8,64}$/;
        return VERIFY_TOKEN_REGEX.test(verifyToken);
    }

    /**
     * ====================================================================
     * 🎲 GENERAR WEBHOOK VERIFY TOKEN
     * ====================================================================
     * Genera un token de verificación aleatorio para el webhook
     *
     * @returns {string} Token de verificación generado
     */
    static generarVerifyToken() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
        return SecureRandom.string(32, chars);
    }

    /**
     * ====================================================================
     * 📋 VALIDAR CONFIGURACIÓN COMPLETA
     * ====================================================================
     * Valida toda la configuración de WhatsApp incluyendo campos opcionales
     *
     * @param {Object} config - Configuración completa de WhatsApp
     * @returns {Promise<Object>} Resultado de validación
     */
    static async validarConfiguracion(config) {
        // Validar credenciales principales
        const resultado = await this.validar(config);

        if (!resultado.valido) {
            return resultado;
        }

        // Validar webhook verify token si está presente
        if (config.webhook_verify_token) {
            const tokenValido = this.validarFormatoVerifyToken(config.webhook_verify_token);

            if (!tokenValido) {
                return {
                    valido: false,
                    error: 'El webhook_verify_token debe tener entre 8 y 64 caracteres alfanuméricos'
                };
            }
        }

        return resultado;
    }
}

module.exports = WhatsAppValidator;
