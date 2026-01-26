/**
 * ====================================================================
 * WEBSITE PREVIEW SERVICE
 * ====================================================================
 * Servicio para gestionar tokens de preview temporal de sitios web.
 * Permite ver sitios no publicados sin autenticacion.
 */

const { pool } = require('../../../config/database');
const RLSContextManager = require('../../../utils/rlsContextManager');

/**
 * Servicio de preview
 */
class WebsitePreviewService {
  /**
   * Genera un nuevo token de preview para un sitio
   * @param {string} websiteId - UUID del sitio
   * @param {number} duracionHoras - Duracion en horas (default 1)
   * @returns {Promise<Object>} Token y datos del preview
   */
  static async generarToken(websiteId, duracionHoras = 1) {
    const result = await pool.query(
      `SELECT website_generar_preview_token($1, $2) as token`,
      [websiteId, duracionHoras]
    );

    const token = result.rows[0]?.token;

    if (!token) {
      throw new Error('No se pudo generar el token de preview');
    }

    // Obtener fecha de expiracion
    const { rows: [config] } = await pool.query(
      `SELECT preview_expira_en FROM website_config WHERE id = $1`,
      [websiteId]
    );

    return {
      token,
      expira_en: config?.preview_expira_en,
      url: `/preview/${token}`,
    };
  }

  /**
   * Valida un token de preview
   * @param {string} token - Token a validar
   * @returns {Promise<string|null>} website_id si valido, null si no
   */
  static async validarToken(token) {
    const result = await pool.query(
      `SELECT website_validar_preview_token($1) as website_id`,
      [token]
    );

    return result.rows[0]?.website_id || null;
  }

  /**
   * Revoca el token de preview de un sitio
   * @param {string} websiteId - UUID del sitio
   * @returns {Promise<boolean>}
   */
  static async revocarToken(websiteId) {
    const result = await pool.query(
      `SELECT website_revocar_preview_token($1) as revocado`,
      [websiteId]
    );

    return result.rows[0]?.revocado || false;
  }

  /**
   * Obtiene el sitio completo para preview
   * @param {string} websiteId - UUID del sitio
   * @returns {Promise<Object>} Sitio completo con paginas y bloques
   */
  static async obtenerSitioParaPreview(websiteId) {
    // Obtener config
    const { rows: [config] } = await pool.query(
      `SELECT * FROM website_config WHERE id = $1`,
      [websiteId]
    );

    if (!config) {
      return null;
    }

    // Obtener paginas con bloques
    const { rows: paginas } = await pool.query(
      `SELECT wp.*,
              COALESCE(
                (SELECT json_agg(wb ORDER BY wb.orden)
                 FROM website_bloques wb
                 WHERE wb.pagina_id = wp.id AND wb.visible = true),
                '[]'
              ) as bloques
       FROM website_paginas wp
       WHERE wp.website_id = $1
       ORDER BY wp.orden`,
      [websiteId]
    );

    return {
      config: {
        id: config.id,
        slug: config.slug,
        nombre_sitio: config.nombre_sitio,
        descripcion_seo: config.descripcion_seo,
        keywords_seo: config.keywords_seo,
        favicon_url: config.favicon_url,
        logo_url: config.logo_url,
        logo_alt: config.logo_alt,
        color_primario: config.color_primario,
        color_secundario: config.color_secundario,
        color_acento: config.color_acento,
        color_texto: config.color_texto,
        color_fondo: config.color_fondo,
        fuente_titulos: config.fuente_titulos,
        fuente_cuerpo: config.fuente_cuerpo,
        redes_sociales: config.redes_sociales,
        publicado: config.publicado,
      },
      paginas,
      es_preview: true,
    };
  }

  /**
   * Obtiene informacion del preview activo de un sitio
   * @param {string} websiteId - UUID del sitio
   * @param {number} orgId - ID de organizacion
   * @returns {Promise<Object|null>}
   */
  static async obtenerInfoPreview(websiteId, orgId) {
    return await RLSContextManager.query(orgId, async (db) => {
      const { rows: [info] } = await db.query(
        `SELECT
           preview_token,
           preview_expira_en,
           CASE
             WHEN preview_token IS NOT NULL AND preview_expira_en > NOW()
             THEN true
             ELSE false
           END as preview_activo
         FROM website_config
         WHERE id = $1`,
        [websiteId]
      );

      if (!info || !info.preview_activo) {
        return null;
      }

      return {
        token: info.preview_token,
        expira_en: info.preview_expira_en,
        url: `/preview/${info.preview_token}`,
        activo: true,
      };
    });
  }
}

module.exports = WebsitePreviewService;
