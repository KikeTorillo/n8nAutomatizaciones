/**
 * ====================================================================
 * CONTROLLER - WEBSITE SEO
 * ====================================================================
 * Controlador para endpoints SEO del sitio web.
 *
 * ENDPOINTS PUBLICOS:
 * - GET /api/v1/public/sitio/:slug/sitemap.xml
 * - GET /api/v1/public/sitio/:slug/robots.txt
 *
 * ENDPOINTS PRIVADOS:
 * - GET /api/v1/website/seo/auditoria
 * - GET /api/v1/website/seo/preview-google
 * - GET /api/v1/website/seo/schema
 *
 * Fecha creacion: 25 Enero 2026
 */

const WebsiteSEOService = require('../services/seo.service');
const asyncHandler = require('../../../middleware/asyncHandler');
const logger = require('../../../utils/logger');

/**
 * Controller SEO
 */
const WebsiteSEOController = {
  // ============ ENDPOINTS PUBLICOS ============

  /**
   * GET /api/v1/public/sitio/:slug/sitemap.xml
   * Generar sitemap XML
   * @public Sin autenticacion
   */
  generarSitemap: asyncHandler(async (req, res) => {
    const { slug } = req.params;

    try {
      const baseUrl = `${req.protocol}://${req.get('host')}/sitio/${slug}`;
      const xml = await WebsiteSEOService.generarSitemap(slug, baseUrl);

      res.set('Content-Type', 'application/xml');
      res.send(xml);
    } catch (error) {
      logger.warn(`[SEO] Error generando sitemap para ${slug}:`, error.message);
      res.status(404).send('<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
    }
  }),

  /**
   * GET /api/v1/public/sitio/:slug/robots.txt
   * Generar robots.txt
   * @public Sin autenticacion
   */
  generarRobotsTxt: asyncHandler(async (req, res) => {
    const { slug } = req.params;

    try {
      const baseUrl = `${req.protocol}://${req.get('host')}/sitio/${slug}`;
      const robots = await WebsiteSEOService.generarRobotsTxt(slug, baseUrl);

      res.set('Content-Type', 'text/plain');
      res.send(robots);
    } catch (error) {
      logger.warn(`[SEO] Error generando robots.txt para ${slug}:`, error.message);
      res.set('Content-Type', 'text/plain');
      res.send('User-agent: *\nAllow: /\n');
    }
  }),

  // ============ ENDPOINTS PRIVADOS ============

  /**
   * GET /api/v1/website/seo/auditoria
   * Obtener auditoria SEO
   * @requires auth
   * @requires tenant
   */
  obtenerAuditoria: asyncHandler(async (req, res) => {
    const organizacionId = req.user.organizacion_id;
    const { website_id } = req.query;

    const auditoria = await WebsiteSEOService.auditar(organizacionId, website_id);

    res.json({
      success: true,
      data: auditoria,
    });
  }),

  /**
   * GET /api/v1/website/seo/preview-google
   * Obtener preview de SERP de Google
   * @requires auth
   * @requires tenant
   */
  previewGoogle: asyncHandler(async (req, res) => {
    const organizacionId = req.user.organizacion_id;
    const { website_id } = req.query;

    if (!website_id) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere website_id',
      });
    }

    const preview = await WebsiteSEOService.previewSERP(organizacionId, website_id);

    res.json({
      success: true,
      data: preview,
    });
  }),

  /**
   * GET /api/v1/website/seo/schema
   * Obtener schema markup generado
   * @requires auth
   * @requires tenant
   */
  obtenerSchema: asyncHandler(async (req, res) => {
    const organizacionId = req.user.organizacion_id;
    const { website_id, tipo = 'LocalBusiness' } = req.query;

    if (!website_id) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere website_id',
      });
    }

    const schema = await WebsiteSEOService.generarSchema(organizacionId, website_id, tipo);

    res.json({
      success: true,
      data: schema,
    });
  }),
};

module.exports = WebsiteSEOController;
