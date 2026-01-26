/**
 * ====================================================================
 * WEBSITE VERSIONES MODEL
 * ====================================================================
 * Modelo para gestionar versiones y rollback del sitio web.
 * Utiliza las funciones SQL de sql/website/10-versiones.sql.
 */

const RLSContextManager = require('../../../utils/rlsContextManager');
const { pool } = require('../../../config/database');

/**
 * Modelo de versiones de website
 */
class WebsiteVersionesModel {
  /**
   * Listar versiones de un sitio
   * @param {string} websiteId - UUID del sitio
   * @param {number} orgId - ID de organizacion
   * @param {Object} opciones - { limite, offset, tipo }
   * @returns {Promise<Array>}
   */
  static async listar(websiteId, orgId, opciones = {}) {
    const { limite = 20, offset = 0, tipo = null } = opciones;

    return await RLSContextManager.query(orgId, async (db) => {
      let query = `
        SELECT
          id,
          website_id,
          numero_version,
          nombre,
          descripcion,
          tamano_bytes,
          creado_por,
          tipo,
          creado_en,
          (snapshot->'metadata'->>'total_paginas')::int as total_paginas,
          (snapshot->'metadata'->>'total_bloques')::int as total_bloques
        FROM website_versiones
        WHERE website_id = $1
      `;

      const params = [websiteId];

      if (tipo) {
        query += ` AND tipo = $${params.length + 1}`;
        params.push(tipo);
      }

      query += ` ORDER BY creado_en DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limite, offset);

      const { rows } = await db.query(query, params);
      return rows;
    });
  }

  /**
   * Obtener una version por ID
   * @param {string} versionId - UUID de la version
   * @param {number} orgId - ID de organizacion
   * @returns {Promise<Object|null>}
   */
  static async obtener(versionId, orgId) {
    return await RLSContextManager.query(orgId, async (db) => {
      const { rows } = await db.query(
        `SELECT * FROM website_versiones WHERE id = $1`,
        [versionId]
      );
      return rows[0] || null;
    });
  }

  /**
   * Crear nueva version (snapshot)
   * @param {string} websiteId - UUID del sitio
   * @param {Object} datos - { nombre?, descripcion?, tipo? }
   * @param {number} userId - ID del usuario que crea
   * @returns {Promise<Object>}
   */
  static async crear(websiteId, datos = {}, userId = null) {
    const { nombre = null, descripcion = null, tipo = 'manual' } = datos;

    const { rows } = await pool.query(
      `SELECT * FROM website_crear_version($1, $2, $3, $4, $5)`,
      [websiteId, nombre, descripcion, tipo, userId]
    );

    return rows[0];
  }

  /**
   * Restaurar sitio a una version anterior
   * @param {string} versionId - UUID de la version
   * @param {boolean} crearBackup - Si crear backup antes de restaurar
   * @returns {Promise<boolean>}
   */
  static async restaurar(versionId, crearBackup = true) {
    const { rows } = await pool.query(
      `SELECT website_restaurar_version($1, $2) as restaurado`,
      [versionId, crearBackup]
    );

    return rows[0]?.restaurado || false;
  }

  /**
   * Eliminar una version
   * @param {string} versionId - UUID de la version
   * @param {number} orgId - ID de organizacion
   * @returns {Promise<boolean>}
   */
  static async eliminar(versionId, orgId) {
    return await RLSContextManager.query(orgId, async (db) => {
      const { rowCount } = await db.query(
        `DELETE FROM website_versiones WHERE id = $1`,
        [versionId]
      );
      return rowCount > 0;
    });
  }

  /**
   * Contar versiones de un sitio
   * @param {string} websiteId - UUID del sitio
   * @param {number} orgId - ID de organizacion
   * @returns {Promise<number>}
   */
  static async contar(websiteId, orgId) {
    return await RLSContextManager.query(orgId, async (db) => {
      const { rows } = await db.query(
        `SELECT COUNT(*)::int as total FROM website_versiones WHERE website_id = $1`,
        [websiteId]
      );
      return rows[0]?.total || 0;
    });
  }

  /**
   * Obtener preview del snapshot de una version (sin restaurar)
   * @param {string} versionId - UUID de la version
   * @param {number} orgId - ID de organizacion
   * @returns {Promise<Object|null>}
   */
  static async obtenerPreviewVersion(versionId, orgId) {
    return await RLSContextManager.query(orgId, async (db) => {
      const { rows } = await db.query(
        `SELECT
          id,
          numero_version,
          nombre,
          descripcion,
          tipo,
          creado_en,
          snapshot->'config' as config,
          snapshot->'paginas' as paginas,
          snapshot->'metadata' as metadata
        FROM website_versiones
        WHERE id = $1`,
        [versionId]
      );

      return rows[0] || null;
    });
  }

  /**
   * Comparar dos versiones
   * @param {string} versionId1 - UUID de version 1
   * @param {string} versionId2 - UUID de version 2
   * @param {number} orgId - ID de organizacion
   * @returns {Promise<Object>}
   */
  static async comparar(versionId1, versionId2, orgId) {
    return await RLSContextManager.query(orgId, async (db) => {
      const { rows } = await db.query(
        `SELECT
          v1.numero_version as version1_numero,
          v1.nombre as version1_nombre,
          v1.snapshot->'metadata' as version1_metadata,
          v2.numero_version as version2_numero,
          v2.nombre as version2_nombre,
          v2.snapshot->'metadata' as version2_metadata,
          jsonb_array_length(v1.snapshot->'paginas') as version1_paginas,
          jsonb_array_length(v2.snapshot->'paginas') as version2_paginas
        FROM website_versiones v1, website_versiones v2
        WHERE v1.id = $1 AND v2.id = $2`,
        [versionId1, versionId2]
      );

      return rows[0] || null;
    });
  }
}

module.exports = WebsiteVersionesModel;
