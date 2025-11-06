/**
 * @fileoverview Middleware de Autenticación JWT para sistema multi-tenant
 * @description Middleware simple y robusto para autenticación con JWT
 * @author SaaS Agendamiento
 * @version 2.0.0
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { getDb } = require('../config/database');
const logger = require('../utils/logger');
const { ResponseHelper } = require('../utils/helpers');
const tokenBlacklistService = require('../services/tokenBlacklistService');

/**
 * Agregar token a la blacklist
 *
 * ✅ FIX v2.0: Migrado de Set en memoria a Redis (DB 3)
 * - Persiste en disco (sobrevive a restarts)
 * - Compartido entre instancias (horizontal scaling)
 * - TTL automático (Redis elimina tokens expirados)
 *
 * @param {string} token - Token JWT a invalidar
 * @param {number} expiration - Tiempo de expiración del token en segundos (para TTL)
 */
async function addToTokenBlacklist(token, expiration = null) {
    try {
        // Usar servicio de Redis en lugar de Set en memoria
        await tokenBlacklistService.add(token, expiration);

        const size = await tokenBlacklistService.size();
        logger.debug('Token agregado a blacklist (Redis)', {
            token: token.substring(0, 20) + '...',
            blacklistSize: size,
            ttl: expiration || 'default'
        });
    } catch (error) {
        logger.error('Error agregando token a blacklist', { error: error.message });
        throw error;
    }
}

/**
 * Verificar si un token está en la blacklist
 *
 * ✅ FIX v2.0: Migrado de Set en memoria a Redis (DB 3)
 * Verifica en Redis (persistente) en lugar de Set en memoria
 *
 * @param {string} token - Token JWT a verificar
 * @returns {Promise<boolean>} - true si está en blacklist, false si no
 */
async function checkTokenBlacklist(token) {
    try {
        return await tokenBlacklistService.check(token);
    } catch (error) {
        logger.error('Error verificando blacklist', { error: error.message });
        return false; // Fail-open: si hay error, permitir el token
    }
}

/**
 * Comparación segura de strings resistente a timing attacks
 * Usa crypto.timingSafeEqual para garantizar tiempo constante
 *
 * @param {string} str1 - Primer string a comparar
 * @param {string} str2 - Segundo string a comparar
 * @returns {boolean} - true si son iguales, false si no
 *
 * @security Previene timing attacks que podrían revelar información
 * sobre el contenido de strings sensibles (emails, roles, etc.)
 * mediante análisis de tiempos de respuesta
 */
function timingSafeStringCompare(str1, str2) {
    try {
        // Validar que ambos parámetros sean strings
        if (typeof str1 !== 'string' || typeof str2 !== 'string') {
            return false;
        }

        // Si las longitudes son diferentes, ya sabemos que no son iguales
        // Pero aún hacemos la comparación con padding para mantener tiempo constante
        const maxLen = Math.max(str1.length, str2.length);

        // Padding con espacios nulos para igualar longitudes
        // Esto es necesario porque timingSafeEqual requiere buffers del mismo tamaño
        const paddedStr1 = str1.padEnd(maxLen, '\0');
        const paddedStr2 = str2.padEnd(maxLen, '\0');

        // Convertir a buffers
        const buf1 = Buffer.from(paddedStr1, 'utf8');
        const buf2 = Buffer.from(paddedStr2, 'utf8');

        // Comparación de tiempo constante
        // Esta función siempre toma el mismo tiempo sin importar dónde estén las diferencias
        return crypto.timingSafeEqual(buf1, buf2);

    } catch (error) {
        // Si hay algún error (ej: buffers de diferente tamaño), retornar false
        logger.error('Error en comparación segura de strings', {
            error: error.message,
            str1Length: str1?.length,
            str2Length: str2?.length
        });
        return false;
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
            // ✅ FIX: Usar set_config en lugar de SET para que sea local a la transacción
            await db.query('SELECT set_config($1, $2, false)', ['app.bypass_rls', 'true']);

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
            // ✅ FIX: Usar set_config en lugar de SET (aunque ya no es necesario porque set_config es local)
            try {
                await db.query('SELECT set_config($1, $2, false)', ['app.bypass_rls', 'false']);
            } catch (e) {
                logger.warn('Error restaurando RLS', { error: e.message });
            }
            db.release();
        }

        // 5. Verificar consistencia entre token y base de datos
        // ✅ SECURITY FIX: Usar comparación de tiempo constante para prevenir timing attacks
        // Un atacante no debe poder deducir información sobre email/rol mediante análisis de tiempos
        const emailMatch = timingSafeStringCompare(usuario.email, decoded.email);
        const rolMatch = timingSafeStringCompare(usuario.rol, decoded.rol);

        if (!emailMatch || !rolMatch) {
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
 * Verifica que el usuario tenga rol super_admin, admin, propietario u organizacion_admin
 */
const requireAdminRole = (req, res, next) => {
    if (!req.user) {
        return ResponseHelper.error(res, 'Autenticación requerida', 401);
    }

    const rolesAdmin = ['super_admin', 'admin', 'propietario', 'organizacion_admin'];

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

/**
 * Middleware para requerir rol de propietario o admin
 * Verifica que el usuario tenga rol super_admin, admin o propietario
 */
const requireOwnerOrAdmin = (req, res, next) => {
    return requireRole(['super_admin', 'admin', 'propietario'])(req, res, next);
};

module.exports = {
    authenticateToken,
    requireRole,
    requireAdmin,
    requireAdminRole,
    requireOwnerOrAdmin,
    verifyOrganizationAccess,
    optionalAuth,
    addToTokenBlacklist,
    checkTokenBlacklist
};