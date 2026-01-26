/**
 * ====================================================================
 * MODEL - WEBSITE ANALYTICS
 * ====================================================================
 * Modelo para gestionar las metricas y eventos de analytics
 * del sitio web publico.
 *
 * TABLA: website_analytics (definida en sql/website/06-analytics.sql)
 *
 * Fecha creacion: 25 Enero 2026
 */

const RLSContextManager = require('../../../utils/rlsContextManager');
const crypto = require('crypto');

/**
 * Modelo de Analytics del Website
 */
class WebsiteAnalyticsModel {
  /**
   * Tipos de eventos validos
   */
  static TIPOS_EVENTO = [
    'vista_pagina',
    'clic_cta',
    'clic_enlace',
    'formulario_enviado',
    'scroll_50',
    'scroll_100',
    'tiempo_en_pagina',
    'salida',
  ];

  /**
   * Hashear IP para privacidad
   * @param {string} ip - IP original
   * @returns {string} Hash de la IP
   */
  static hashearIP(ip) {
    if (!ip) return null;
    return crypto.createHash('sha256').update(ip + process.env.JWT_SECRET).digest('hex').substring(0, 64);
  }

  /**
   * Detectar tipo de dispositivo desde user-agent
   * @param {string} userAgent - User agent string
   * @returns {string} 'desktop' | 'mobile' | 'tablet'
   */
  static detectarDispositivo(userAgent) {
    if (!userAgent) return 'desktop';
    const ua = userAgent.toLowerCase();
    if (/mobile|android|iphone|ipod/.test(ua)) return 'mobile';
    if (/tablet|ipad/.test(ua)) return 'tablet';
    return 'desktop';
  }

  /**
   * Registrar un evento de analytics
   * @param {Object} datos - Datos del evento
   * @returns {Promise<Object>}
   */
  static async registrarEvento(datos) {
    const {
      website_id,
      organizacion_id,
      evento_tipo,
      pagina_slug,
      bloque_id,
      fuente,
      ip,
      user_agent,
      datos_extra,
    } = datos;

    // Validar tipo de evento
    if (!this.TIPOS_EVENTO.includes(evento_tipo)) {
      throw new Error(`Tipo de evento invalido: ${evento_tipo}`);
    }

    const query = `
      INSERT INTO website_analytics (
        website_id,
        organizacion_id,
        evento_tipo,
        pagina_slug,
        bloque_id,
        fuente,
        ip_hash,
        dispositivo,
        datos_extra
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, evento_tipo, pagina_slug, creado_en
    `;

    const result = await RLSContextManager.withBypass(async (db) => {
      return await db.query(query, [
        website_id,
        organizacion_id,
        evento_tipo,
        pagina_slug || null,
        bloque_id || null,
        fuente || 'directo',
        this.hashearIP(ip),
        this.detectarDispositivo(user_agent),
        datos_extra ? JSON.stringify(datos_extra) : null,
      ]);
    });

    return result.rows[0];
  }

  /**
   * Obtener resumen de analytics para un sitio
   * @param {number} organizacionId - ID de la organizacion
   * @param {Object} filtros - Filtros opcionales
   * @returns {Promise<Object>}
   */
  static async obtenerResumen(organizacionId, filtros = {}) {
    const {
      dias = 30,
      website_id,
    } = filtros;

    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - dias);

    let websiteFilter = '';
    const params = [organizacionId, fechaInicio];

    if (website_id) {
      websiteFilter = 'AND a.website_id = $3';
      params.push(website_id);
    }

    const query = `
      WITH stats AS (
        SELECT
          COUNT(*) FILTER (WHERE evento_tipo = 'vista_pagina') as visitas_totales,
          COUNT(DISTINCT ip_hash) FILTER (WHERE evento_tipo = 'vista_pagina') as visitantes_unicos,
          COUNT(*) FILTER (WHERE evento_tipo = 'clic_cta') as clics_cta,
          COUNT(*) FILTER (WHERE evento_tipo = 'formulario_enviado') as formularios_enviados,
          COUNT(DISTINCT pagina_slug) as paginas_vistas
        FROM website_analytics a
        WHERE a.organizacion_id = $1
          AND a.creado_en >= $2
          ${websiteFilter}
      ),
      por_dispositivo AS (
        SELECT
          dispositivo,
          COUNT(*) as total
        FROM website_analytics a
        WHERE a.organizacion_id = $1
          AND a.creado_en >= $2
          AND evento_tipo = 'vista_pagina'
          ${websiteFilter}
        GROUP BY dispositivo
      ),
      por_fuente AS (
        SELECT
          COALESCE(fuente, 'directo') as fuente,
          COUNT(*) as total
        FROM website_analytics a
        WHERE a.organizacion_id = $1
          AND a.creado_en >= $2
          AND evento_tipo = 'vista_pagina'
          ${websiteFilter}
        GROUP BY fuente
        ORDER BY total DESC
        LIMIT 5
      ),
      tendencia AS (
        SELECT
          DATE(creado_en) as fecha,
          COUNT(*) FILTER (WHERE evento_tipo = 'vista_pagina') as visitas,
          COUNT(DISTINCT ip_hash) as visitantes
        FROM website_analytics a
        WHERE a.organizacion_id = $1
          AND a.creado_en >= $2
          ${websiteFilter}
        GROUP BY DATE(creado_en)
        ORDER BY fecha
      )
      SELECT
        (SELECT row_to_json(stats) FROM stats) as metricas,
        (SELECT COALESCE(json_agg(por_dispositivo), '[]'::json) FROM por_dispositivo) as por_dispositivo,
        (SELECT COALESCE(json_agg(por_fuente), '[]'::json) FROM por_fuente) as por_fuente,
        (SELECT COALESCE(json_agg(tendencia ORDER BY fecha), '[]'::json) FROM tendencia) as tendencia
    `;

    const result = await RLSContextManager.query(organizacionId, async (db) => {
      return await db.query(query, params);
    });

    return result.rows[0];
  }

  /**
   * Obtener paginas mas populares
   * @param {number} organizacionId - ID de la organizacion
   * @param {Object} filtros - Filtros opcionales
   * @returns {Promise<Array>}
   */
  static async obtenerPaginasPopulares(organizacionId, filtros = {}) {
    const {
      dias = 30,
      website_id,
      limite = 10,
    } = filtros;

    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - dias);

    let websiteFilter = '';
    const params = [organizacionId, fechaInicio, limite];

    if (website_id) {
      websiteFilter = 'AND a.website_id = $4';
      params.push(website_id);
    }

    const query = `
      SELECT
        a.pagina_slug,
        p.titulo as pagina_titulo,
        COUNT(*) as visitas,
        COUNT(DISTINCT a.ip_hash) as visitantes_unicos,
        ROUND(AVG(CASE WHEN a.evento_tipo = 'tiempo_en_pagina' AND (a.datos_extra->>'segundos')::int > 0
          THEN (a.datos_extra->>'segundos')::int END), 0) as tiempo_promedio_segundos
      FROM website_analytics a
      LEFT JOIN website_paginas p ON a.pagina_slug = p.slug AND a.website_id = p.website_id
      WHERE a.organizacion_id = $1
        AND a.creado_en >= $2
        AND a.evento_tipo = 'vista_pagina'
        ${websiteFilter}
      GROUP BY a.pagina_slug, p.titulo
      ORDER BY visitas DESC
      LIMIT $3
    `;

    const result = await RLSContextManager.query(organizacionId, async (db) => {
      return await db.query(query, params);
    });

    return result.rows;
  }

  /**
   * Obtener eventos recientes
   * @param {number} organizacionId - ID de la organizacion
   * @param {Object} filtros - Filtros opcionales
   * @returns {Promise<Array>}
   */
  static async obtenerEventosRecientes(organizacionId, filtros = {}) {
    const {
      website_id,
      evento_tipo,
      limite = 50,
      offset = 0,
    } = filtros;

    let whereExtra = '';
    const params = [organizacionId, limite, offset];
    let paramIndex = 4;

    if (website_id) {
      whereExtra += ` AND a.website_id = $${paramIndex++}`;
      params.push(website_id);
    }

    if (evento_tipo) {
      whereExtra += ` AND a.evento_tipo = $${paramIndex++}`;
      params.push(evento_tipo);
    }

    const query = `
      SELECT
        a.id,
        a.evento_tipo,
        a.pagina_slug,
        a.fuente,
        a.dispositivo,
        a.creado_en,
        wc.nombre_sitio,
        wc.slug as sitio_slug
      FROM website_analytics a
      LEFT JOIN website_config wc ON a.website_id = wc.id
      WHERE a.organizacion_id = $1
        ${whereExtra}
      ORDER BY a.creado_en DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await RLSContextManager.query(organizacionId, async (db) => {
      return await db.query(query, params);
    });

    return result.rows;
  }

  /**
   * Obtener metricas en tiempo real (ultimos 5 minutos)
   * @param {number} organizacionId - ID de la organizacion
   * @param {string} websiteId - UUID del sitio (opcional)
   * @returns {Promise<Object>}
   */
  static async obtenerTiempoReal(organizacionId, websiteId = null) {
    let websiteFilter = '';
    const params = [organizacionId];

    if (websiteId) {
      websiteFilter = 'AND website_id = $2';
      params.push(websiteId);
    }

    const query = `
      SELECT
        COUNT(DISTINCT ip_hash) as visitantes_activos,
        COUNT(*) FILTER (WHERE evento_tipo = 'vista_pagina') as paginas_vistas,
        COALESCE(
          json_agg(DISTINCT pagina_slug) FILTER (WHERE pagina_slug IS NOT NULL),
          '[]'::json
        ) as paginas_activas
      FROM website_analytics
      WHERE organizacion_id = $1
        AND creado_en >= NOW() - INTERVAL '5 minutes'
        ${websiteFilter}
    `;

    const result = await RLSContextManager.query(organizacionId, async (db) => {
      return await db.query(query, params);
    });

    return result.rows[0];
  }
}

module.exports = WebsiteAnalyticsModel;
