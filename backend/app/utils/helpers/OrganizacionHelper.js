/**
 * Helper para validación de organizaciones (endpoints públicos)
 * CRÍTICO para seguridad multi-tenant en webhooks/IA
 * @module utils/helpers/OrganizacionHelper
 */

const logger = require('../../utils/logger');

class OrganizacionHelper {
  /**
   * Valida que una organización existe y está activa
   * Usa para endpoints públicos que reciben organizacion_id sin autenticación
   *
   * @param {number} organizacionId - ID de la organización a validar
   * @returns {Promise<Object>} { valida: boolean, organizacion: Object|null }
   */
  static async validarOrganizacionActiva(organizacionId) {
    const { getDb } = require('../../config/database');
    let db = null;

    try {
      // Validar que el ID es numérico
      const orgId = parseInt(organizacionId);
      if (isNaN(orgId) || orgId <= 0) {
        logger.warn('Intento de validación con organizacion_id inválido', {
          organizacionId,
          type: typeof organizacionId
        });
        return { valida: false, organizacion: null };
      }

      // Obtener conexión del pool
      db = await getDb();

      // Configurar bypass RLS para esta consulta específica
      await db.query('SELECT set_config($1, $2, false)', ['app.bypass_rls', 'true']);

      // Consultar organización
      // NOTA Feb 2026: plan_actual eliminado de organizaciones
      const result = await db.query(
        `SELECT id, nombre_comercial, activo, suspendido
         FROM organizaciones
         WHERE id = $1`,
        [orgId]
      );

      // Restaurar RLS
      await db.query('SELECT set_config($1, $2, false)', ['app.bypass_rls', 'false']);

      if (result.rows.length === 0) {
        logger.warn('Organización no encontrada', { organizacionId: orgId });
        return { valida: false, organizacion: null };
      }

      const organizacion = result.rows[0];

      // Validar que esté activa y no suspendida
      if (!organizacion.activo || organizacion.suspendido) {
        logger.warn('Intento de acceso a organización inactiva o suspendida', {
          organizacionId: orgId,
          activo: organizacion.activo,
          suspendido: organizacion.suspendido
        });
        return { valida: false, organizacion };
      }

      logger.debug('Organización validada correctamente', {
        organizacionId: orgId,
        nombre: organizacion.nombre_comercial
      });

      return { valida: true, organizacion };

    } catch (error) {
      logger.error('Error validando organización', {
        error: error.message,
        organizacionId
      });
      return { valida: false, organizacion: null };
    } finally {
      if (db) {
        try {
          await db.query('SELECT set_config($1, $2, false)', ['app.bypass_rls', 'false']);
        } catch (e) {
          logger.warn('Error restaurando RLS en validación', { error: e.message });
        }
        db.release();
      }
    }
  }
}

module.exports = OrganizacionHelper;
