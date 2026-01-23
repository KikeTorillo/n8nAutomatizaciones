/**
 * Middleware para garantizar contexto de tenant
 * Centraliza la extracción de organizacionId que se repite en 5+ middlewares
 *
 * @module middleware/tenantContext
 */

const { ResponseHelper } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Middleware que asegura la existencia del contexto de tenant.
 * Extrae organizacionId de req.tenant o req.user y lo adjunta a req.organizacionId.
 *
 * DEBE usarse DESPUÉS de auth.authenticateToken y tenant.setTenantContext.
 *
 * @param {Object} options - Opciones de configuración
 * @param {boolean} [options.allowSuperAdmin=true] - Si super_admin puede bypasear (sin organizacionId)
 * @param {string} [options.errorMessage='Organización no encontrada'] - Mensaje de error personalizado
 * @returns {Function} Middleware de Express
 *
 * @example
 * // En rutas que requieren contexto de tenant:
 * router.post('/recursos',
 *   auth.authenticateToken,
 *   tenant.setTenantContext,
 *   ensureTenantContext(),  // <-- Garantiza req.organizacionId
 *   subscription.checkResourceLimit,
 *   asyncHandler(Controller.crear)
 * );
 *
 * @example
 * // Rechazar incluso a super_admin sin organización:
 * router.get('/reportes-org',
 *   auth.authenticateToken,
 *   tenant.setTenantContext,
 *   ensureTenantContext({ allowSuperAdmin: false }),
 *   asyncHandler(ReportesController.listar)
 * );
 */
function ensureTenantContext(options = {}) {
  const {
    allowSuperAdmin = true,
    errorMessage = 'Organización no encontrada'
  } = options;

  return (req, res, next) => {
    // Super admin puede bypasear si se permite
    if (allowSuperAdmin && req.user?.rol_codigo === 'super_admin') {
      // Intentar adjuntar organizacionId si existe, pero no es requerido
      req.organizacionId = req.tenant?.organizacionId || req.user?.organizacion_id || null;
      return next();
    }

    // Extraer organizacionId de tenant o user
    const organizacionId = req.tenant?.organizacionId || req.user?.organizacion_id;

    if (!organizacionId) {
      logger.warn('[ensureTenantContext] organizacionId no encontrado', {
        user_id: req.user?.id,
        user_rol: req.user?.rol_codigo,
        tenant: req.tenant ? 'exists' : 'missing',
        path: req.path
      });

      return ResponseHelper.error(res, errorMessage, 400);
    }

    // Adjuntar organizacionId normalizado al request
    req.organizacionId = organizacionId;
    next();
  };
}

/**
 * Extrae organizacionId de forma segura sin middleware.
 * Útil para helpers y funciones que no son middlewares.
 *
 * @param {Object} req - Request de Express
 * @returns {number|null} organizacionId o null
 *
 * @example
 * const { extractOrganizacionId } = require('../middleware/tenantContext');
 *
 * async function helper(req) {
 *   const orgId = extractOrganizacionId(req);
 *   if (!orgId) throw new Error('Organización requerida');
 *   // ...
 * }
 */
function extractOrganizacionId(req) {
  return req.organizacionId || req.tenant?.organizacionId || req.user?.organizacion_id || null;
}

/**
 * Verifica si el usuario es super_admin
 *
 * @param {Object} req - Request de Express
 * @returns {boolean}
 */
function isSuperAdmin(req) {
  return req.user?.rol_codigo === 'super_admin';
}

module.exports = {
  ensureTenantContext,
  extractOrganizacionId,
  isSuperAdmin
};
