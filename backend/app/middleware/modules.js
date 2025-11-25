/**
 * @fileoverview Middleware de Validación de Módulos Activos
 * @description Valida que la organización tenga acceso al módulo solicitado
 * @version 1.0.0 (PoC)
 *
 * CARACTERÍSTICAS:
 * - Validación de módulos activos por organización
 * - Mensajes de error con información de pricing
 * - Integración con ModulesCache para performance
 * - Soporte para bypass (super_admin)
 */

const logger = require('../utils/logger');
const { ResponseHelper } = require('../utils/helpers');
const ModulesCache = require('../core/ModulesCache');

class ModulesMiddleware {

  /**
   * Middleware para requerir un módulo específico
   *
   * @param {string} moduleName - Nombre del módulo requerido
   * @param {Object} options - Opciones adicionales
   * @param {boolean} options.allowSuperAdmin - Si true, super_admin bypasea la validación
   * @returns {Function} Middleware de Express
   *
   * @example
   * router.post('/productos',
   *   auth.authenticateToken,
   *   tenant.setTenantContext,
   *   modules.requireModule('inventario'),  // ✅ Valida acceso
   *   subscription.checkResourceLimit,
   *   asyncHandler(ProductosController.crear)
   * );
   */
  static requireModule(moduleName, options = {}) {
    const { allowSuperAdmin = true } = options;

    return async (req, res, next) => {
      try {
        // 1. Validar que existe req.user (debe usarse después de auth)
        if (!req.user) {
          logger.error('[ModulesMiddleware] Middleware usado sin autenticación', {
            module: moduleName,
            path: req.path
          });
          return ResponseHelper.error(res, 'Error de configuración del servidor', 500);
        }

        // 2. Bypass para super_admin si está habilitado
        if (allowSuperAdmin && req.user.rol === 'super_admin') {
          logger.debug('[ModulesMiddleware] Super admin bypassing module check', {
            module: moduleName,
            user_id: req.user.id
          });
          return next();
        }

        // 3. Validar que existe organizacion_id (debe usarse después de tenant)
        const organizacionId = req.tenant?.organizacionId || req.user?.organizacion_id;

        if (!organizacionId) {
          logger.error('[ModulesMiddleware] organizacionId no encontrado en request', {
            module: moduleName,
            user_id: req.user.id,
            tenant: req.tenant,
            path: req.path
          });
          return ResponseHelper.error(res, 'Organización no encontrada', 400);
        }

        // 4. Módulo core siempre disponible
        if (moduleName === 'core') {
          return next();
        }

        logger.debug('[ModulesMiddleware] Validando acceso a módulo', {
          module: moduleName,
          organizacion_id: organizacionId,
          user_id: req.user.id,
          path: req.path
        });

        // 5. Obtener módulos activos (con cache)
        const modulosActivos = await ModulesCache.get(organizacionId);

        // 6. Validar que el módulo está activo
        if (!modulosActivos[moduleName]) {
          logger.warn('[ModulesMiddleware] ⚠️ Acceso denegado: módulo no activo', {
            module: moduleName,
            organizacion_id: organizacionId,
            user_id: req.user.id,
            modulos_activos: modulosActivos,
            path: req.path
          });

          // Mensaje de error con información de pricing
          const mensaje = ModulesMiddleware.getModuleErrorMessage(moduleName);

          return ResponseHelper.error(res, mensaje, 403, {
            codigo: 'MODULO_NO_ACTIVO',
            modulo: moduleName,
            modulos_activos: modulosActivos,
            accion_requerida: 'Activar el módulo desde el panel de administración o contactar a ventas'
          });
        }

        // 7. Módulo activo - permitir acceso
        logger.debug('[ModulesMiddleware] ✅ Acceso permitido', {
          module: moduleName,
          organizacion_id: organizacionId
        });

        next();

      } catch (error) {
        logger.error('[ModulesMiddleware] ❌ Error validando módulo', {
          module: moduleName,
          error: error.message,
          stack: error.stack
        });

        return ResponseHelper.error(res, 'Error validando acceso al módulo', 500);
      }
    };
  }

  /**
   * Middleware para requerir múltiples módulos (ANY)
   * Permite acceso si CUALQUIERA de los módulos está activo
   *
   * @param {string[]} moduleNames - Lista de módulos (OR)
   * @returns {Function} Middleware de Express
   *
   * @example
   * // Acceso si tiene inventario O pos
   * modules.requireAnyModule(['inventario', 'pos'])
   */
  static requireAnyModule(moduleNames) {
    return async (req, res, next) => {
      try {
        const organizacionId = req.tenant?.organizacionId || req.user?.organizacion_id;

        if (!organizacionId) {
          return ResponseHelper.error(res, 'Organización no encontrada', 400);
        }

        const modulosActivos = await ModulesCache.get(organizacionId);

        // Verificar si ALGUNO de los módulos está activo
        const tieneAcceso = moduleNames.some(mod => modulosActivos[mod]);

        if (!tieneAcceso) {
          logger.warn('[ModulesMiddleware] Acceso denegado: ningún módulo requerido activo', {
            required_modules: moduleNames,
            organizacion_id: organizacionId,
            modulos_activos: modulosActivos
          });

          return ResponseHelper.error(
            res,
            `Requiere al menos uno de los siguientes módulos: ${moduleNames.join(', ')}`,
            403,
            {
              codigo: 'MODULOS_NO_ACTIVOS',
              modulos_requeridos: moduleNames,
              modulos_activos: modulosActivos
            }
          );
        }

        next();

      } catch (error) {
        logger.error('[ModulesMiddleware] Error en requireAnyModule', {
          modules: moduleNames,
          error: error.message
        });
        return ResponseHelper.error(res, 'Error validando acceso', 500);
      }
    };
  }

  /**
   * Middleware para requerir múltiples módulos (ALL)
   * Permite acceso si TODOS los módulos están activos
   *
   * @param {string[]} moduleNames - Lista de módulos (AND)
   * @returns {Function} Middleware de Express
   *
   * @example
   * // Acceso solo si tiene inventario Y pos
   * modules.requireAllModules(['inventario', 'pos'])
   */
  static requireAllModules(moduleNames) {
    return async (req, res, next) => {
      try {
        const organizacionId = req.tenant?.organizacionId || req.user?.organizacion_id;

        if (!organizacionId) {
          return ResponseHelper.error(res, 'Organización no encontrada', 400);
        }

        const modulosActivos = await ModulesCache.get(organizacionId);

        // Verificar si TODOS los módulos están activos
        const modulosFaltantes = moduleNames.filter(mod => !modulosActivos[mod]);

        if (modulosFaltantes.length > 0) {
          logger.warn('[ModulesMiddleware] Acceso denegado: módulos faltantes', {
            required_modules: moduleNames,
            missing_modules: modulosFaltantes,
            organizacion_id: organizacionId
          });

          return ResponseHelper.error(
            res,
            `Requiere los siguientes módulos: ${modulosFaltantes.join(', ')}`,
            403,
            {
              codigo: 'MODULOS_FALTANTES',
              modulos_faltantes: modulosFaltantes,
              modulos_activos: modulosActivos
            }
          );
        }

        next();

      } catch (error) {
        logger.error('[ModulesMiddleware] Error en requireAllModules', {
          modules: moduleNames,
          error: error.message
        });
        return ResponseHelper.error(res, 'Error validando acceso', 500);
      }
    };
  }

  /**
   * Helper: Obtiene mensaje de error personalizado por módulo
   * @param {string} moduleName - Nombre del módulo
   * @returns {string} Mensaje de error
   */
  static getModuleErrorMessage(moduleName) {
    const mensajes = {
      inventario: 'El módulo de Inventario no está activo. Actívalo desde tu panel de administración o contáctanos para agregarlo a tu plan.',
      pos: 'El módulo de Punto de Venta no está activo. Requiere el módulo de Inventario. Contáctanos para activarlo.',
      agendamiento: 'El módulo de Agendamiento no está activo. Este es el módulo base del sistema.',
      comisiones: 'El módulo de Comisiones no está activo. Requiere el módulo de Agendamiento.',
      marketplace: 'El módulo de Marketplace no está activo. Contáctanos para activarlo.',
      chatbots: 'El módulo de Chatbots IA no está activo. Requiere el módulo de Agendamiento.'
    };

    return mensajes[moduleName] || `El módulo "${moduleName}" no está activo en tu plan.`;
  }

  /**
   * Helper: Inyecta información de módulos activos en req
   * Útil para controllers que necesitan adaptar comportamiento
   *
   * @example
   * router.get('/ventas/:id',
   *   auth.authenticateToken,
   *   tenant.setTenantContext,
   *   modules.injectActiveModules,  // ✅ Inyecta req.modulosActivos
   *   asyncHandler(VentasController.obtenerPorId)
   * );
   */
  static async injectActiveModules(req, res, next) {
    try {
      const organizacionId = req.tenant?.organizacionId || req.user?.organizacion_id;

      if (!organizacionId) {
        // No inyectar si no hay organización (endpoints públicos)
        req.modulosActivos = { core: true };
        return next();
      }

      const modulosActivos = await ModulesCache.get(organizacionId);
      req.modulosActivos = modulosActivos;

      logger.debug('[ModulesMiddleware] Módulos activos inyectados en request', {
        organizacion_id: organizacionId,
        modulos: modulosActivos
      });

      next();

    } catch (error) {
      logger.error('[ModulesMiddleware] Error inyectando módulos', {
        error: error.message
      });

      // No fallar, solo inyectar core
      req.modulosActivos = { core: true };
      next();
    }
  }
}

module.exports = ModulesMiddleware;
