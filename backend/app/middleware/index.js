/**
 * Exportación centralizada de todos los middlewares
 * Facilita la importación y uso en rutas y aplicación
 */

const auth = require('./auth');
const tenant = require('./tenant');
const tenantContext = require('./tenantContext');
const validation = require('./validation');
const rateLimiting = require('./rateLimiting');
const asyncHandler = require('./asyncHandler');

// Feature flag para sistema de suscripciones
// true = Sistema antiguo (límites por recurso)
// false = Sistema v2 simplificado (sin límites)
const useOldSubscriptionSystem = process.env.USE_OLD_SUBSCRIPTION_SYSTEM === 'true';
const subscription = useOldSubscriptionSystem
  ? require('./subscription')
  : require('./subscription-v2');

const modules = require('./modules');
const storage = require('./storage');
const onboarding = require('./onboarding');
const permisos = require('./permisos');

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
    setTenantContextFromBody: tenant.setTenantContextFromBody,
    setTenantContextFromQuery: tenant.setTenantContextFromQuery,
    validateTenantParams: tenant.validateTenantParams,
    injectTenantId: tenant.injectTenantId,
    verifyTenantActive: tenant.verifyTenantActive,
    requirePlan: tenant.requirePlan,
    releaseTenantConnection: tenant.releaseTenantConnection,
    simulateTenant: tenant.simulateTenant,
    // Helpers centralizados para contexto de tenant (Ene 2026)
    ensureTenantContext: tenantContext.ensureTenantContext,
    extractOrganizacionId: tenantContext.extractOrganizacionId,
    isSuperAdmin: tenantContext.isSuperAdmin
  },

  // Middleware de validación
  validation: {
    validate: validation.validate,
    validateBody: validation.validateBody,
    validateParams: validation.validateParams,
    validateQuery: validation.validateQuery,
    validateFile: validation.validateFile,
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
    checkResourceWarning: subscription.checkResourceWarning,
    checkAppAccess: subscription.checkAppAccess  // Modelo Free/Pro
  },

  // Middleware de módulos (PoC - Fase 0)
  modules: {
    requireModule: modules.requireModule,
    requireAnyModule: modules.requireAnyModule,
    requireAllModules: modules.requireAllModules,
    injectActiveModules: modules.injectActiveModules
  },

  // Middleware de storage (MinIO)
  storage: {
    uploadSingle: storage.uploadSingle,
    uploadMultiple: storage.uploadMultiple,
    createUploadSingle: storage.createUploadSingle,
    checkStorageLimit: storage.checkStorageLimit,
    validateFileSize: storage.validateFileSize,
    ALLOWED_TYPES: storage.ALLOWED_TYPES,
    SIZE_LIMITS: storage.SIZE_LIMITS
  },

  // Middleware de onboarding (Dic 2025 - OAuth/Magic Links)
  onboarding: {
    requireOnboarding: onboarding.requireOnboarding,
    checkOnboarding: onboarding.checkOnboarding
  },

  // Middleware de permisos (Dic 2025 - Sistema Normalizado)
  permisos: {
    verificarPermiso: permisos.verificarPermiso,
    verificarAlgunPermiso: permisos.verificarAlgunPermiso,
    verificarTodosPermisos: permisos.verificarTodosPermisos,
    verificarLimiteNumerico: permisos.verificarLimiteNumerico,
    tienePermiso: permisos.tienePermiso,
    obtenerValorNumerico: permisos.obtenerValorNumerico,
    invalidarCacheUsuario: permisos.invalidarCacheUsuario,
    invalidarTodoCache: permisos.invalidarTodoCache
  }
};

/**
 * Middleware compuesto para rutas que requieren autenticación completa
 * Incluye: autenticación, tenant context, verificación de organización activa
 *
 * NOTA: releaseTenantConnection fue removido (deprecated) - las conexiones
 * ahora se liberan automáticamente por RLSContextManager
 */
const requireFullAuth = [
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
 * Incluye: rate limiting
 */
const publicAPI = [
  rateLimiting.apiRateLimit
];

/**
 * Middleware compuesto para endpoints de autenticación
 * Incluye: rate limiting estricto
 */
const authEndpoint = [
  rateLimiting.authRateLimit
];

module.exports.composed = {
  requireFullAuth,
  requireAdminAuth,
  requireOwnerAuth,
  publicAPI,
  authEndpoint
};