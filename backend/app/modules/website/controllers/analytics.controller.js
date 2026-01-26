/**
 * ====================================================================
 * CONTROLLER - WEBSITE ANALYTICS
 * ====================================================================
 * Controlador para endpoints de analytics del sitio web.
 *
 * ENDPOINTS:
 * - POST /api/v1/public/sitio/:slug/track (publico)
 * - GET  /api/v1/website/analytics (privado)
 * - GET  /api/v1/website/analytics/resumen (privado)
 * - GET  /api/v1/website/analytics/paginas (privado)
 * - GET  /api/v1/website/analytics/tiempo-real (privado)
 *
 * Fecha creacion: 25 Enero 2026
 */

const WebsiteAnalyticsModel = require('../models/analytics.model');
const WebsiteConfigModel = require('../models/config.model');
const asyncHandler = require('../../../middleware/asyncHandler');
const logger = require('../../../utils/logger');

/**
 * Controller de Analytics
 */
const WebsiteAnalyticsController = {
  /**
   * POST /api/v1/public/sitio/:slug/track
   * Registrar evento de analytics (publico, fire-and-forget)
   * @public Sin autenticacion
   */
  registrarEvento: asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const {
      evento_tipo,
      pagina_slug,
      bloque_id,
      fuente,
      datos_extra,
    } = req.body;

    // Obtener sitio por slug (sin RLS porque es publico)
    const sitio = await WebsiteConfigModel.obtenerPorSlug(slug);

    if (!sitio) {
      // Fire-and-forget: no revelar si el sitio existe
      return res.status(204).send();
    }

    // Validar tipo de evento
    if (!WebsiteAnalyticsModel.TIPOS_EVENTO.includes(evento_tipo)) {
      return res.status(204).send(); // Silencioso para evitar info leaking
    }

    try {
      // Registrar evento de forma asincrona (no bloqueante)
      setImmediate(async () => {
        try {
          await WebsiteAnalyticsModel.registrarEvento({
            website_id: sitio.id,
            organizacion_id: sitio.organizacion_id,
            evento_tipo,
            pagina_slug,
            bloque_id,
            fuente: fuente || req.get('Referer') || 'directo',
            ip: req.ip || req.connection?.remoteAddress,
            user_agent: req.get('User-Agent'),
            datos_extra,
          });
        } catch (error) {
          logger.warn('[Analytics] Error registrando evento:', error.message);
        }
      });

      // Respuesta inmediata
      res.status(204).send();
    } catch (error) {
      // Nunca fallar en tracking publico
      logger.warn('[Analytics] Error en track:', error.message);
      res.status(204).send();
    }
  }),

  /**
   * GET /api/v1/website/analytics
   * Obtener eventos recientes
   * @requires auth
   * @requires tenant
   */
  listarEventos: asyncHandler(async (req, res) => {
    const organizacionId = req.user.organizacion_id;
    const {
      website_id,
      evento_tipo,
      limite = 50,
      offset = 0,
    } = req.query;

    const eventos = await WebsiteAnalyticsModel.obtenerEventosRecientes(
      organizacionId,
      {
        website_id,
        evento_tipo,
        limite: parseInt(limite),
        offset: parseInt(offset),
      }
    );

    res.json({
      success: true,
      data: eventos,
    });
  }),

  /**
   * GET /api/v1/website/analytics/resumen
   * Obtener resumen de metricas
   * @requires auth
   * @requires tenant
   */
  obtenerResumen: asyncHandler(async (req, res) => {
    const organizacionId = req.user.organizacion_id;
    const {
      dias = 30,
      website_id,
    } = req.query;

    const resumen = await WebsiteAnalyticsModel.obtenerResumen(
      organizacionId,
      {
        dias: parseInt(dias),
        website_id,
      }
    );

    res.json({
      success: true,
      data: resumen,
    });
  }),

  /**
   * GET /api/v1/website/analytics/paginas
   * Obtener paginas mas populares
   * @requires auth
   * @requires tenant
   */
  obtenerPaginasPopulares: asyncHandler(async (req, res) => {
    const organizacionId = req.user.organizacion_id;
    const {
      dias = 30,
      website_id,
      limite = 10,
    } = req.query;

    const paginas = await WebsiteAnalyticsModel.obtenerPaginasPopulares(
      organizacionId,
      {
        dias: parseInt(dias),
        website_id,
        limite: parseInt(limite),
      }
    );

    res.json({
      success: true,
      data: paginas,
    });
  }),

  /**
   * GET /api/v1/website/analytics/tiempo-real
   * Obtener metricas en tiempo real
   * @requires auth
   * @requires tenant
   */
  obtenerTiempoReal: asyncHandler(async (req, res) => {
    const organizacionId = req.user.organizacion_id;
    const { website_id } = req.query;

    const tiempoReal = await WebsiteAnalyticsModel.obtenerTiempoReal(
      organizacionId,
      website_id
    );

    res.json({
      success: true,
      data: tiempoReal,
    });
  }),
};

module.exports = WebsiteAnalyticsController;
