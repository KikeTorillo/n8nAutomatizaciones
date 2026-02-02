/**
 * ====================================================================
 * MODEL - WEBSITE CONTACTOS
 * ====================================================================
 * Modelo para gestionar los contactos/leads recibidos desde
 * el formulario público del sitio web.
 *
 * TABLA: website_contactos (creada en sql/website/05-contactos.sql)
 *
 * Fecha creación: 25 Enero 2026
 */

const RLSContextManager = require('../../../utils/rlsContextManager');
const db = require('../../../config/database');

/**
 * Modelo de Contactos del Website
 */
class WebsiteContactosModel {
  /**
   * Verificar que la tabla existe
   * NOTA: La tabla se crea desde sql/website/05-contactos.sql
   * Este método solo verifica, no crea estructura (separación de responsabilidades)
   */
  static async verificarTabla() {
    try {
      const result = await db.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_name = 'website_contactos'
        ) as existe
      `);

      if (!result.rows[0].existe) {
        console.warn('[WebsiteContactosModel] ⚠️ Tabla website_contactos no existe. Ejecutar sql/website/05-contactos.sql');
      }
    } catch (error) {
      console.error('[WebsiteContactosModel] Error verificando tabla:', error.message);
    }
  }

  /**
   * Crear un nuevo contacto
   * @param {Object} datos - Datos del contacto
   * @param {string} datos.website_id - UUID del sitio web
   * @param {number} datos.organizacion_id - ID de la organización
   * @param {string} datos.nombre - Nombre del contacto
   * @param {string} datos.email - Email del contacto
   * @param {string} datos.telefono - Teléfono del contacto
   * @param {string} datos.mensaje - Mensaje del contacto
   * @param {string} datos.pagina_origen - Slug de la página de origen
   * @param {string} datos.ip_origen - IP del visitante
   * @param {string} datos.user_agent - User agent del navegador
   * @returns {Promise<Object>}
   */
  static async crear(datos) {
    const {
      website_id,
      organizacion_id,
      nombre,
      email,
      telefono,
      mensaje,
      pagina_origen,
      ip_origen,
      user_agent,
    } = datos;

    const query = `
      INSERT INTO website_contactos (
        website_id,
        organizacion_id,
        nombre,
        email,
        telefono,
        mensaje,
        pagina_origen,
        ip_origen,
        user_agent
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await RLSContextManager.withBypass(async (db) => {
      return await db.query(query, [
        website_id,
        organizacion_id,
        nombre,
        email || null,
        telefono || null,
        mensaje || null,
        pagina_origen || null,
        ip_origen || null,
        user_agent || null,
      ]);
    });

    return result.rows[0];
  }

  /**
   * Listar contactos de una organización
   * @param {number} organizacionId - ID de la organización
   * @param {Object} filtros - Filtros opcionales
   * @returns {Promise<Array>}
   */
  static async listar(organizacionId, filtros = {}) {
    const {
      solo_no_leidos = false,
      limite = 50,
      offset = 0,
    } = filtros;

    let query = `
      SELECT
        c.*,
        wc.nombre_sitio,
        wc.slug as sitio_slug
      FROM website_contactos c
      LEFT JOIN website_config wc ON c.website_id = wc.id
      WHERE c.organizacion_id = $1
    `;

    const params = [organizacionId];
    let paramIndex = 2;

    if (solo_no_leidos) {
      query += ` AND c.leido = false`;
    }

    query += ` ORDER BY c.creado_en DESC`;
    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(limite, offset);

    const result = await RLSContextManager.query(organizacionId, async (db) => {
      return await db.query(query, params);
    });

    return result.rows;
  }

  /**
   * Contar contactos no leídos
   * @param {number} organizacionId - ID de la organización
   * @returns {Promise<number>}
   */
  static async contarNoLeidos(organizacionId) {
    const query = `
      SELECT COUNT(*) as total
      FROM website_contactos
      WHERE organizacion_id = $1 AND leido = false
    `;

    const result = await RLSContextManager.query(organizacionId, async (db) => {
      return await db.query(query, [organizacionId]);
    });

    return parseInt(result.rows[0]?.total || 0);
  }

  /**
   * Marcar contacto como leído
   * @param {string} id - UUID del contacto
   * @param {number} organizacionId - ID de la organización
   * @returns {Promise<Object>}
   */
  static async marcarLeido(id, organizacionId) {
    const query = `
      UPDATE website_contactos
      SET leido = true, actualizado_en = NOW()
      WHERE id = $1 AND organizacion_id = $2
      RETURNING *
    `;

    const result = await RLSContextManager.query(organizacionId, async (db) => {
      return await db.query(query, [id, organizacionId]);
    });

    return result.rows[0];
  }

  /**
   * Marcar contacto como respondido
   * @param {string} id - UUID del contacto
   * @param {number} organizacionId - ID de la organización
   * @param {string} notas - Notas sobre la respuesta
   * @returns {Promise<Object>}
   */
  static async marcarRespondido(id, organizacionId, notas = null) {
    const query = `
      UPDATE website_contactos
      SET
        respondido = true,
        leido = true,
        notas = COALESCE($3, notas),
        actualizado_en = NOW()
      WHERE id = $1 AND organizacion_id = $2
      RETURNING *
    `;

    const result = await RLSContextManager.query(organizacionId, async (db) => {
      return await db.query(query, [id, organizacionId, notas]);
    });

    return result.rows[0];
  }

  /**
   * Eliminar contacto
   * @param {string} id - UUID del contacto
   * @param {number} organizacionId - ID de la organización
   * @returns {Promise<boolean>}
   */
  static async eliminar(id, organizacionId) {
    const query = `
      DELETE FROM website_contactos
      WHERE id = $1 AND organizacion_id = $2
      RETURNING id
    `;

    const result = await RLSContextManager.query(organizacionId, async (db) => {
      return await db.query(query, [id, organizacionId]);
    });

    return result.rowCount > 0;
  }
}

// Verificar que la tabla existe al cargar el módulo
// NOTA: La creación de la tabla se hace desde sql/website/05-contactos.sql
WebsiteContactosModel.verificarTabla().catch(console.error);

module.exports = WebsiteContactosModel;
