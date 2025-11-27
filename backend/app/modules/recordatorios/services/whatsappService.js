/**
 * ====================================================================
 * SERVICIO: WHATSAPP
 * ====================================================================
 *
 * Servicio para envío de mensajes via WhatsApp Business Cloud API.
 * Usado por el sistema de recordatorios para enviar notificaciones.
 *
 * DOCUMENTACIÓN:
 * https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages
 *
 * REQUISITOS:
 * - Cuenta de WhatsApp Business
 * - App en Meta for Developers
 * - Phone Number ID
 * - Access Token (permanente o temporal)
 *
 * @module modules/recordatorios/services/whatsappService
 */

const axios = require('axios');
const logger = require('../../../utils/logger');

const WHATSAPP_API_BASE = 'https://graph.facebook.com/v18.0';

class WhatsAppService {

  /**
   * Enviar mensaje de texto via WhatsApp Business Cloud API
   *
   * @param {Object} credentials - Credenciales de WhatsApp
   * @param {string} credentials.phone_number_id - ID del número de WhatsApp Business
   * @param {string} credentials.access_token - Token de acceso de Meta
   * @param {string} telefono - Número de teléfono destino (con código de país)
   * @param {string} mensaje - Texto del mensaje
   * @returns {Promise<Object>} Respuesta de WhatsApp API
   */
  static async enviarMensaje(credentials, telefono, mensaje) {
    const { phone_number_id, access_token } = credentials;

    if (!phone_number_id) {
      throw new Error('Phone Number ID de WhatsApp no proporcionado');
    }

    if (!access_token) {
      throw new Error('Access Token de WhatsApp no proporcionado');
    }

    if (!telefono) {
      throw new Error('Número de teléfono destino no proporcionado');
    }

    if (!mensaje || mensaje.trim() === '') {
      throw new Error('Mensaje vacío');
    }

    // Normalizar teléfono (solo dígitos, con código de país)
    const telefonoNormalizado = this.normalizarTelefono(telefono);

    const url = `${WHATSAPP_API_BASE}/${phone_number_id}/messages`;

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: telefonoNormalizado,
      type: 'text',
      text: {
        preview_url: false,
        body: mensaje
      }
    };

    try {
      logger.info(`[WhatsAppService] Enviando mensaje a ${telefonoNormalizado}`);

      const response = await axios.post(url, payload, {
        timeout: 15000, // 15 segundos (WhatsApp puede ser más lento)
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`
        }
      });

      if (response.data.messages && response.data.messages.length > 0) {
        const messageId = response.data.messages[0].id;
        logger.info(`[WhatsAppService] Mensaje enviado exitosamente. Message ID: ${messageId}`);

        return {
          success: true,
          message_id: messageId,
          to: telefonoNormalizado,
          status: response.data.messages[0].message_status || 'sent'
        };
      }

      throw new Error('Respuesta inesperada de WhatsApp API');

    } catch (error) {
      // Manejar errores específicos de WhatsApp
      if (error.response) {
        const { status, data } = error.response;
        const errorData = data.error || data;

        // Error 400: Solicitud inválida
        if (status === 400) {
          const errorCode = errorData.code;
          const errorMessage = errorData.message || errorData.error_data?.details;

          // Número no registrado en WhatsApp
          if (errorCode === 131030) {
            throw new Error('El número de destino no está registrado en WhatsApp');
          }

          // Template no aprobado (si usamos templates)
          if (errorCode === 132000) {
            throw new Error('El template no está aprobado');
          }

          throw new Error(`Error de WhatsApp (${errorCode}): ${errorMessage}`);
        }

        // Error 401: Token inválido
        if (status === 401) {
          throw new Error('Access Token de WhatsApp inválido o expirado');
        }

        // Error 403: Sin permisos
        if (status === 403) {
          throw new Error('Sin permisos para enviar mensajes desde este número');
        }

        // Error 429: Rate limiting
        if (status === 429) {
          throw new Error('Límite de mensajes excedido. Esperar antes de reintentar');
        }

        // Error 500+: Error del servidor de WhatsApp
        if (status >= 500) {
          throw new Error('Error del servidor de WhatsApp. Reintentar más tarde');
        }

        throw new Error(`Error de WhatsApp (${status}): ${errorData.message || 'Error desconocido'}`);
      }

      // Error de red o timeout
      if (error.code === 'ECONNABORTED') {
        throw new Error('Timeout al conectar con WhatsApp API');
      }

      throw error;
    }
  }

  /**
   * Normalizar número de teléfono para WhatsApp
   * WhatsApp requiere: código de país + número (sin +, sin espacios)
   *
   * @param {string} telefono - Número de teléfono
   * @returns {string} Número normalizado
   */
  static normalizarTelefono(telefono) {
    // Remover todo excepto dígitos
    let normalizado = telefono.replace(/\D/g, '');

    // Si empieza con 0, asumir que es local (México)
    if (normalizado.startsWith('0')) {
      normalizado = '52' + normalizado.substring(1);
    }

    // Si no tiene código de país, agregar México (52)
    if (normalizado.length === 10) {
      normalizado = '52' + normalizado;
    }

    // Si tiene código de país pero sin el formato correcto
    if (normalizado.startsWith('1') && normalizado.length === 11) {
      // Número de USA/Canadá
      // Ya está correcto
    }

    return normalizado;
  }

  /**
   * Enviar mensaje usando template aprobado
   * Los templates son requeridos para iniciar conversaciones (fuera de ventana 24h)
   *
   * @param {Object} credentials - Credenciales de WhatsApp
   * @param {string} telefono - Número de teléfono destino
   * @param {string} templateName - Nombre del template aprobado
   * @param {string} languageCode - Código de idioma (ej: 'es_MX')
   * @param {Array} components - Componentes del template (variables)
   * @returns {Promise<Object>} Respuesta de WhatsApp API
   */
  static async enviarTemplate(credentials, telefono, templateName, languageCode = 'es_MX', components = []) {
    const { phone_number_id, access_token } = credentials;

    const telefonoNormalizado = this.normalizarTelefono(telefono);

    const url = `${WHATSAPP_API_BASE}/${phone_number_id}/messages`;

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: telefonoNormalizado,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode
        },
        components
      }
    };

    try {
      logger.info(`[WhatsAppService] Enviando template "${templateName}" a ${telefonoNormalizado}`);

      const response = await axios.post(url, payload, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`
        }
      });

      if (response.data.messages && response.data.messages.length > 0) {
        const messageId = response.data.messages[0].id;
        logger.info(`[WhatsAppService] Template enviado exitosamente. Message ID: ${messageId}`);

        return {
          success: true,
          message_id: messageId,
          to: telefonoNormalizado,
          template: templateName
        };
      }

      throw new Error('Respuesta inesperada de WhatsApp API');

    } catch (error) {
      logger.error('[WhatsAppService] Error enviando template:', error);
      throw error;
    }
  }

  /**
   * Verificar estado del número de WhatsApp Business
   *
   * @param {Object} credentials - Credenciales de WhatsApp
   * @returns {Promise<Object>} Estado del número
   */
  static async verificarEstado(credentials) {
    const { phone_number_id, access_token } = credentials;

    try {
      const url = `${WHATSAPP_API_BASE}/${phone_number_id}`;

      const response = await axios.get(url, {
        timeout: 5000,
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      });

      return {
        success: true,
        phone_number: response.data.display_phone_number,
        quality_rating: response.data.quality_rating,
        verified_name: response.data.verified_name
      };

    } catch (error) {
      logger.error('[WhatsAppService] Error verificando estado:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = WhatsAppService;
