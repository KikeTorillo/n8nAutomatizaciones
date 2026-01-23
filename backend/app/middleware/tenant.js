/**
 * @fileoverview Middleware Multi-Tenant Enterprise con Row Level Security
 *
 * Sistema de aislamiento de datos multi-tenant que garantiza que cada organización
 * solo acceda a sus propios datos. Utiliza PostgreSQL Row Level Security (RLS)
 * para aplicar automáticamente filtros de tenant en todas las consultas SQL.
 *
 * Características principales:
 * - Configuración automática de contexto PostgreSQL por request
 * - Validación de parámetros cross-tenant en URLs y body
 * - Inyección automática de tenant_id en operaciones de escritura
 * - Verificación de estado activo de organizaciones y suscripciones
 * - Control de acceso basado en planes de suscripción
 * - Herramientas de desarrollo para simular diferentes tenants
 *
 * @author Backend Team
 * @version 1.0.0
 * @since 2025-09-17
 */

const database = require('../config/database');
const logger = require('../utils/logger');
const { ResponseHelper } = require('../utils/helpers');
const { rateLimitService } = require('./rateLimiting');

/**
 * Configuraci\u00f3n de rate limit para enumeraci\u00f3n de tenants
 * Previene ataques de enumeraci\u00f3n de organizaciones en endpoints p\u00fablicos
 */
const TENANT_ENUM_CONFIG = {
  maxRequestsPerOrg: 30,     // M\u00e1ximo 30 requests por org por minuto
  windowSeconds: 60           // Ventana de 1 minuto
};

/**
 * Middleware para configurar el contexto del tenant en todas las consultas
 * Debe usarse después del middleware de autenticación
 *
 * MODELO DE SEGURIDAD (Nov 2025):
 * - TODOS los usuarios (incluido super_admin) usan su organizacion_id del JWT
 * - Super_admin tiene acceso a su propia organización + panel /superadmin/*
 * - Super_admin NO puede acceder a datos de otras organizaciones
 * - Eliminado: header X-Organization-Id (violaba aislamiento de tenants)
 */
const setTenantContext = async (req, res, next) => {
  try {
    if (!req.user) {
      logger.error('Middleware setTenantContext usado sin usuario autenticado');
      return ResponseHelper.error(res, 'Error de configuración', 500);
    }

    // TODOS los usuarios usan su organizacion_id (incluido super_admin)
    const tenantId = req.user.organizacion_id;

    logger.debug('Determinando tenant context', {
      userRol: req.user.rol_codigo,
      organizacionId: tenantId,
      path: req.path
    });

    // Validar que el usuario tiene organizacion_id
    if (!tenantId) {
      logger.error('Usuario sin organizacion_id', {
        userId: req.user.id,
        userRol: req.user.rol_codigo
      });
      return ResponseHelper.error(res, 'Usuario sin organización asignada', 500);
    }

    logger.debug('Tenant ID establecido', { tenantId });

    // Validar que tenant_id es numérico (prevenir SQL injection)
    if (isNaN(tenantId) || tenantId <= 0) {
      logger.error('tenant_id inválido - debe ser numérico positivo', {
        tenantId,
        type: typeof tenantId,
        userId: req.user?.id
      });
      return ResponseHelper.error(res, 'Configuración de tenant inválida', 500);
    }

    // Inicializar objeto tenant en request
    if (!req.tenant) {
      req.tenant = {};
    }
    req.tenant.organizacionId = tenantId;

    // ✅ FIX CRÍTICO: NO configurar RLS aquí porque esta conexión se libera inmediatamente
    // Los modelos configuran RLS en sus propias transacciones con set_config(..., true)
    // que es local a cada transacción, garantizando aislamiento correcto.

    logger.debug('Contexto de tenant configurado', {
      tenantId: tenantId,
      userId: req.user.id,
      userRol: req.user.rol_codigo,
      path: req.path
    });

    next();
  } catch (error) {
    logger.error('Error configurando contexto de tenant', {
      error: error.message,
      tenantId: req.user?.organizacion_id,
      userId: req.user?.id
    });
    return ResponseHelper.error(res, 'Error interno del servidor', 500);
  }
};

/**
 * Middleware para validar que los parámetros de ruta corresponden al tenant actual
 * Útil para rutas como /api/v1/organizaciones/:id/citas
 */
const validateTenantParams = (req, res, next) => {
  try {
    if (!req.user) {
      return ResponseHelper.error(res, 'Autenticación requerida', 401);
    }

    // Super admin tiene acceso a todas las organizaciones (usuario de plataforma)
    if (req.user.rol_codigo === 'super_admin') {
      return next();
    }

    // Verificar parámetros de organización en la URL
    const orgIdFromParams = req.params.organizacion_id || req.params.org_id;

    if (orgIdFromParams) {
      const requestedOrgId = parseInt(orgIdFromParams);

      if (requestedOrgId !== req.user.organizacion_id) {
        logger.warn('Intento de acceso a organización no autorizada via parámetros', {
          userId: req.user.id,
          userOrgId: req.user.organizacion_id,
          requestedOrgId: requestedOrgId,
          path: req.path,
          params: req.params
        });
        return ResponseHelper.error(res, 'Acceso no autorizado a esta organización', 403);
      }
    }

    // Verificar datos de organización en el body (para POST/PUT)
    if (req.body && req.body.organizacion_id) {
      const requestedOrgId = parseInt(req.body.organizacion_id);

      if (requestedOrgId !== req.user.organizacion_id) {
        logger.warn('Intento de acceso a organización no autorizada via body', {
          userId: req.user.id,
          userOrgId: req.user.organizacion_id,
          requestedOrgId: requestedOrgId,
          path: req.path
        });
        return ResponseHelper.error(res, 'No puede crear/modificar datos de otra organización', 403);
      }
    }

    next();
  } catch (error) {
    logger.error('Error validando parámetros de tenant', {
      error: error.message,
      userId: req.user?.id,
      path: req.path
    });
    return ResponseHelper.error(res, 'Error interno del servidor', 500);
  }
};

/**
 * Middleware para inyectar automáticamente el tenant ID en el body de requests
 * Útil para endpoints de creación que siempre deben usar el tenant del usuario autenticado
 */
const injectTenantId = (req, res, next) => {
  try {
    if (!req.user) {
      return ResponseHelper.error(res, 'Autenticación requerida', 401);
    }

    // Solo inyectar en operaciones que modifican datos
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      if (!req.body) {
        req.body = {};
      }

      // Forzar el organizacion_id del usuario autenticado
      req.body.organizacion_id = req.user.organizacion_id;

      logger.debug('Tenant ID inyectado en request body', {
        tenantId: req.user.organizacion_id,
        userId: req.user.id,
        method: req.method,
        path: req.path
      });
    }

    next();
  } catch (error) {
    logger.error('Error inyectando tenant ID', {
      error: error.message,
      userId: req.user?.id,
      path: req.path
    });
    return ResponseHelper.error(res, 'Error interno del servidor', 500);
  }
};

/**
 * Middleware para verificar que la organización esté activa
 */
const verifyTenantActive = async (req, res, next) => {
  let client;
  try {
    // Super admin no tiene organización - bypass completo
    if (req.user?.rol_codigo === 'super_admin') {
      return next();
    }

    if (!req.user || !req.user.organizacion_id) {
      return ResponseHelper.error(res, 'Autenticación requerida', 401);
    }

    // Obtener conexión del pool principal para bypass RLS
    client = await database.getPool('saas').connect();

    // Configurar bypass RLS para esta consulta específica
    // ✅ FIX: Usar set_config con false para que sea local a la transacción
    await client.query('SELECT set_config($1, $2, false)', ['app.bypass_rls', 'true']);

    const result = await client.query(
      'SELECT activo, suspendido, plan_actual, fecha_activacion FROM organizaciones WHERE id = $1',
      [req.user.organizacion_id]
    );

    if (result.rows.length === 0) {
      logger.error('Organización no encontrada', {
        organizacionId: req.user.organizacion_id,
        userId: req.user.id
      });
      return ResponseHelper.error(res, 'Organización no encontrada', 404);
    }

    const organizacion = result.rows[0];

    if (!organizacion.activo || organizacion.suspendido) {
      logger.warn('Intento de acceso con organización inactiva o suspendida', {
        organizacionId: req.user.organizacion_id,
        userId: req.user.id,
        activo: organizacion.activo,
        suspendido: organizacion.suspendido
      });
      return ResponseHelper.error(res, 'Organización suspendida', 403, {
        code: 'ORGANIZATION_SUSPENDED'
      });
    }

    // Agregar información de la organización al request
    if (!req.tenant) {
      req.tenant = {};
    }
    req.tenant.organizacionId = req.user.organizacion_id;
    req.tenant.plan = organizacion.plan_actual;
    req.tenant.fecha_activacion = organizacion.fecha_activacion;

    logger.debug('Organización verificada y activa', {
      organizacionId: req.user.organizacion_id,
      plan: organizacion.plan_actual,
      activo: organizacion.activo
    });

    next();
  } catch (error) {
    logger.error('Error verificando estado de organización', {
      error: error.message,
      organizacionId: req.user?.organizacion_id,
      userId: req.user?.id
    });
    return ResponseHelper.error(res, 'Error interno del servidor', 500);
  } finally {
    // Asegurar que la conexión se libere
    if (client) {
      // ✅ FIX: Usar set_config con false (aunque ya no es necesario porque set_config es local)
      await client.query('SELECT set_config($1, $2, false)', ['app.bypass_rls', 'false']);
      client.release();
    }
  }
};

/**
 * Middleware para limitar acceso según el plan de la organización
 * @param {Array} allowedPlans - Planes que pueden acceder a este endpoint
 */
const requirePlan = (allowedPlans) => {
  return (req, res, next) => {
    try {
      if (!req.tenant || !req.tenant.plan) {
        logger.error('Middleware requirePlan usado sin información de tenant');
        return ResponseHelper.error(res, 'Error de configuración', 500);
      }

      const plans = Array.isArray(allowedPlans) ? allowedPlans : [allowedPlans];

      if (!plans.includes(req.tenant.plan)) {
        logger.warn('Acceso denegado por plan insuficiente', {
          organizacionId: req.user.organizacion_id,
          planActual: req.tenant.plan,
          planesRequeridos: plans,
          path: req.path
        });
        return ResponseHelper.error(res, 'Plan insuficiente para esta funcionalidad', 403, {
          code: 'INSUFFICIENT_PLAN',
          planActual: req.tenant.plan,
          planesRequeridos: plans
        });
      }

      next();
    } catch (error) {
      logger.error('Error verificando plan', {
        error: error.message,
        organizacionId: req.user?.organizacion_id
      });
      return ResponseHelper.error(res, 'Error interno del servidor', 500);
    }
  };
};

/**
 * @deprecated MIDDLEWARE YA NO NECESARIO
 *
 * Anteriormente se usaba para liberar conexiones guardadas en req.dbClient.
 * Ahora las conexiones se liberan inmediatamente en setTenantContext (línea 144).
 * Los modelos configuran RLS en sus propias transacciones.
 *
 * Este middleware se mantiene solo por compatibilidad pero NO hace nada.
 */
const releaseTenantConnection = (req, res, next) => {
  // ⚠️ DEPRECATED: Ya no se usa req.dbClient
  // Las conexiones se liberan inmediatamente en setTenantContext
  logger.debug('releaseTenantConnection llamado pero ya no es necesario', {
    tenantId: req.tenant?.organizacionId,
    path: req.path
  });

  next();
};

/**
 * Middleware para establecer tenant context desde body (requests públicas)
 * Usado en endpoints sin autenticación como agendamiento de marketplace
 *
 * Este middleware obtiene organizacion_id del body en lugar de req.user
 * y verifica que la organización existe y está activa.
 *
 * @requires organizacion_id en req.body o req.query
 */
const setTenantContextFromBody = async (req, res, next) => {
  let client;
  try {
    // Obtener organizacion_id del body o query
    const organizacionId = parseInt(req.body.organizacion_id || req.query.organizacion_id);

    if (!organizacionId || isNaN(organizacionId) || organizacionId <= 0) {
      logger.warn('setTenantContextFromBody: organizacion_id no proporcionado o inválido', {
        body: req.body.organizacion_id,
        query: req.query.organizacion_id,
        path: req.path
      });
      return ResponseHelper.error(res, 'organizacion_id requerido y debe ser numérico positivo', 400);
    }

    // Rate limit por organizaci\u00f3n para prevenir enumeraci\u00f3n
    const tenantKey = `tenant_enum:org:${organizacionId}`;
    const requestCount = await rateLimitService.getCount(tenantKey);

    if (requestCount > TENANT_ENUM_CONFIG.maxRequestsPerOrg) {
      logger.warn('setTenantContextFromBody: Rate limit excedido para organizaci\u00f3n', {
        organizacionId,
        requestCount,
        ip: req.ip,
        path: req.path
      });
      return ResponseHelper.error(res, 'Demasiadas solicitudes, intenta m\u00e1s tarde', 429);
    }
    await rateLimitService.incrementCount(tenantKey, TENANT_ENUM_CONFIG.windowSeconds);

    // Obtener conexión del pool principal para bypass RLS
    client = await database.getPool('saas').connect();

    // Configurar bypass RLS para verificar existencia de organización
    await client.query('SELECT set_config($1, $2, false)', ['app.bypass_rls', 'true']);

    // Verificar que la organización existe y está activa
    const result = await client.query(
      'SELECT id, activo, suspendido, plan_actual FROM organizaciones WHERE id = $1',
      [organizacionId]
    );

    if (result.rows.length === 0) {
      logger.warn('setTenantContextFromBody: Organización no encontrada', {
        organizacionId,
        path: req.path,
        ip: req.ip
      });
      return ResponseHelper.error(res, 'Organización no encontrada', 404);
    }

    const organizacion = result.rows[0];

    if (!organizacion.activo || organizacion.suspendido) {
      logger.warn('setTenantContextFromBody: Organización inactiva o suspendida', {
        organizacionId,
        activo: organizacion.activo,
        suspendido: organizacion.suspendido,
        path: req.path
      });
      return ResponseHelper.error(res, 'Organización inactiva o suspendida', 403, {
        code: 'ORGANIZATION_INACTIVE'
      });
    }

    // Establecer tenant context (mismo patrón que setTenantContext)
    if (!req.tenant) {
      req.tenant = {};
    }
    req.tenant.organizacionId = organizacionId;
    req.tenant.plan = organizacion.plan_actual;

    logger.debug('Tenant context establecido desde body', {
      organizacionId,
      plan: organizacion.plan_actual,
      path: req.path,
      method: req.method
    });

    next();
  } catch (error) {
    logger.error('Error en setTenantContextFromBody', {
      error: error.message,
      stack: error.stack,
      path: req.path
    });
    return ResponseHelper.error(res, 'Error interno del servidor', 500);
  } finally {
    // Asegurar que la conexión se libere
    if (client) {
      await client.query('SELECT set_config($1, $2, false)', ['app.bypass_rls', 'false']);
      client.release();
    }
  }
};

/**
 * Middleware para establecer contexto de tenant desde query parameters (request público)
 * Similar a setTenantContextFromBody pero solo lee de query (para GET requests)
 *
 * ✅ FEATURE: Consultas públicas de disponibilidad desde marketplace
 * - Valida que la organización existe y está activa
 * - No requiere autenticación
 *
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Next middleware
 */
const setTenantContextFromQuery = async (req, res, next) => {
  let client;
  try {
    // Obtener organizacion_id del query
    const organizacionId = parseInt(req.query.organizacion_id);

    if (!organizacionId || isNaN(organizacionId) || organizacionId <= 0) {
      logger.warn('setTenantContextFromQuery: organizacion_id no proporcionado o inválido', {
        query: req.query.organizacion_id,
        path: req.path
      });
      return ResponseHelper.error(res, 'organizacion_id requerido y debe ser numérico positivo', 400);
    }

    // Rate limit por organizaci\u00f3n para prevenir enumeraci\u00f3n
    const tenantKey = `tenant_enum:org:${organizacionId}`;
    const requestCount = await rateLimitService.getCount(tenantKey);

    if (requestCount > TENANT_ENUM_CONFIG.maxRequestsPerOrg) {
      logger.warn('setTenantContextFromQuery: Rate limit excedido para organizaci\u00f3n', {
        organizacionId,
        requestCount,
        ip: req.ip,
        path: req.path
      });
      return ResponseHelper.error(res, 'Demasiadas solicitudes, intenta m\u00e1s tarde', 429);
    }
    await rateLimitService.incrementCount(tenantKey, TENANT_ENUM_CONFIG.windowSeconds);

    // Obtener conexión del pool principal para bypass RLS
    client = await database.getPool('saas').connect();

    // Configurar bypass RLS para verificar existencia de organización
    await client.query('SELECT set_config($1, $2, false)', ['app.bypass_rls', 'true']);

    // Verificar que la organización existe y está activa
    const result = await client.query(
      'SELECT id, activo, suspendido, plan_actual FROM organizaciones WHERE id = $1',
      [organizacionId]
    );

    if (result.rows.length === 0) {
      logger.warn('setTenantContextFromQuery: Organización no encontrada', {
        organizacionId,
        path: req.path,
        ip: req.ip
      });
      return ResponseHelper.error(res, 'Organización no encontrada', 404);
    }

    const organizacion = result.rows[0];

    if (!organizacion.activo || organizacion.suspendido) {
      logger.warn('setTenantContextFromQuery: Organización inactiva o suspendida', {
        organizacionId,
        activo: organizacion.activo,
        suspendido: organizacion.suspendido,
        path: req.path
      });
      return ResponseHelper.error(res, 'Organización inactiva o suspendida', 403, {
        code: 'ORGANIZATION_INACTIVE'
      });
    }

    // Establecer tenant context (mismo patrón que setTenantContext)
    if (!req.tenant) {
      req.tenant = {};
    }
    req.tenant.organizacionId = organizacionId;
    req.tenant.plan = organizacion.plan_actual;

    logger.debug('Tenant context establecido desde query', {
      organizacionId,
      plan: organizacion.plan_actual,
      path: req.path,
      method: req.method
    });

    next();
  } catch (error) {
    logger.error('Error en setTenantContextFromQuery', {
      error: error.message,
      stack: error.stack,
      path: req.path
    });
    return ResponseHelper.error(res, 'Error interno del servidor', 500);
  } finally {
    // Asegurar que la conexión se libere
    if (client) {
      await client.query('SELECT set_config($1, $2, false)', ['app.bypass_rls', 'false']);
      client.release();
    }
  }
};

/**
 * Middleware de desarrollo para simular diferentes tenants (solo en desarrollo)
 */
const simulateTenant = (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return next();
  }

  const simulatedTenantId = req.headers['x-simulate-tenant'];

  if (simulatedTenantId && req.user) {
    logger.debug('Simulando tenant para desarrollo', {
      originalTenantId: req.user.organizacion_id,
      simulatedTenantId: simulatedTenantId,
      userId: req.user.id
    });

    req.user.organizacion_id = parseInt(simulatedTenantId);
    req.tenant.id = parseInt(simulatedTenantId);
  }

  next();
};

module.exports = {
  setTenantContext,
  setTenantContextFromBody,
  setTenantContextFromQuery,
  validateTenantParams,
  injectTenantId,
  verifyTenantActive,
  requirePlan,
  releaseTenantConnection,
  simulateTenant
};