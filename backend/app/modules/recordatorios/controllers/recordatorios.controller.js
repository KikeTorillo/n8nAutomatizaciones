/**
 * ====================================================================
 * CONTROLLER: RECORDATORIOS
 * ====================================================================
 *
 * Controlador para gestión de configuración de recordatorios y
 * procesamiento de envíos.
 *
 * ENDPOINTS PÚBLICOS (admin):
 * - GET  /configuracion      - Obtener configuración
 * - PUT  /configuracion      - Actualizar configuración
 * - GET  /estadisticas       - Estadísticas de envíos
 * - GET  /historial          - Historial de recordatorios
 *
 * ENDPOINTS INTERNOS (sistema):
 * - POST /procesar           - Procesar batch de recordatorios
 * - POST /test               - Enviar recordatorio de prueba
 *
 * @module modules/recordatorios/controllers/recordatorios.controller
 */

const RecordatoriosModel = require('../models/recordatorios.model');
const RecordatorioService = require('../services/recordatorioService');
const chatbotConfigAdapter = require('../../../services/chatbotConfigAdapter');
const { ResponseHelper } = require('../../../utils/helpers');
const asyncHandler = require('../../../middleware/asyncHandler');
const logger = require('../../../utils/logger');

class RecordatoriosController {

  // ====================================================================
  // CONFIGURACIÓN
  // ====================================================================

  /**
   * GET /api/v1/recordatorios/configuracion
   * Obtener configuración de recordatorios de la organización
   */
  static obtenerConfiguracion = asyncHandler(async (req, res) => {
    const organizacionId = req.tenant.organizacionId;

    let config = await RecordatoriosModel.obtenerConfiguracion(organizacionId);

    // Si no existe, crear configuración por defecto
    if (!config) {
      config = await RecordatoriosModel.crearConfiguracionDefault(organizacionId);
    }

    return ResponseHelper.success(
      res,
      config,
      'Configuración de recordatorios obtenida'
    );
  });

  /**
   * PUT /api/v1/recordatorios/configuracion
   * Actualizar configuración de recordatorios
   */
  static actualizarConfiguracion = asyncHandler(async (req, res) => {
    const organizacionId = req.tenant.organizacionId;
    const datos = req.body;

    // Validar que recordatorio_1_horas > recordatorio_2_horas si ambos activos
    if (datos.recordatorio_1_activo && datos.recordatorio_2_activo) {
      const horas1 = datos.recordatorio_1_horas || 24;
      const horas2 = datos.recordatorio_2_horas || 2;

      if (horas1 <= horas2) {
        return ResponseHelper.error(
          res,
          'El recordatorio principal debe ser más horas antes que el secundario',
          400
        );
      }
    }

    const config = await RecordatoriosModel.actualizarConfiguracion(organizacionId, datos);

    logger.info(`[RecordatoriosController] Configuración actualizada para org ${organizacionId}`);

    return ResponseHelper.success(
      res,
      config,
      'Configuración de recordatorios actualizada'
    );
  });

  // ====================================================================
  // ESTADÍSTICAS E HISTORIAL
  // ====================================================================

  /**
   * GET /api/v1/recordatorios/estadisticas
   * Obtener estadísticas de recordatorios
   */
  static obtenerEstadisticas = asyncHandler(async (req, res) => {
    const organizacionId = req.tenant.organizacionId;
    const { fecha_desde, fecha_hasta } = req.query;

    const filtros = {};
    if (fecha_desde) filtros.fecha_desde = new Date(fecha_desde);
    if (fecha_hasta) filtros.fecha_hasta = new Date(fecha_hasta);

    const estadisticas = await RecordatoriosModel.obtenerEstadisticas(organizacionId, filtros);

    return ResponseHelper.success(
      res,
      estadisticas,
      'Estadísticas de recordatorios obtenidas'
    );
  });

  /**
   * GET /api/v1/recordatorios/historial
   * Obtener historial de recordatorios
   */
  static obtenerHistorial = asyncHandler(async (req, res) => {
    const organizacionId = req.tenant.organizacionId;
    const { cita_id } = req.query;

    if (!cita_id) {
      return ResponseHelper.error(res, 'cita_id es requerido', 400);
    }

    const historial = await RecordatoriosModel.obtenerPorCita(organizacionId, parseInt(cita_id));

    return ResponseHelper.success(
      res,
      historial,
      'Historial de recordatorios obtenido'
    );
  });

  // ====================================================================
  // PROCESAMIENTO (INTERNO)
  // ====================================================================

  /**
   * POST /internal/recordatorios/procesar
   * Endpoint interno para procesar batch de recordatorios
   * Llamado por pg_cron o scheduler externo
   */
  static procesarBatch = asyncHandler(async (req, res) => {
    const { limite } = req.body;

    logger.info('[RecordatoriosController] Iniciando procesamiento de batch');

    const resultado = await RecordatorioService.procesarBatch(limite || 100);

    return ResponseHelper.success(
      res,
      resultado,
      `Batch procesado: ${resultado.exitosos} exitosos, ${resultado.fallidos} fallidos`
    );
  });

  /**
   * POST /api/v1/recordatorios/test
   * Enviar recordatorio de prueba
   * Solo para testing y verificación de configuración
   */
  static enviarPrueba = asyncHandler(async (req, res) => {
    const organizacionId = req.tenant.organizacionId;
    const { telefono, mensaje } = req.body;

    if (!telefono) {
      return ResponseHelper.error(res, 'Teléfono es requerido', 400);
    }

    // Obtener configuración del chatbot para saber qué plataforma usar (via adapter)
    const chatbots = await chatbotConfigAdapter.listarChatbotsActivos(organizacionId);

    if (chatbots.length === 0) {
      return ResponseHelper.error(
        res,
        'No hay chatbot configurado y activo. Configure un chatbot primero.',
        400
      );
    }

    const chatbot = chatbots[0];
    let config = await RecordatoriosModel.obtenerConfiguracion(organizacionId);

    // Crear configuración por defecto si no existe
    if (!config) {
      config = await RecordatoriosModel.crearConfiguracionDefault(organizacionId);
    }

    // Plantilla por defecto si no hay
    const plantilla = config?.plantilla_mensaje ||
      '¡Hola {{cliente_nombre}}! Te recordamos tu cita en {{negocio_nombre}} para {{fecha}} a las {{hora}}. Servicios: {{servicios}}. ¿Confirmas tu asistencia?';

    // Construir mensaje de prueba
    const mensajePrueba = mensaje || plantilla
      .replace(/\{\{cliente_nombre\}\}/g, 'Cliente de Prueba')
      .replace(/\{\{negocio_nombre\}\}/g, 'Tu Negocio')
      .replace(/\{\{fecha\}\}/g, 'mañana')
      .replace(/\{\{hora\}\}/g, '10:00')
      .replace(/\{\{servicios\}\}/g, 'Servicio de Prueba')
      .replace(/\{\{precio\}\}/g, '100.00')
      .replace(/\{\{profesional_nombre\}\}/g, 'Profesional de Prueba');

    try {
      const credentials = typeof chatbot.config_plataforma === 'string'
        ? JSON.parse(chatbot.config_plataforma)
        : chatbot.config_plataforma;

      let resultado;

      if (chatbot.plataforma === 'telegram') {
        const TelegramService = require('../services/telegramService');
        resultado = await TelegramService.enviarMensaje(
          credentials.bot_token,
          telefono,
          mensajePrueba
        );
      } else if (chatbot.plataforma === 'whatsapp' || chatbot.plataforma === 'whatsapp_oficial') {
        const WhatsAppService = require('../services/whatsappService');
        resultado = await WhatsAppService.enviarMensaje(
          credentials,
          telefono,
          mensajePrueba
        );
      } else {
        return ResponseHelper.error(res, `Plataforma ${chatbot.plataforma} no soportada`, 400);
      }

      logger.info(`[RecordatoriosController] Mensaje de prueba enviado a ${telefono}`);

      return ResponseHelper.success(
        res,
        {
          enviado: true,
          plataforma: chatbot.plataforma,
          telefono,
          mensaje_id: resultado.message_id
        },
        'Mensaje de prueba enviado exitosamente'
      );

    } catch (error) {
      logger.error('[RecordatoriosController] Error enviando prueba:', error);

      return ResponseHelper.error(
        res,
        `Error al enviar mensaje: ${error.message}`,
        500
      );
    }
  });
}

module.exports = RecordatoriosController;
