/**
 * ====================================================================
 * SERVICIO: TELEGRAM
 * ====================================================================
 *
 * Servicio para envío de mensajes via Telegram Bot API.
 * Usado por el sistema de recordatorios para enviar notificaciones.
 *
 * DOCUMENTACIÓN:
 * https://core.telegram.org/bots/api#sendmessage
 *
 * @module modules/recordatorios/services/telegramService
 */

const axios = require('axios');
const logger = require('../../../utils/logger');

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';

class TelegramService {

  /**
   * Enviar mensaje de texto via Telegram
   *
   * @param {string} botToken - Token del bot de Telegram
   * @param {string|number} chatId - ID del chat de destino
   * @param {string} mensaje - Texto del mensaje
   * @param {Object} opciones - Opciones adicionales
   * @param {string} opciones.parse_mode - Modo de parseo ('HTML' o 'Markdown')
   * @param {boolean} opciones.disable_notification - Enviar sin sonido
   * @returns {Promise<Object>} Respuesta de Telegram API
   */
  static async enviarMensaje(botToken, chatId, mensaje, opciones = {}) {
    if (!botToken) {
      throw new Error('Token del bot de Telegram no proporcionado');
    }

    if (!chatId) {
      throw new Error('Chat ID no proporcionado');
    }

    if (!mensaje || mensaje.trim() === '') {
      throw new Error('Mensaje vacío');
    }

    const url = `${TELEGRAM_API_BASE}${botToken}/sendMessage`;

    const payload = {
      chat_id: chatId,
      text: mensaje,
      parse_mode: opciones.parse_mode || 'HTML',
      disable_notification: opciones.disable_notification || false,
      // Proteger enlaces de preview para no saturar
      disable_web_page_preview: true
    };

    try {
      logger.info(`[TelegramService] Enviando mensaje a chat ${chatId}`);

      const response = await axios.post(url, payload, {
        timeout: 10000, // 10 segundos
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.ok) {
        logger.info(`[TelegramService] Mensaje enviado exitosamente. Message ID: ${response.data.result.message_id}`);
        return {
          success: true,
          message_id: response.data.result.message_id,
          chat_id: response.data.result.chat.id,
          date: response.data.result.date
        };
      } else {
        throw new Error(response.data.description || 'Error desconocido de Telegram');
      }

    } catch (error) {
      // Manejar errores específicos de Telegram
      if (error.response) {
        const { status, data } = error.response;

        // Error 400: Chat no encontrado o bloqueado
        if (status === 400) {
          if (data.description?.includes('chat not found')) {
            throw new Error('Chat no encontrado. El usuario puede haber bloqueado el bot.');
          }
          if (data.description?.includes('bot was blocked')) {
            throw new Error('El usuario ha bloqueado el bot.');
          }
          throw new Error(`Error de Telegram: ${data.description}`);
        }

        // Error 401: Token inválido
        if (status === 401) {
          throw new Error('Token del bot inválido o expirado');
        }

        // Error 403: Bot no tiene permisos
        if (status === 403) {
          throw new Error('El bot no tiene permisos para enviar mensajes a este chat');
        }

        // Error 429: Rate limiting
        if (status === 429) {
          const retryAfter = data.parameters?.retry_after || 30;
          throw new Error(`Rate limit excedido. Reintentar en ${retryAfter} segundos`);
        }

        throw new Error(`Error de Telegram (${status}): ${data.description || 'Error desconocido'}`);
      }

      // Error de red o timeout
      if (error.code === 'ECONNABORTED') {
        throw new Error('Timeout al conectar con Telegram API');
      }

      throw error;
    }
  }

  /**
   * Verificar si un chat_id es válido
   *
   * @param {string} botToken - Token del bot
   * @param {string|number} chatId - ID del chat a verificar
   * @returns {Promise<boolean>} True si el chat es válido
   */
  static async verificarChat(botToken, chatId) {
    try {
      const url = `${TELEGRAM_API_BASE}${botToken}/getChat`;

      const response = await axios.post(url, { chat_id: chatId }, {
        timeout: 5000
      });

      return response.data.ok;
    } catch (error) {
      logger.warn(`[TelegramService] Chat ${chatId} no válido:`, error.message);
      return false;
    }
  }

  /**
   * Obtener información del bot
   *
   * @param {string} botToken - Token del bot
   * @returns {Promise<Object>} Información del bot
   */
  static async obtenerInfoBot(botToken) {
    try {
      const url = `${TELEGRAM_API_BASE}${botToken}/getMe`;

      const response = await axios.get(url, { timeout: 5000 });

      if (response.data.ok) {
        return response.data.result;
      }

      throw new Error('No se pudo obtener información del bot');
    } catch (error) {
      logger.error('[TelegramService] Error obteniendo info del bot:', error);
      throw error;
    }
  }
}

module.exports = TelegramService;
