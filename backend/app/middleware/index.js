/**
 * Exportación centralizada de todos los middlewares
 * Facilita la importación y uso en rutas y aplicación
 */

const auth = require('./auth');
const tenant = require('./tenant');
const validation = require('./validation');
const rateLimiting = require('./rateLimiting');
const asyncHandler = require('./asyncHandler');
const subscription = require('./subscription');

module.exports = {
  // Middleware de manejo de errores async
  asyncHandler,

  // Middleware de autenticación
  auth: {
    authenticateToken: auth.authenticateToken,
    requireRole: auth.requireRole,
    requireAdmin: auth.requireAdmin,
    requireAdminRole: auth.requireAdminRole,
    requireOwnerOrAdmin: auth.requireOwnerOrAdmin,
    optionalAuth: auth.optionalAuth,
    verifyOrganizationAccess: auth.verifyOrganizationAccess,
    refreshToken: auth.refreshToken
  },

  // Middleware de tenant
  tenant: {
    setTenantContext: tenant.setTenantContext,
    validateTenantParams: tenant.validateTenantParams,
    injectTenantId: tenant.injectTenantId,
    verifyTenantActive: tenant.verifyTenantActive,
    requirePlan: tenant.requirePlan,
    releaseTenantConnection: tenant.releaseTenantConnection,
    simulateTenant: tenant.simulateTenant
  },

  // Middleware de validación
  validation: {
    validate: validation.validate,
    validateBody: validation.validateBody,
    validateParams: validation.validateParams,
    validateQuery: validation.validateQuery,
    validateFile: validation.validateFile,
    sanitizeInput: validation.sanitizeInput,
    handleValidation: validation.handleValidation,
    commonSchemas: validation.commonSchemas
  },

  // Middleware de rate limiting
  rateLimiting: {
    ipRateLimit: rateLimiting.ipRateLimit,
    userRateLimit: rateLimiting.userRateLimit,
    organizationRateLimit: rateLimiting.organizationRateLimit,
    authRateLimit: rateLimiting.authRateLimit,
    apiRateLimit: rateLimiting.apiRateLimit,
    heavyOperationRateLimit: rateLimiting.heavyOperationRateLimit,
    planBasedRateLimit: rateLimiting.planBasedRateLimit,
    createRateLimit: rateLimiting.createRateLimit,
    clearRateLimit: rateLimiting.clearRateLimit
  },

  // Middleware de suscripciones y límites de planes
  subscription: {
    checkActiveSubscription: subscription.checkActiveSubscription,
    checkResourceLimit: subscription.checkResourceLimit,
    checkResourceWarning: subscription.checkResourceWarning
  }
};

/**
 * Middleware compuesto para rutas que requieren autenticación completa
 * Incluye: autenticación, tenant context, verificación de organización activa y liberación de conexión
 */
const requireFullAuth = [
  tenant.releaseTenantConnection,  // Primero configurar liberación de conexión
  auth.authenticateToken,
  tenant.setTenantContext,
  tenant.verifyTenantActive
];

/**
 * Middleware compuesto para rutas administrativas
 * Incluye: autenticación completa + verificación de rol admin
 */
const requireAdminAuth = [
  ...requireFullAuth,
  auth.requireAdmin
];

/**
 * Middleware compuesto para rutas de propietario
 * Incluye: autenticación completa + verificación de rol propietario/admin
 */
const requireOwnerAuth = [
  ...requireFullAuth,
  auth.requireOwnerOrAdmin
];

/**
 * Middleware compuesto para APIs públicas
 * Incluye: rate limiting + validación de entrada
 */
const publicAPI = [
  rateLimiting.apiRateLimit,
  validation.sanitizeInput
];

/**
 * Middleware compuesto para endpoints de autenticación
 * Incluye: rate limiting estricto + validación
 */
const authEndpoint = [
  rateLimiting.authRateLimit,
  validation.sanitizeInput
];

module.exports.composed = {
  requireFullAuth,
  requireAdminAuth,
  requireOwnerAuth,
  publicAPI,
  authEndpoint
};