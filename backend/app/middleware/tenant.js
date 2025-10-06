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

/**
 * Middleware para configurar el contexto del tenant en todas las consultas
 * Debe usarse después del middleware de autenticación
 *
 * PATRÓN ORGANIZACION_ID:
 *
 * SUPER_ADMIN:
 *   - Header X-Organization-Id (OBLIGATORIO - estándar enterprise)
 *   - Excepción: /organizaciones/:id usa params.id
 *
 * USUARIOS REGULARES:
 *   - Siempre usa organizacion_id del JWT (req.user.organizacion_id)
 */
const setTenantContext = async (req, res, next) => {
  let client;
  try {
    if (!req.user) {
      logger.error('Middleware setTenantContext usado sin usuario autenticado');
      return ResponseHelper.error(res, 'Error de configuración', 500);
    }

    let tenantId;

    logger.debug('Determinando tenant context', {
      userRol: req.user.rol,
      organizacionId: req.user.organizacion_id,
      header: req.headers?.['x-organization-id'],
      path: req.path
    });

    if (req.user.rol === 'super_admin') {
      // CASO ESPECIAL: Controller organizaciones usa params.id
      if (req.baseUrl && req.baseUrl.includes('/organizaciones') && req.params.id) {
        logger.debug('Controller organizaciones: usando params.id', { paramsId: req.params.id });
        tenantId = parseInt(req.params.id);
      } else {
        // Header X-Organization-Id (ÚNICO MÉTODO para super_admin)
        tenantId = parseInt(req.headers?.['x-organization-id']);

        if (isNaN(tenantId) || !tenantId) {
          logger.error('Super_admin: X-Organization-Id header no especificado o inválido', {
            method: req.method,
            baseUrl: req.baseUrl,
            header: req.headers['x-organization-id']
          });

          return ResponseHelper.error(res,
            'Super_admin debe especificar X-Organization-Id header',
            400
          );
        }

        logger.debug('Usando X-Organization-Id header', { tenantId });
      }
    } else if (req.user.organizacion_id) {
      logger.debug('Usando organizacion_id del usuario', { organizacionId: req.user.organizacion_id });
      tenantId = req.user.organizacion_id;
    } else {
      logger.error('No se pudo determinar tenant context', {
        userRol: req.user.rol,
        organizacionId: req.user.organizacion_id
      });
      return ResponseHelper.error(res, 'Error de configuración de tenant', 500);
    }

    logger.debug('Tenant ID final', { tenantId });

    // Inicializar objeto tenant en request
    if (!req.tenant) {
      req.tenant = {};
    }
    req.tenant.organizacionId = tenantId;

    // Obtener conexión del pool principal para configurar contexto
    client = await database.getPool('saas').connect();

    // Validar que tenant_id es numérico (prevenir SQL injection)
    if (isNaN(tenantId) || tenantId <= 0) {
      logger.error('tenant_id inválido - debe ser numérico positivo', {
        tenantId,
        type: typeof tenantId,
        userId: req.user?.id
      });
      if (client) client.release();
      return ResponseHelper.error(res, 'Configuración de tenant inválida', 500);
    }

    // Configurar el tenant ID en la sesión de base de datos
    // Esto activa automáticamente las políticas de Row Level Security
    // SEGURIDAD: Usar set_config con prepared statement (NO interpolación directa)
    await client.query('SELECT set_config($1, $2, false)',
      ['app.current_tenant_id', tenantId.toString()]
    );

    // Asegurar que RLS esté activo (por defecto debería estar en false)
    await client.query('SELECT set_config($1, $2, false)',
      ['app.bypass_rls', 'false']
    );

    // ✅ CORRECCIÓN: Liberar conexión inmediatamente después de configurar contexto
    // Los modelos configurarán RLS en sus propias transacciones
    client.release();

    logger.debug('Contexto de tenant configurado', {
      tenantId: tenantId,
      userId: req.user.id,
      userRol: req.user.rol,
      path: req.path
    });

    next();
  } catch (error) {
    // Liberar conexión en caso de error
    if (client) {
      client.release();
    }

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
    if (!req.user || !req.user.organizacion_id) {
      return ResponseHelper.error(res, 'Autenticación requerida', 401);
    }

    // Obtener conexión del pool principal para bypass RLS
    client = await database.getPool('saas').connect();

    // Configurar bypass RLS para esta consulta específica
    await client.query('SET app.bypass_rls = \'true\'');

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
      await client.query('SET app.bypass_rls = \'false\'');
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
  validateTenantParams,
  injectTenantId,
  verifyTenantActive,
  requirePlan,
  releaseTenantConnection,
  simulateTenant
};