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
 */
const setTenantContext = async (req, res, next) => {
  try {
    if (!req.user || !req.user.organizacion_id) {
      logger.error('Middleware setTenantContext usado sin usuario autenticado');
      return ResponseHelper.error(res, 'Error de configuración', 500);
    }

    // Configurar el tenant ID en la sesión de base de datos
    // Esto activa automáticamente las políticas de Row Level Security
    await database.query('SET app.current_tenant_id = $1', [req.user.organizacion_id]);

    logger.debug('Contexto de tenant configurado', {
      tenantId: req.user.organizacion_id,
      userId: req.user.id,
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
  try {
    if (!req.user || !req.user.organizacion_id) {
      return ResponseHelper.error(res, 'Autenticación requerida', 401);
    }

    const result = await database.query(
      'SELECT activo, plan, fecha_vencimiento FROM organizaciones WHERE id = $1',
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

    if (!organizacion.activo) {
      logger.warn('Intento de acceso con organización inactiva', {
        organizacionId: req.user.organizacion_id,
        userId: req.user.id
      });
      return ResponseHelper.error(res, 'Organización suspendida', 403, {
        code: 'ORGANIZATION_SUSPENDED'
      });
    }

    // Verificar si la suscripción está vencida
    if (organizacion.fecha_vencimiento) {
      const now = new Date();
      const vencimiento = new Date(organizacion.fecha_vencimiento);

      if (now > vencimiento) {
        logger.warn('Intento de acceso con suscripción vencida', {
          organizacionId: req.user.organizacion_id,
          userId: req.user.id,
          fechaVencimiento: organizacion.fecha_vencimiento
        });
        return ResponseHelper.error(res, 'Suscripción vencida', 403, {
          code: 'SUBSCRIPTION_EXPIRED',
          fechaVencimiento: organizacion.fecha_vencimiento
        });
      }
    }

    // Agregar información de la organización al request
    req.tenant.plan = organizacion.plan;
    req.tenant.fecha_vencimiento = organizacion.fecha_vencimiento;

    next();
  } catch (error) {
    logger.error('Error verificando estado de organización', {
      error: error.message,
      organizacionId: req.user?.organizacion_id,
      userId: req.user?.id
    });
    return ResponseHelper.error(res, 'Error interno del servidor', 500);
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
  simulateTenant
};