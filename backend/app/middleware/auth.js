/**
 * @fileoverview Middleware de Autenticación JWT para sistema multi-tenant
 * @description Middleware simple y robusto para autenticación con JWT
 * @author SaaS Agendamiento
 * @version 2.0.0
 */

const jwt = require('jsonwebtoken');
const { getDb } = require('../config/database');
const logger = require('../utils/logger');
const { ResponseHelper } = require('../utils/helpers');

// Cache en memoria para la blacklist de tokens (en producción usar Redis)
const tokenBlacklist = new Set();

/**
 * Agregar token a la blacklist
 * @param {string} token - Token JWT a invalidar
 * @param {number} expiration - Tiempo de expiración del token en segundos
 */
async function addToTokenBlacklist(token, expiration = null) {
    try {
        // Almacenar en cache en memoria
        tokenBlacklist.add(token);

        // Si tenemos expiration, programar limpieza automática
        if (expiration) {
            const timeUntilExpiry = (expiration * 1000) - Date.now();
            if (timeUntilExpiry > 0) {
                setTimeout(() => {
                    tokenBlacklist.delete(token);
                    logger.debug('Token removido automáticamente de blacklist', { token: token.substring(0, 20) + '...' });
                }, timeUntilExpiry);
            }
        }

        logger.debug('Token agregado a blacklist', {
            token: token.substring(0, 20) + '...',
            blacklistSize: tokenBlacklist.size
        });
    } catch (error) {
        logger.error('Error agregando token a blacklist', { error: error.message });
        throw error;
    }
}

/**
 * Verificar si un token está en la blacklist
 * @param {string} token - Token JWT a verificar
 * @returns {boolean} - true si está en blacklist, false si no
 */
async function checkTokenBlacklist(token) {
    try {
        return tokenBlacklist.has(token);
    } catch (error) {
        logger.error('Error verificando blacklist', { error: error.message });
        return false; // Fail-open: si hay error, permitir el token
    }
}

/**
 * Middleware básico de autenticación JWT
 * Verifica el token y obtiene información del usuario
 */
const authenticateToken = async (req, res, next) => {
    try {
        // 1. Verificar que existe el header de autorización
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            logger.warn('Intento de acceso sin token', {
                ip: req.ip,
                path: req.path,
                userAgent: req.get('User-Agent')
            });
            return ResponseHelper.error(res, 'Token de autenticación requerido', 401);
        }

        // 2. Extraer y verificar el token JWT
        const token = authHeader.substring(7); // Remover "Bearer "

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (jwtError) {
            logger.warn('Token JWT inválido', {
                error: jwtError.message,
                errorType: jwtError.name,
                ip: req.ip,
                path: req.path
            });

            // Manejar diferentes tipos de errores JWT
            if (jwtError.name === 'TokenExpiredError') {
                return ResponseHelper.error(res, 'Token expirado', 401, { code: 'TOKEN_EXPIRED' });
            } else if (jwtError.name === 'JsonWebTokenError') {
                return ResponseHelper.error(res, 'Token inválido', 401, { code: 'TOKEN_INVALID' });
            } else if (jwtError.name === 'NotBeforeError') {
                return ResponseHelper.error(res, 'Token no válido aún', 401, { code: 'TOKEN_NOT_ACTIVE' });
            } else {
                return ResponseHelper.error(res, 'Token malformado', 401, { code: 'TOKEN_MALFORMED' });
            }
        }

        // 3. Verificar que el token contiene la información necesaria
        if (!decoded.userId || !decoded.email || !decoded.rol) {
            logger.error('Token JWT válido pero incompleto', {
                decoded: decoded,
                ip: req.ip,
                path: req.path
            });
            return ResponseHelper.error(res, 'Token incompleto', 401, { code: 'TOKEN_INCOMPLETE' });
        }

        // 3.5. Verificar si el token está en la blacklist (invalidado por logout)
        try {
            const tokenBlacklisted = await checkTokenBlacklist(token);
            if (tokenBlacklisted) {
                logger.warn('Intento de uso de token invalidado', {
                    userId: decoded.userId,
                    tokenId: decoded.jti || 'sin_jti',
                    ip: req.ip,
                    path: req.path
                });
                return ResponseHelper.error(res, 'Token invalidado', 401, { code: 'TOKEN_BLACKLISTED' });
            }
        } catch (blacklistError) {
            logger.error('Error verificando blacklist de tokens', {
                error: blacklistError.message,
                userId: decoded.userId
            });
            // En caso de error con blacklist, continuamos (fail-open para disponibilidad)
        }

        // 4. Obtener información básica del usuario desde la base de datos
        const db = await getDb();
        let usuario;

        try {
            // Configurar bypass RLS para consulta de autenticación
            await db.query("SET app.bypass_rls = 'true'");

            const result = await db.query(
                `SELECT id, email, nombre, apellidos, telefono, rol, organizacion_id,
                        activo, email_verificado, creado_en, actualizado_en
                 FROM usuarios
                 WHERE id = $1 AND activo = TRUE`,
                [decoded.userId]
            );

            if (result.rows.length === 0) {
                logger.warn('Usuario no encontrado o inactivo', {
                    userId: decoded.userId,
                    ip: req.ip,
                    path: req.path
                });
                return ResponseHelper.error(res, 'Usuario no autorizado', 401);
            }

            usuario = result.rows[0];

        } catch (dbError) {
            logger.error('Error consultando usuario en autenticación', {
                error: dbError.message,
                userId: decoded.userId,
                ip: req.ip,
                path: req.path
            });
            return ResponseHelper.error(res, 'Error interno del servidor', 500);
        } finally {
            // Restaurar RLS y liberar conexión
            try {
                await db.query("SET app.bypass_rls = 'false'");
            } catch (e) {
                logger.warn('Error restaurando RLS', { error: e.message });
            }
            db.release();
        }

        // 5. Verificar consistencia entre token y base de datos
        if (usuario.email !== decoded.email || usuario.rol !== decoded.rol) {
            logger.warn('Inconsistencia entre token y base de datos', {
                tokenEmail: decoded.email,
                dbEmail: usuario.email,
                tokenRol: decoded.rol,
                dbRol: usuario.rol,
                userId: usuario.id,
                ip: req.ip
            });
            return ResponseHelper.error(res, 'Token desactualizado', 401, { code: 'TOKEN_OUTDATED' });
        }

        // 6. Configurar información del usuario en el request
        req.user = {
            id: usuario.id,
            email: usuario.email,
            nombre: usuario.nombre,
            apellidos: usuario.apellidos,
            telefono: usuario.telefono,
            rol: usuario.rol,
            organizacion_id: usuario.organizacion_id,
            activo: usuario.activo,
            email_verificado: usuario.email_verificado,
            creado_en: usuario.creado_en,
            actualizado_en: usuario.actualizado_en
        };

        // 7. Log exitoso
        logger.debug('Usuario autenticado exitosamente', {
            userId: usuario.id,
            email: usuario.email,
            rol: usuario.rol,
            organizacionId: usuario.organizacion_id,
            path: req.path,
            ip: req.ip
        });

        next();

    } catch (error) {
        logger.error('Error inesperado en middleware de autenticación', {
            error: error.message,
            stack: error.stack,
            ip: req.ip,
            path: req.path
        });
        return ResponseHelper.error(res, 'Error interno del servidor', 500);
    }
};

/**
 * Middleware para requerir roles específicos
 * @param {Array|string} allowedRoles - Roles permitidos
 */
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            logger.error('requireRole usado sin autenticación previa');
            return ResponseHelper.error(res, 'Error de configuración', 500);
        }

        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

        if (!roles.includes(req.user.rol)) {
            logger.warn('Acceso denegado por rol insuficiente', {
                userId: req.user.id,
                userRol: req.user.rol,
                rolesRequeridos: roles,
                path: req.path,
                ip: req.ip
            });
            return ResponseHelper.error(res, 'Acceso denegado', 403, {
                code: 'INSUFFICIENT_ROLE',
                userRole: req.user.rol,
                requiredRoles: roles
            });
        }

        next();
    };
};

/**
 * Middleware para requerir rol de administrador
 */
const requireAdmin = (req, res, next) => {
    return requireRole(['super_admin', 'admin', 'organizacion_admin'])(req, res, next);
};

/**
 * Middleware para verificar que el usuario puede acceder a la organización
 * @param {number} organizacionId - ID de la organización a verificar
 */
const verifyOrganizationAccess = (organizacionId) => {
    return (req, res, next) => {
        if (!req.user) {
            logger.error('verifyOrganizationAccess usado sin autenticación previa');
            return ResponseHelper.error(res, 'Error de configuración', 500);
        }

        // Super admin puede acceder a cualquier organización
        if (req.user.rol === 'super_admin') {
            return next();
        }

        // Otros roles solo pueden acceder a su propia organización
        if (req.user.organizacion_id !== organizacionId) {
            logger.warn('Intento de acceso a organización no autorizada', {
                userId: req.user.id,
                userOrgId: req.user.organizacion_id,
                requestedOrgId: organizacionId,
                path: req.path,
                ip: req.ip
            });
            return ResponseHelper.error(res, 'Acceso no autorizado a esta organización', 403);
        }

        next();
    };
};

/**
 * Middleware opcional de autenticación
 * No falla si no hay token, pero autentica si existe
 */
const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // No hay token, continuar sin autenticación
        return next();
    }

    // Hay token, intentar autenticar
    return authenticateToken(req, res, next);
};

/**
 * Middleware para requerir rol de administrador
 * Verifica que el usuario tenga rol super_admin, admin u organizacion_admin
 */
const requireAdminRole = (req, res, next) => {
    if (!req.user) {
        return ResponseHelper.error(res, 'Autenticación requerida', 401);
    }

    const rolesAdmin = ['super_admin', 'admin', 'organizacion_admin'];

    if (!rolesAdmin.includes(req.user.rol)) {
        logger.warn('Intento de acceso con rol insuficiente', {
            userId: req.user.id,
            userRol: req.user.rol,
            path: req.path,
            ip: req.ip
        });
        return ResponseHelper.error(res, 'Acceso denegado. Se requieren permisos de administrador', 403, {
            code: 'INSUFFICIENT_PERMISSIONS'
        });
    }

    next();
};

module.exports = {
    authenticateToken,
    requireRole,
    requireAdmin,
    requireAdminRole,
    verifyOrganizationAccess,
    optionalAuth,
    addToTokenBlacklist,
    checkTokenBlacklist
};