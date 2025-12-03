/**
 * ====================================================================
 * SERVICIO: RECORDATORIOS
 * ====================================================================
 *
 * Servicio principal para el procesamiento y envío de recordatorios
 * de citas. Maneja la lógica de:
 * - Construcción de mensajes personalizados
 * - Inyección en memoria del chat (n8n_chat_histories)
 * - Envío via Telegram o WhatsApp
 * - Registro en historial
 *
 * FLUJO:
 * 1. Job pg_cron o endpoint interno llama a procesarBatch()
 * 2. Obtiene citas pendientes de recordatorio
 * 3. Para cada cita:
 *    a. Construye mensaje personalizado
 *    b. Inyecta en memoria del chat (para contexto IA)
 *    c. Envía mensaje via API de la plataforma
 *    d. Registra en historial
 *    e. Marca cita como recordatorio_enviado = TRUE
 *
 * @module modules/recordatorios/services/recordatorioService
 */

const RecordatoriosModel = require('../models/recordatorios.model');
const TelegramService = require('./telegramService');
const WhatsAppService = require('./whatsappService');
const RLSContextManager = require('../../../utils/rlsContextManager');
const { queryDatabase } = require('../../../config/database');
const logger = require('../../../utils/logger');

class RecordatorioService {

  /**
   * Procesar batch de recordatorios pendientes
   * Este método es llamado por el job de procesamiento (cada 5 min)
   *
   * @param {number} limite - Máximo de recordatorios a procesar
   * @returns {Promise<Object>} Resultado del procesamiento
   */
  static async procesarBatch(limite = 100) {
    const inicio = Date.now();
    const resultados = {
      procesados: 0,
      exitosos: 0,
      fallidos: 0,
      errores: []
    };

    try {
      // Obtener citas pendientes de recordatorio
      const citasPendientes = await RecordatoriosModel.obtenerCitasPendientesRecordatorio(limite);

      logger.info(`[RecordatorioService] Encontradas ${citasPendientes.length} citas pendientes de recordatorio`);

      if (citasPendientes.length === 0) {
        return {
          ...resultados,
          mensaje: 'No hay recordatorios pendientes',
          duracion: Date.now() - inicio
        };
      }

      // Procesar cada cita
      for (const cita of citasPendientes) {
        try {
          await this.procesarRecordatorio(cita);
          resultados.exitosos++;
        } catch (error) {
          resultados.fallidos++;
          resultados.errores.push({
            cita_id: cita.cita_id,
            codigo_cita: cita.codigo_cita,
            error: error.message
          });
          logger.error(`[RecordatorioService] Error procesando cita ${cita.cita_id}:`, error);
        }
        resultados.procesados++;
      }

      // Procesar reintentos de fallidos
      const reintentos = await this.procesarReintentos();
      resultados.reintentos = reintentos;

      const duracion = Date.now() - inicio;
      logger.info(`[RecordatorioService] Batch completado en ${duracion}ms`, resultados);

      return {
        ...resultados,
        duracion
      };

    } catch (error) {
      logger.error('[RecordatorioService] Error en procesarBatch:', error);
      throw error;
    }
  }

  /**
   * Procesar un recordatorio individual
   * @param {Object} cita - Datos de la cita con info del chatbot
   */
  static async procesarRecordatorio(cita) {
    const {
      cita_id,
      codigo_cita,
      organizacion_id,
      cliente_nombre,
      cliente_telefono,
      plataforma,
      config_plataforma
    } = cita;

    logger.info(`[RecordatorioService] Procesando recordatorio para cita ${codigo_cita}`);

    // 1. Construir mensaje personalizado
    const mensaje = this.construirMensaje(cita);

    // 2. Determinar sender (identificador del cliente)
    const sender = this.obtenerSender(cita);

    // 3. Inyectar en memoria del chat (para que el AI tenga contexto)
    await this.inyectarEnMemoriaChat(sender, mensaje);

    // 4. Enviar mensaje via la plataforma
    const credentials = typeof config_plataforma === 'string'
      ? JSON.parse(config_plataforma)
      : config_plataforma;

    let enviado = false;
    let errorMensaje = null;

    try {
      if (plataforma === 'telegram') {
        await TelegramService.enviarMensaje(credentials.bot_token, sender, mensaje);
        enviado = true;
      } else if (plataforma === 'whatsapp' || plataforma === 'whatsapp_oficial') {
        await WhatsAppService.enviarMensaje(credentials, cliente_telefono, mensaje);
        enviado = true;
      } else {
        throw new Error(`Plataforma ${plataforma} no soportada para recordatorios`);
      }
    } catch (error) {
      errorMensaje = error.message;
      logger.error(`[RecordatorioService] Error enviando mensaje:`, error);
    }

    // 5. Registrar en historial
    await RecordatoriosModel.registrarEnvio({
      organizacion_id,
      cita_id,
      numero_recordatorio: 1,
      canal: plataforma,
      sender,
      mensaje_enviado: mensaje,
      estado: enviado ? 'enviado' : 'fallido',
      programado_para: new Date(),
      enviado_en: enviado ? new Date() : null,
      error_mensaje: errorMensaje,
      metadata: {
        codigo_cita,
        cliente_nombre
      }
    });

    // 6. Marcar cita como recordatorio enviado (solo si fue exitoso)
    if (enviado) {
      await RecordatoriosModel.marcarCitaRecordatorioEnviado(organizacion_id, cita_id);
      logger.info(`[RecordatorioService] Recordatorio enviado exitosamente para cita ${codigo_cita}`);
    }

    return { enviado, errorMensaje };
  }

  /**
   * Construir mensaje personalizado con variables
   * @param {Object} cita - Datos de la cita
   * @returns {string} Mensaje formateado
   */
  static construirMensaje(cita) {
    let mensaje = cita.plantilla_mensaje;

    // Formatear fecha
    const fechaObj = new Date(cita.fecha_cita);
    const opcionesFecha = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fechaFormateada = fechaObj.toLocaleDateString('es-MX', opcionesFecha);

    // Formatear hora
    const horaFormateada = cita.hora_inicio.substring(0, 5); // "HH:MM"

    // Formatear precio
    const precioFormateado = cita.precio_total
      ? parseFloat(cita.precio_total).toLocaleString('es-MX', { minimumFractionDigits: 2 })
      : '0.00';

    // Reemplazar variables
    const variables = {
      '{{cliente_nombre}}': cita.cliente_nombre || 'Cliente',
      '{{negocio_nombre}}': cita.negocio_nombre || 'el negocio',
      '{{fecha}}': fechaFormateada,
      '{{hora}}': horaFormateada,
      '{{servicios}}': cita.servicios_nombres || 'Servicio',
      '{{precio}}': precioFormateado,
      '{{profesional_nombre}}': cita.profesional_nombre || 'el profesional',
      '{{codigo_cita}}': cita.codigo_cita || ''
    };

    for (const [variable, valor] of Object.entries(variables)) {
      mensaje = mensaje.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), valor);
    }

    return mensaje;
  }

  /**
   * Obtener sender (identificador del cliente para el chat)
   * @param {Object} cita - Datos de la cita
   * @returns {string} Sender ID
   */
  static obtenerSender(cita) {
    // Para Telegram, usamos el chat_id si está disponible
    // Para WhatsApp, usamos el teléfono normalizado
    if (cita.plataforma === 'telegram') {
      // El chat_id puede venir en config_plataforma o usamos el teléfono
      const config = typeof cita.config_plataforma === 'string'
        ? JSON.parse(cita.config_plataforma)
        : cita.config_plataforma;

      // Buscar chat_id del cliente (si se guardó previamente)
      // Por ahora usamos el teléfono como fallback
      return cita.cliente_telefono.replace(/\D/g, '');
    }

    // Para WhatsApp, siempre es el teléfono
    return cita.cliente_telefono.replace(/\D/g, '');
  }

  /**
   * Inyectar mensaje en la memoria del chat de n8n
   * Esto permite que el AI Agent tenga contexto cuando el cliente responda
   *
   * FORMATO LangChain:
   * {
   *   "type": "ai",
   *   "content": "mensaje del recordatorio",
   *   "additional_kwargs": {},
   *   "tool_calls": [],
   *   "response_metadata": {},
   *   "id": null
   * }
   *
   * @param {string} sender - ID del chat/teléfono
   * @param {string} mensaje - Mensaje del recordatorio
   */
  static async inyectarEnMemoriaChat(sender, mensaje) {
    try {
      // Formato LangChain para mensaje AI
      const mensajeAI = {
        type: 'ai',
        content: mensaje,
        additional_kwargs: {},
        tool_calls: [],
        response_metadata: {
          source: 'recordatorio_automatico',
          timestamp: new Date().toISOString()
        },
        id: null
      };

      // Usar el pool de chat (chat_memories_db) en lugar del pool principal
      await queryDatabase('chat', `
        INSERT INTO n8n_chat_histories (session_id, message)
        VALUES ($1, $2)
      `, [sender, JSON.stringify(mensajeAI)]);

      logger.info(`[RecordatorioService] Mensaje inyectado en memoria del chat para sender: ${sender}`);
    } catch (error) {
      // No fallar el recordatorio si no se puede inyectar en memoria
      logger.warn(`[RecordatorioService] No se pudo inyectar en memoria del chat:`, error.message);
    }
  }

  /**
   * Procesar reintentos de recordatorios fallidos
   * @returns {Promise<Object>} Resultado de reintentos
   */
  static async procesarReintentos() {
    const resultados = {
      procesados: 0,
      exitosos: 0,
      fallidos: 0
    };

    try {
      const fallidos = await RecordatoriosModel.obtenerRecordatoriosFallidos(50);

      for (const recordatorio of fallidos) {
        try {
          // Reintentar envío
          // TODO: Implementar lógica de reintento
          resultados.procesados++;
        } catch (error) {
          resultados.fallidos++;
          logger.error(`[RecordatorioService] Error en reintento:`, error);
        }
      }

      return resultados;
    } catch (error) {
      logger.error('[RecordatorioService] Error procesando reintentos:', error);
      return resultados;
    }
  }

  /**
   * Procesar respuesta de cliente a un recordatorio
   * Llamado cuando el chatbot detecta una confirmación
   *
   * @param {number} organizacionId - ID de la organización
   * @param {number} citaId - ID de la cita
   * @param {string} respuesta - Respuesta del cliente
   * @param {string} tipoRespuesta - 'confirmado' o 'reagendado'
   */
  static async procesarRespuesta(organizacionId, citaId, respuesta, tipoRespuesta = 'confirmado') {
    try {
      await RecordatoriosModel.actualizarEstado(organizacionId, citaId, {
        estado: tipoRespuesta,
        respuesta_cliente: respuesta,
        fecha_respuesta: new Date()
      });

      logger.info(`[RecordatorioService] Respuesta registrada para cita ${citaId}: ${tipoRespuesta}`);
    } catch (error) {
      logger.error(`[RecordatorioService] Error registrando respuesta:`, error);
      throw error;
    }
  }
}

module.exports = RecordatorioService;
