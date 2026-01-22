/**
 * ============================================================================
 * MIDDLEWARE DE SUSCRIPCIONES V2 - SIMPLIFICADO
 * ============================================================================
 *
 * Versión simplificada del middleware de suscripciones que elimina:
 * - Verificación de límites por tipo de recurso
 * - Validación de trials y planes
 * - Restricciones por app
 *
 * Nuevo modelo:
 * - Cobro por usuario activo ($249/usuario/mes Pro, $150-200 Custom)
 * - Sin límites de recursos (todo ilimitado)
 * - Solo verifica que la organización esté activa
 *
 * @module middleware/subscription-v2
 * @version 2.0.0
 * @date 2026-01-21
 */

const { ResponseHelper } = require('../utils/helpers');
const logger = require('../utils/logger');
const RLSContextManager = require('../utils/rlsContextManager');

class SubscriptionV2Middleware {

  /**
   * Middleware para verificar que la organización esté activa
   *
   * @description
   * Solo valida:
   * - La organización existe
   * - La organización está activa (no suspendida)
   *
   * NO valida:
   * - Planes o límites
   * - Trials o expiración
   * - Recursos o apps
   *
   * @param {Object} req - Request de Express
   * @param {Object} res - Response de Express
   * @param {Function} next - Next middleware
   */
  static async checkActiveSubscription(req, res, next) {
    // Super admin siempre pasa (usuario de plataforma)
    if (req.user?.rol === 'super_admin') {
      return next();
    }

    const organizacionId = req.tenant?.organizacionId;

    if (!organizacionId) {
      logger.warn('Intento de verificar organización sin organizacionId en req.tenant');
      return ResponseHelper.error(res, 'Organización no encontrada', 400);
    }

    try {
      // Solo verificar que la organización esté activa
      const result = await RLSContextManager.withBypass(async (db) => {
        const query = `
          SELECT
            id,
            nombre,
            activo,
            suspendido
          FROM organizaciones
          WHERE id = $1
        `;
        return await db.query(query, [organizacionId]);
      });

      if (result.rows.length === 0) {
        logger.warn(`Organización ${organizacionId} no encontrada`);
        return ResponseHelper.error(
          res,
          'Organización no encontrada.',
          404
        );
      }

      const organizacion = result.rows[0];

      // Verificar si está suspendida
      if (organizacion.suspendido) {
        logger.warn(`Organización ${organizacionId} suspendida`);
        return ResponseHelper.error(
          res,
          'Su cuenta está suspendida. Por favor, contacte a soporte.',
          403,
          {
            codigo_error: 'ORGANIZATION_SUSPENDED',
            accion_requerida: 'contact_support'
          }
        );
      }

      // Verificar si está inactiva
      if (!organizacion.activo) {
        logger.warn(`Organización ${organizacionId} inactiva`);
        return ResponseHelper.error(
          res,
          'Su cuenta está inactiva. Por favor, contacte a soporte.',
          403,
          {
            codigo_error: 'ORGANIZATION_INACTIVE',
            accion_requerida: 'contact_support'
          }
        );
      }

      // Organización válida, continuar
      next();

    } catch (error) {
      logger.error('❌ Error verificando estado de organización:', error);
      return ResponseHelper.error(res, 'Error al verificar organización', 500);
    }
  }

  /**
   * Middleware factory para verificar límites por tipo de recurso
   *
   * @description
   * V2: Sin límites de recursos. Siempre permite crear.
   * Mantenido solo para compatibilidad con rutas existentes.
   *
   * @param {string} tipoRecurso - Tipo de recurso (ignorado)
   * @returns {Function} Middleware de Express que siempre pasa
   */
  static checkResourceLimit(tipoRecurso) {
    return async (req, res, next) => {
      // V2: Sin límites, siempre permitir
      next();
    };
  }

  /**
   * Middleware factory para verificar acceso a una app específica
   *
   * @description
   * V2: Todos tienen acceso a todas las apps.
   * Mantenido solo para compatibilidad con rutas existentes.
   *
   * @param {string} appRequerida - App requerida (ignorado)
   * @returns {Function} Middleware de Express que siempre pasa
   */
  static checkAppAccess(appRequerida) {
    return async (req, res, next) => {
      // V2: Acceso completo a todas las apps, siempre permitir
      next();
    };
  }

  /**
   * Middleware opcional para agregar warning headers
   *
   * @description
   * V2: Sin warnings de límites (no hay límites).
   * Mantenido solo para compatibilidad.
   *
   * @param {string} tipoRecurso - Tipo de recurso (ignorado)
   * @returns {Function} Middleware de Express que siempre pasa
   */
  static checkResourceWarning(tipoRecurso) {
    return async (req, res, next) => {
      // V2: Sin warnings, siempre permitir
      next();
    };
  }
}

module.exports = SubscriptionV2Middleware;
