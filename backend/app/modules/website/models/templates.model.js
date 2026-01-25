/**
 * ====================================================================
 * WEBSITE TEMPLATES MODEL
 * ====================================================================
 * Modelo para templates prediseñados de sitios web.
 */

const RLSContextManager = require('../../../utils/rlsContextManager');

class WebsiteTemplatesModel {
  /**
   * Lista todos los templates disponibles (públicos + de la organización)
   * @param {number} organizacionId - ID de la organización
   * @param {Object} filtros - Filtros opcionales
   * @returns {Promise<Array>}
   */
  static async listar(organizacionId, filtros = {}) {
    const { industria, solo_destacados } = filtros;

    return RLSContextManager.query(organizacionId, async (db) => {
      let query = `
        SELECT
          id,
          nombre,
          descripcion,
          industria,
          thumbnail_url,
          es_premium,
          es_publico,
          es_destacado,
          organizacion_id,
          veces_usado,
          creado_en
        FROM website_templates
        WHERE (es_publico = true OR organizacion_id = $1)
      `;

      const params = [organizacionId];
      let paramIndex = 2;

      if (industria) {
        query += ` AND industria = $${paramIndex}`;
        params.push(industria);
        paramIndex++;
      }

      if (solo_destacados) {
        query += ` AND es_destacado = true`;
      }

      query += ` ORDER BY es_destacado DESC, veces_usado DESC, nombre ASC`;

      const result = await db.query(query, params);
      return result.rows;
    });
  }

  /**
   * Obtiene un template por ID
   * @param {string} id - UUID del template
   * @param {number} organizacionId - ID de la organización
   * @returns {Promise<Object|null>}
   */
  static async obtenerPorId(id, organizacionId) {
    return RLSContextManager.query(organizacionId, async (db) => {
      const result = await db.query(
        `SELECT *
         FROM website_templates
         WHERE id = $1 AND (es_publico = true OR organizacion_id = $2)`,
        [id, organizacionId]
      );
      return result.rows[0] || null;
    });
  }

  /**
   * Obtiene la estructura completa de un template
   * @param {string} id - UUID del template
   * @param {number} organizacionId - ID de la organización
   * @returns {Promise<Object|null>}
   */
  static async obtenerEstructura(id, organizacionId) {
    return RLSContextManager.query(organizacionId, async (db) => {
      const result = await db.query(
        `SELECT estructura, tema_default
         FROM website_templates
         WHERE id = $1 AND (es_publico = true OR organizacion_id = $2)`,
        [id, organizacionId]
      );
      return result.rows[0] || null;
    });
  }

  /**
   * Incrementa el contador de uso de un template
   * @param {string} id - UUID del template
   * @returns {Promise<void>}
   */
  static async incrementarUso(id) {
    return RLSContextManager.withBypass(async (db) => {
      await db.query(
        `UPDATE website_templates
         SET veces_usado = veces_usado + 1
         WHERE id = $1`,
        [id]
      );
    });
  }

  /**
   * Crea un template personalizado para una organización
   * @param {Object} datos - Datos del template
   * @param {number} organizacionId - ID de la organización
   * @returns {Promise<Object>}
   */
  static async crear(datos, organizacionId) {
    const {
      nombre,
      descripcion,
      industria,
      thumbnail_url,
      estructura,
      tema_default,
    } = datos;

    return RLSContextManager.query(organizacionId, async (db) => {
      const result = await db.query(
        `INSERT INTO website_templates (
          nombre, descripcion, industria, thumbnail_url,
          estructura, tema_default, es_publico, organizacion_id
        ) VALUES ($1, $2, $3, $4, $5, $6, false, $7)
        RETURNING *`,
        [
          nombre,
          descripcion,
          industria,
          thumbnail_url,
          JSON.stringify(estructura || {}),
          JSON.stringify(tema_default || {}),
          organizacionId,
        ]
      );
      return result.rows[0];
    });
  }

  /**
   * Actualiza un template personalizado
   * @param {string} id - UUID del template
   * @param {Object} datos - Datos a actualizar
   * @param {number} organizacionId - ID de la organización
   * @returns {Promise<Object|null>}
   */
  static async actualizar(id, datos, organizacionId) {
    const campos = [];
    const valores = [];
    let paramIndex = 1;

    const camposPermitidos = [
      'nombre',
      'descripcion',
      'industria',
      'thumbnail_url',
      'estructura',
      'tema_default',
    ];

    for (const campo of camposPermitidos) {
      if (datos[campo] !== undefined) {
        campos.push(`${campo} = $${paramIndex}`);
        valores.push(
          campo === 'estructura' || campo === 'tema_default'
            ? JSON.stringify(datos[campo])
            : datos[campo]
        );
        paramIndex++;
      }
    }

    if (campos.length === 0) return null;

    valores.push(id, organizacionId);

    return RLSContextManager.query(organizacionId, async (db) => {
      const result = await db.query(
        `UPDATE website_templates
         SET ${campos.join(', ')}, actualizado_en = NOW()
         WHERE id = $${paramIndex} AND organizacion_id = $${paramIndex + 1}
         RETURNING *`,
        valores
      );
      return result.rows[0] || null;
    });
  }

  /**
   * Elimina un template personalizado
   * @param {string} id - UUID del template
   * @param {number} organizacionId - ID de la organización
   * @returns {Promise<boolean>}
   */
  static async eliminar(id, organizacionId) {
    return RLSContextManager.query(organizacionId, async (db) => {
      const result = await db.query(
        `DELETE FROM website_templates
         WHERE id = $1 AND organizacion_id = $2 AND es_publico = false
         RETURNING id`,
        [id, organizacionId]
      );
      return result.rowCount > 0;
    });
  }

  /**
   * Lista las industrias disponibles con conteo de templates
   * @returns {Promise<Array>}
   */
  static async listarIndustrias() {
    return RLSContextManager.withBypass(async (db) => {
      const result = await db.query(`
        SELECT
          industria,
          COUNT(*) as total_templates
        FROM website_templates
        WHERE es_publico = true AND industria IS NOT NULL
        GROUP BY industria
        ORDER BY total_templates DESC
      `);
      return result.rows;
    });
  }
}

module.exports = WebsiteTemplatesModel;
