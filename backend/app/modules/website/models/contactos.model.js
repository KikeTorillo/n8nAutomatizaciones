/**
 * ====================================================================
 * MODEL - WEBSITE CONTACTOS
 * ====================================================================
 * Modelo para gestionar los contactos/leads recibidos desde
 * el formulario público del sitio web.
 *
 * TABLA: website_contactos (se crea automáticamente si no existe)
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
   * Inicializar tabla si no existe
   */
  static async inicializarTabla() {
    const query = `
      CREATE TABLE IF NOT EXISTS website_contactos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        website_id UUID NOT NULL REFERENCES website_config(id) ON DELETE CASCADE,
        organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

        -- Datos del contacto
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(255),
        telefono VARCHAR(30),
        mensaje TEXT,

        -- Metadatos
        pagina_origen VARCHAR(100),
        ip_origen INET,
        user_agent TEXT,

        -- Estado
        leido BOOLEAN DEFAULT false,
        respondido BOOLEAN DEFAULT false,
        notas TEXT,

        creado_en TIMESTAMPTZ DEFAULT NOW(),
        actualizado_en TIMESTAMPTZ DEFAULT NOW()
      );

      -- Índices
      CREATE INDEX IF NOT EXISTS idx_website_contactos_website ON website_contactos(website_id);
      CREATE INDEX IF NOT EXISTS idx_website_contactos_org ON website_contactos(organizacion_id);
      CREATE INDEX IF NOT EXISTS idx_website_contactos_no_leidos ON website_contactos(organizacion_id, leido) WHERE leido = false;
      CREATE INDEX IF NOT EXISTS idx_website_contactos_fecha ON website_contactos(creado_en DESC);

      -- RLS
      ALTER TABLE website_contactos ENABLE ROW LEVEL SECURITY;

      -- Política para lectura/escritura por organización
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'website_contactos' AND policyname = 'website_contactos_org_all'
        ) THEN
          CREATE POLICY website_contactos_org_all ON website_contactos
            FOR ALL USING (
              organizacion_id = COALESCE(
                NULLIF(current_setting('app.current_org_id', true), '')::int,
                organizacion_id
              )
            );
        END IF;
      END $$;

      -- Política para bypass (super_admin, webhooks)
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'website_contactos' AND policyname = 'website_contactos_bypass'
        ) THEN
          CREATE POLICY website_contactos_bypass ON website_contactos
            FOR ALL USING (current_setting('app.bypass_rls', true) = 'true');
        END IF;
      END $$;
    `;

    try {
      await db.query(query);
      console.log('[WebsiteContactosModel] Tabla inicializada');
    } catch (error) {
      // Ignorar si ya existe
      if (!error.message.includes('already exists')) {
        console.error('[WebsiteContactosModel] Error inicializando tabla:', error.message);
      }
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

// Inicializar tabla al cargar el módulo
WebsiteContactosModel.inicializarTabla().catch(console.error);

module.exports = WebsiteContactosModel;
