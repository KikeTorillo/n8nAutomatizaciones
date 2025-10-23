/**
 * ====================================================================
 * ✅ TELEGRAM VALIDATOR - VALIDACIÓN DE BOT TOKENS
 * ====================================================================
 *
 * Servicio para validar tokens de bots de Telegram usando la API
 * oficial de Telegram. Verifica que el token sea válido y obtiene
 * información del bot.
 *
 * 📋 VALIDACIONES:
 * • Formato del token (regex)
 * • Token válido en Telegram API
 * • Bot accesible y activo
 * • Información del bot (username, nombre)
 *
 * 🔗 DOCUMENTACIÓN TELEGRAM:
 * https://core.telegram.org/bots/api#getme
 *
 * @module services/platformValidators/telegramValidator
 */

const axios = require('axios');
const logger = require('../../utils/logger');

/**
 * Regex para validar formato de token de Telegram
 * Formato: {bot_id}:{hash_alfanumérico}
 * Ejemplo: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz-012345678
 */
const TELEGRAM_TOKEN_REGEX = /^\d{8,10}:[A-Za-z0-9_-]{35}$/;

class TelegramValidator {
    /**
     * ====================================================================
     * ✅ VALIDAR TOKEN COMPLETO
     * ====================================================================
     * Valida un token de bot de Telegram contra la API oficial
     *
     * @param {string} botToken - Token del bot
     * @returns {Promise<Object>} Resultado de validación
     * {
     *   valido: boolean,
     *   bot_info: { id, username, first_name, can_join_groups, ... },
     *   error: string (solo si valido = false)
     * }
     */
    static async validar(botToken) {
        try {
            // ════════════════════════════════════════════════════════════════
            // PASO 1: VALIDAR FORMATO DEL TOKEN
            // ════════════════════════════════════════════════════════════════
            if (!botToken || typeof botToken !== 'string') {
                return {
                    valido: false,
                    error: 'El token es requerido y debe ser un string'
                };
            }

            const formatoValido = this.validarFormato(botToken);

            if (!formatoValido) {
                return {
                    valido: false,
                    error: 'Formato de token inválido. Debe ser: {bot_id}:{hash}'
                };
            }

            // ════════════════════════════════════════════════════════════════
            // PASO 2: VALIDAR TOKEN CON TELEGRAM API
            // ════════════════════════════════════════════════════════════════
            const botInfo = await this.obtenerInfoBot(botToken);

            if (!botInfo) {
                return {
                    valido: false,
                    error: 'Token inválido o bot no accesible en Telegram'
                };
            }

            // ════════════════════════════════════════════════════════════════
            // PASO 3: VALIDAR QUE ES UN BOT
            // ════════════════════════════════════════════════════════════════
            if (!botInfo.is_bot) {
                return {
                    valido: false,
                    error: 'El token no corresponde a un bot de Telegram'
                };
            }

            // ════════════════════════════════════════════════════════════════
            // TOKEN VÁLIDO ✅
            // ════════════════════════════════════════════════════════════════
            logger.info(`Token de Telegram validado: @${botInfo.username}`);

            return {
                valido: true,
                bot_info: {
                    id: botInfo.id,
                    username: botInfo.username,
                    first_name: botInfo.first_name,
                    can_join_groups: botInfo.can_join_groups,
                    can_read_all_group_messages: botInfo.can_read_all_group_messages,
                    supports_inline_queries: botInfo.supports_inline_queries
                }
            };
        } catch (error) {
            logger.error('Error al validar token de Telegram:', error.message);

            return {
                valido: false,
                error: `Error al validar token: ${error.message}`
            };
        }
    }

    /**
     * ====================================================================
     * 🔍 VALIDAR FORMATO DEL TOKEN (REGEX)
     * ====================================================================
     * Valida que el token tenga el formato correcto sin llamar a la API
     *
     * @param {string} botToken - Token a validar
     * @returns {boolean} true si el formato es válido
     */
    static validarFormato(botToken) {
        return TELEGRAM_TOKEN_REGEX.test(botToken);
    }

    /**
     * ====================================================================
     * 📡 OBTENER INFORMACIÓN DEL BOT
     * ====================================================================
     * Llama a la API de Telegram para obtener información del bot
     * usando el método getMe
     *
     * @param {string} botToken - Token del bot
     * @returns {Promise<Object|null>} Información del bot o null si falla
     */
    static async obtenerInfoBot(botToken) {
        try {
            const url = `https://api.telegram.org/bot${botToken}/getMe`;

            const response = await axios.get(url, {
                timeout: 5000, // 5 segundos de timeout
                validateStatus: (status) => status === 200
            });

            // Telegram API retorna:
            // {
            //   ok: true,
            //   result: { id, is_bot, first_name, username, ... }
            // }
            if (response.data.ok && response.data.result) {
                return response.data.result;
            }

            logger.warn('Respuesta inesperada de Telegram API:', response.data);
            return null;
        } catch (error) {
            // Errores comunes:
            // - 401: Token inválido o bot eliminado
            // - 404: Bot no encontrado
            // - Network errors: Telegram API no disponible

            if (error.response) {
                const status = error.response.status;
                const description = error.response.data?.description || 'Unknown error';

                logger.warn(`Telegram API error ${status}: ${description}`);

                if (status === 401) {
                    logger.warn('Token inválido o bot desactivado');
                } else if (status === 404) {
                    logger.warn('Bot no encontrado en Telegram');
                }
            } else if (error.code === 'ECONNABORTED') {
                logger.error('Timeout al conectar con Telegram API');
            } else {
                logger.error('Error de red al conectar con Telegram:', error.message);
            }

            return null;
        }
    }

    /**
     * ====================================================================
     * 🔄 EXTRAER BOT ID DEL TOKEN
     * ====================================================================
     * Extrae el ID del bot desde el token sin llamar a la API
     * Formato token: {bot_id}:{hash}
     *
     * @param {string} botToken - Token del bot
     * @returns {number|null} ID del bot o null si formato inválido
     */
    static extraerBotId(botToken) {
        if (!this.validarFormato(botToken)) {
            return null;
        }

        const parts = botToken.split(':');
        return parseInt(parts[0], 10);
    }

    /**
     * ====================================================================
     * 📋 VALIDAR CONFIGURACIÓN COMPLETA
     * ====================================================================
     * Valida toda la configuración de Telegram incluyendo campos opcionales
     *
     * @param {Object} config - Configuración de Telegram
     * @param {string} config.bot_token - Token del bot (requerido)
     * @param {string} config.bot_username - Username del bot (opcional)
     * @returns {Promise<Object>} Resultado de validación
     */
    static async validarConfiguracion(config) {
        // Validar campo requerido
        if (!config.bot_token) {
            return {
                valido: false,
                error: 'El campo bot_token es obligatorio'
            };
        }

        // Validar token con Telegram API
        const resultado = await this.validar(config.bot_token);

        if (!resultado.valido) {
            return resultado;
        }

        // Si se proporcionó username, verificar que coincida
        if (config.bot_username) {
            const usernameEsperado = config.bot_username.replace('@', '');
            const usernameReal = resultado.bot_info.username;

            if (usernameEsperado !== usernameReal) {
                return {
                    valido: false,
                    error: `El username no coincide. Esperado: @${usernameEsperado}, Real: @${usernameReal}`
                };
            }
        }

        return resultado;
    }
}

module.exports = TelegramValidator;
