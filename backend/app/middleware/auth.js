/**
 * @fileoverview Middleware de Autenticación JWT Enterprise Multi-Tenant
 *
 * Sistema completo de autenticación y autorización para arquitectura SaaS multi-tenant.
 * Maneja verificación de tokens JWT, control de roles, aislamiento de datos por
 * organización y configuración automática de contexto para Row Level Security.
 *
 * Características principales:
 * - Verificación JWT con access y refresh tokens
 * - Sistema de roles jerárquico (super_admin > admin > propietario > empleado > cliente)
 * - Aislamiento automático multi-tenant via PostgreSQL RLS
 * - Configuración de contexto de base de datos por request
 * - Validación de organizaciones activas y suscripciones vigentes
 * - Logging detallado de eventos de seguridad
 *
 * @author Backend Team
 * @version 1.0.0
 * @since 2025-09-17
 */

const { getDb } = require('../config/database');
const UsuarioModel = require('../database/usuario.model');
const logger = require('../utils/logger');
const { ResponseHelper } = require('../utils/helpers');
const jwt = require('jsonwebtoken');

/**
 * Middleware principal de autenticación JWT con contexto multi-tenant
 *
 * Realiza autenticación completa del usuario y configuración automática del
 * contexto multi-tenant. Este es el middleware core que debe usarse en todas
 * las rutas que requieren autenticación.
 *
 * Flujo de autenticación:
 * 1. Extrae token del header Authorization
 * 2. Verifica y decodifica el JWT
 * 3. Consulta información completa del usuario y organización
 * 4. Verifica que usuario y organización estén activos
 * 5. Configura contexto de tenant en PostgreSQL (RLS)
 * 6. Inyecta req.user y req.tenant para middlewares posteriores
 *
 * @async
 * @param {import('express').Request} req - Request de Express
 * @param {import('express').Response} res - Response de Express
 * @param {import('express').NextFunction} next - Función next de Express
 *
 * @example
 * // Uso básico en rutas protegidas
 * router.get('/profile', authenticateToken, (req, res) => {
 *   console.log(req.user.id);           // ID del usuario
 *   console.log(req.tenant.id);         // ID de la organización
 * });
 *
 * @example
 * // req.user contendrá:
 * {
 *   id: 123,
 *   email: 'admin@empresa.com',
 *   nombre: 'Juan Pérez',
 *   rol: 'admin',
 *   organizacion_id: 456,
 *   organizacion_nombre: 'Barbería El Corte'
 * }
 *
 * @example
 * // req.tenant contendrá:
 * {
 *   id: 456,
 *   nombre: 'Barbería El Corte'
 * }
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Extraer token del header
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Token de autenticación faltante', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path
      });
      return ResponseHelper.error(res, 'Token de autenticación requerido', 401);
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    // Verificar y decodificar token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Obtener información completa del usuario usando nuestro modelo
    const usuario = await UsuarioModel.buscarPorId(decoded.userId);

    if (!usuario || !usuario.activo) {
      logger.warn('Usuario no encontrado o inactivo', {
        userId: decoded.userId,
        ip: req.ip
      });
      return ResponseHelper.error(res, 'Usuario no autorizado', 401);
    }

    // Verificar que la organización esté activa (excepto super_admin)
    if (usuario.rol !== 'super_admin' && !usuario.organizacion_activa) {
      logger.warn('Organización inactiva', {
        userId: usuario.id,
        organizacionId: usuario.organizacion_id,
        ip: req.ip
      });
      return ResponseHelper.error(res, 'Organización suspendida', 403);
    }

    // Configurar contexto multi-tenant en la base de datos
    const db = getDb('saas');
    if (usuario.organizacion_id) {
      await db.query('SET app.current_tenant_id = $1', [usuario.organizacion_id]);
      await db.query('SET app.current_user_id = $1', [usuario.id]);
    }

    // Agregar información al request
    req.user = {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      apellidos: usuario.apellidos,
      telefono: usuario.telefono,
      rol: usuario.rol,
      organizacion_id: usuario.organizacion_id,
      organizacion_nombre: usuario.organizacion_nombre,
      codigo_tenant: usuario.codigo_tenant,
      tipo_industria: usuario.tipo_industria
    };

    req.tenant = {
      id: usuario.organizacion_id,
      nombre: usuario.organizacion_nombre,
      codigo: usuario.codigo_tenant,
      tipo_industria: usuario.tipo_industria
    };

    // Configurar contexto RLS para la sesión actual
    try {
      const UsuarioModel = require('../database/usuario.model');
      const { getDb } = require('../config/database');
      const db = await getDb();
      try {
        await UsuarioModel.configurarContextoRLS(db, usuario.id, usuario.rol, usuario.organizacion_id);
      } finally {
        db.release();
      }
    } catch (error) {
      logger.warn('Error configurando contexto RLS en middleware', { error: error.message });
    }

    logger.debug('Usuario autenticado exitosamente', {
      userId: usuario.id,
      email: usuario.email,
      organizacionId: usuario.organizacion_id,
      path: req.path
    });

    next();
  } catch (error) {
    logger.error('Error en autenticación', {
      error: error.message,
      ip: req.ip,
      path: req.path
    });

    // Manejar errores específicos de JWT
    if (error.name === 'TokenExpiredError') {
      return ResponseHelper.error(res, 'Token expirado', 401, { code: 'TOKEN_EXPIRED' });
    } else if (error.name === 'JsonWebTokenError') {
      return ResponseHelper.error(res, 'Token inválido', 401, { code: 'TOKEN_INVALID' });
    } else if (error.name === 'NotBeforeError') {
      return ResponseHelper.error(res, 'Token no válido aún', 401, { code: 'TOKEN_NOT_ACTIVE' });
    } else {
      return ResponseHelper.error(res, 'Error de autenticación', 500);
    }
  }
};

/**
 * Middleware para verificar roles específicos
 * @param {Array|string} allowedRoles - Roles permitidos
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      logger.error('Middleware requireRole usado sin autenticación previa');
      return ResponseHelper.error(res, 'Error de configuración', 500);
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(req.user.rol)) {
      logger.warn('Acceso denegado por rol insuficiente', {
        userId: req.user.id,
        userRole: req.user.rol,
        requiredRoles: roles,
        path: req.path
      });
      return ResponseHelper.error(res, 'Permisos insuficientes', 403);
    }

    logger.debug('Autorización por rol exitosa', {
      userId: req.user.id,
      userRole: req.user.rol,
      path: req.path
    });

    next();
  };
};

/**
 * Middleware para rutas que requieren autenticación de administrador
 */
const requireAdmin = requireRole(['admin', 'super_admin']);

/**
 * Middleware para rutas que requieren autenticación de propietario o administrador
 */
const requireOwnerOrAdmin = requireRole(['propietario', 'admin', 'super_admin']);

/**
 * Middleware opcional de autenticación
 * No bloquea si no hay token, pero si hay token lo valida
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = auth.extractTokenFromHeader(authHeader);

    if (!token) {
      // No hay token, continuar sin autenticación
      req.user = null;
      req.tenant = null;
      return next();
    }

    // Hay token, intentar autenticar
    return authenticateToken(req, res, next);
  } catch (error) {
    // Si hay error en autenticación opcional, continuar sin autenticación
    logger.debug('Error en autenticación opcional, continuando sin auth', {
      error: error.message,
      path: req.path
    });
    req.user = null;
    req.tenant = null;
    next();
  }
};

/**
 * Middleware para verificar que el usuario pertenece a la organización correcta
 * Útil para endpoints que reciben organizacion_id como parámetro
 */
const verifyTenantAccess = (req, res, next) => {
  if (!req.user) {
    return ResponseHelper.error(res, 'Autenticación requerida', 401);
  }

  const requestedOrgId = req.params.organizacion_id || req.body.organizacion_id;

  if (requestedOrgId && parseInt(requestedOrgId) !== req.user.organizacion_id) {
    logger.warn('Intento de acceso a organización no autorizada', {
      userId: req.user.id,
      userOrgId: req.user.organizacion_id,
      requestedOrgId: requestedOrgId,
      path: req.path
    });
    return ResponseHelper.error(res, 'Acceso a organización no autorizado', 403);
  }

  next();
};

/**
 * Middleware para refrescar tokens (actualizado para usar UsuarioModel)
 */
const refreshToken = async (req, res, next) => {
  try {
    const refreshTokenValue = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshTokenValue) {
      return ResponseHelper.error(res, 'Refresh token requerido', 400);
    }

    // Usar el método del modelo para refrescar token
    const resultado = await UsuarioModel.refrescarToken(refreshTokenValue);

    logger.info('Tokens renovados exitosamente via middleware');

    return ResponseHelper.success(res, resultado, 'Tokens renovados exitosamente');

  } catch (error) {
    logger.error('Error renovando tokens', { error: error.message });

    // Limpiar cookie si el refresh token es inválido
    res.clearCookie('refreshToken');

    return ResponseHelper.error(res, 'Error renovando tokens', 401);
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireOwnerOrAdmin,
  optionalAuth,
  verifyTenantAccess,
  refreshToken
};