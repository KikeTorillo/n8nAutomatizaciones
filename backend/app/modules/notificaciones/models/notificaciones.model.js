/**
 * Model de Notificaciones
 * Encapsula operaciones de base de datos para notificaciones
 *
 * @module modules/notificaciones/models/notificaciones.model
 */

const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');

class NotificacionesModel {
  /**
   * Listar notificaciones del usuario
   * @param {number} usuarioId - ID del usuario
   * @param {Object} filtros - Filtros opcionales
   * @returns {Promise<Array>} Lista de notificaciones
   */
  static async listar(usuarioId, filtros = {}) {
    const {
      solo_no_leidas = false,
      categoria = null,
      limit = 20,
      offset = 0
    } = filtros;

    const query = `
      SELECT * FROM obtener_feed_notificaciones($1, $2, $3, $4, $5)
    `;

    const result = await RLSContextManager.withBypass(async (db) => {
      return await db.query(
        query,
        [usuarioId, solo_no_leidas, categoria, parseInt(limit), parseInt(offset)]
      );
    });

    return result.rows;
  }

  /**
   * Contar notificaciones no leídas
   * @param {number} usuarioId - ID del usuario
   * @returns {Promise<number>} Cantidad de no leídas
   */
  static async contarNoLeidas(usuarioId) {
    const query = `SELECT contar_notificaciones_no_leidas($1) as count`;

    const result = await RLSContextManager.withBypass(async (db) => {
      return await db.query(query, [usuarioId]);
    });

    return result.rows[0]?.count || 0;
  }

  /**
   * Marcar notificación como leída
   * @param {number} id - ID de la notificación
   * @param {number} usuarioId - ID del usuario
   * @returns {Promise<boolean>} True si se marcó correctamente
   */
  static async marcarLeida(id, usuarioId) {
    const query = `SELECT marcar_notificacion_leida($1, $2) as success`;

    const result = await RLSContextManager.withBypass(async (db) => {
      return await db.query(query, [id, usuarioId]);
    });

    return result.rows[0]?.success || false;
  }

  /**
   * Marcar todas las notificaciones como leídas
   * @param {number} usuarioId - ID del usuario
   * @returns {Promise<number>} Cantidad marcada
   */
  static async marcarTodasLeidas(usuarioId) {
    const query = `SELECT marcar_todas_notificaciones_leidas($1) as count`;

    const result = await RLSContextManager.withBypass(async (db) => {
      return await db.query(query, [usuarioId]);
    });

    const count = result.rows[0]?.count || 0;
    logger.info(`[Notificaciones] Usuario ${usuarioId} marcó ${count} como leídas`);

    return count;
  }

  /**
   * Archivar notificación
   * @param {number} id - ID de la notificación
   * @param {number} usuarioId - ID del usuario
   * @returns {Promise<boolean>} True si se archivó correctamente
   */
  static async archivar(id, usuarioId) {
    const query = `SELECT archivar_notificacion($1, $2) as success`;

    const result = await RLSContextManager.withBypass(async (db) => {
      return await db.query(query, [id, usuarioId]);
    });

    return result.rows[0]?.success || false;
  }

  /**
   * Eliminar notificación
   * @param {number} id - ID de la notificación
   * @param {number} usuarioId - ID del usuario
   * @returns {Promise<boolean>} True si se eliminó correctamente
   */
  static async eliminar(id, usuarioId) {
    const query = `
      DELETE FROM notificaciones
      WHERE id = $1 AND usuario_id = $2
      RETURNING id
    `;

    const result = await RLSContextManager.withBypass(async (db) => {
      return await db.query(query, [id, usuarioId]);
    });

    return result.rows.length > 0;
  }

  /**
   * Obtener preferencias de notificaciones del usuario
   * @param {number} usuarioId - ID del usuario
   * @returns {Promise<Object>} Preferencias agrupadas por categoría
   */
  static async obtenerPreferencias(usuarioId) {
    const query = `SELECT * FROM obtener_preferencias_notificaciones($1)`;

    const result = await RLSContextManager.withBypass(async (db) => {
      return await db.query(query, [usuarioId]);
    });

    // Agrupar por categoría
    return result.rows.reduce((acc, pref) => {
      if (!acc[pref.categoria]) {
        acc[pref.categoria] = [];
      }
      acc[pref.categoria].push(pref);
      return acc;
    }, {});
  }

  /**
   * Actualizar preferencias del usuario
   * @param {number} organizacionId - ID de la organización
   * @param {number} usuarioId - ID del usuario
   * @param {Array} preferencias - Array de preferencias
   * @returns {Promise<number>} Cantidad actualizada
   */
  static async actualizarPreferencias(organizacionId, usuarioId, preferencias) {
    await RLSContextManager.transaction(organizacionId, async (client) => {
      for (const pref of preferencias) {
        await client.query(
          `SELECT actualizar_preferencia_notificacion($1, $2, $3, $4, $5, $6, $7)`,
          [
            organizacionId,
            usuarioId,
            pref.tipo,
            pref.in_app,
            pref.email,
            pref.push || false,
            pref.whatsapp || false
          ]
        );
      }
    });

    logger.info(`[Notificaciones] Usuario ${usuarioId} actualizó ${preferencias.length} preferencias`);

    return preferencias.length;
  }

  /**
   * Obtener tipos de notificación disponibles
   * @returns {Promise<Object>} Tipos agrupados por categoría
   */
  static async obtenerTipos() {
    const query = `
      SELECT tipo, categoria, nombre, descripcion, icono_default, nivel_default,
             default_in_app, default_email, default_push, orden
      FROM notificaciones_tipos
      WHERE activo = TRUE
      ORDER BY categoria, orden
    `;

    const result = await RLSContextManager.withBypass(async (db) => {
      return await db.query(query);
    });

    // Agrupar por categoría
    return result.rows.reduce((acc, tipo) => {
      if (!acc[tipo.categoria]) {
        acc[tipo.categoria] = [];
      }
      acc[tipo.categoria].push(tipo);
      return acc;
    }, {});
  }

  /**
   * Listar plantillas de la organización
   * @param {number} organizacionId - ID de la organización
   * @returns {Promise<Array>} Lista de plantillas
   */
  static async listarPlantillas(organizacionId) {
    const query = `
      SELECT id, tipo_notificacion, nombre, titulo_template, mensaje_template,
             icono, nivel, activo, creado_en, actualizado_en
      FROM notificaciones_plantillas
      WHERE organizacion_id = $1
      ORDER BY tipo_notificacion
    `;

    const result = await RLSContextManager.query(organizacionId, query, [organizacionId]);
    return result.rows;
  }

  /**
   * Crear plantilla de notificación
   * @param {number} organizacionId - ID de la organización
   * @param {Object} datos - Datos de la plantilla
   * @param {number} creadorId - ID del usuario creador
   * @returns {Promise<Object>} Plantilla creada
   */
  static async crearPlantilla(organizacionId, datos, creadorId) {
    const {
      tipo_notificacion,
      nombre,
      titulo_template,
      mensaje_template,
      icono,
      nivel,
      activo
    } = datos;

    const query = `
      INSERT INTO notificaciones_plantillas (
        organizacion_id, tipo_notificacion, nombre, titulo_template,
        mensaje_template, icono, nivel, activo, creado_por
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await RLSContextManager.query(
      organizacionId,
      query,
      [
        organizacionId,
        tipo_notificacion,
        nombre,
        titulo_template,
        mensaje_template,
        icono || null,
        nivel || 'info',
        activo !== false,
        creadorId
      ]
    );

    return result.rows[0];
  }

  /**
   * Actualizar plantilla de notificación
   * @param {number} organizacionId - ID de la organización
   * @param {number} id - ID de la plantilla
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object|null>} Plantilla actualizada o null
   */
  static async actualizarPlantilla(organizacionId, id, datos) {
    const updates = [];
    const params = [];
    let paramIndex = 1;

    const allowedFields = [
      'nombre', 'titulo_template', 'mensaje_template',
      'icono', 'nivel', 'activo'
    ];

    for (const field of allowedFields) {
      if (datos[field] !== undefined) {
        updates.push(`${field} = $${paramIndex++}`);
        params.push(datos[field]);
      }
    }

    if (updates.length === 0) {
      return null;
    }

    params.push(id);
    params.push(organizacionId);

    const query = `
      UPDATE notificaciones_plantillas
      SET ${updates.join(', ')}, actualizado_en = NOW()
      WHERE id = $${paramIndex++} AND organizacion_id = $${paramIndex}
      RETURNING *
    `;

    const result = await RLSContextManager.query(organizacionId, query, params);
    return result.rows[0] || null;
  }

  /**
   * Eliminar plantilla de notificación
   * @param {number} organizacionId - ID de la organización
   * @param {number} id - ID de la plantilla
   * @returns {Promise<boolean>} True si se eliminó correctamente
   */
  static async eliminarPlantilla(organizacionId, id) {
    const query = `
      DELETE FROM notificaciones_plantillas
      WHERE id = $1 AND organizacion_id = $2
      RETURNING id
    `;

    const result = await RLSContextManager.query(organizacionId, query, [id, organizacionId]);
    return result.rows.length > 0;
  }
}

module.exports = NotificacionesModel;
