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
 * SECURITY FIX (Ene 2026): Fail-Closed
 * Si no se puede verificar blacklist, el error se propaga
 * y el middleware rechaza el request con 503
 *
 * @param {string} token - Token JWT a verificar
 * @returns {Promise<boolean>} - true si está en blacklist, false si no
 * @throws {Error} - Si no se puede verificar blacklist (fail-closed)
 */
async function checkTokenBlacklist(token) {
    // SECURITY: Ya no hay try/catch - error se propaga para fail-closed
    return await tokenBlacklistService.check(token);
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
        // SECURITY FIX (Ene 2026): Fail-Closed - si no podemos verificar, rechazamos
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
            // SECURITY: Fail-closed - si no podemos verificar blacklist, rechazamos
            logger.error('Error verificando blacklist - Fail-closed', {
                error: blacklistError.message,
                code: blacklistError.code,
                userId: decoded.userId,
                ip: req.ip
            });
            return ResponseHelper.error(res, 'Servicio temporalmente no disponible', 503, {
                code: 'BLACKLIST_SERVICE_UNAVAILABLE'
            });
        }

        // 3.6. SECURITY FIX (Ene 2026): Verificar si tokens del usuario fueron invalidados
        // (por cambio de rol o permisos)
        if (decoded.iat) {
            try {
                const userTokensInvalidated = await tokenBlacklistService.isUserTokenInvalidated(
                    decoded.userId,
                    decoded.iat
                );

                if (userTokensInvalidated) {
                    logger.warn('Token invalidado por cambio de permisos', {
                        userId: decoded.userId,
                        tokenIat: decoded.iat,
                        ip: req.ip,
                        path: req.path
                    });
                    return ResponseHelper.error(res, 'Sesión invalidada. Inicia sesión nuevamente.', 401, {
                        code: 'SESSION_INVALIDATED'
                    });
                }
            } catch (invalidationError) {
                logger.error('Error verificando invalidación de usuario', {
                    error: invalidationError.message,
                    userId: decoded.userId
                });
                // Este check es secundario, si falla continuamos
                // (el check de blacklist principal ya pasó)
            }
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
            sucursal_id: decoded.sucursalId || null, // Sucursal del JWT
            activo: usuario.activo,
            email_verificado: usuario.email_verificado,
            creado_en: usuario.creado_en,
            actualizado_en: usuario.actualizado_en
        };

        // 6.5. SECURITY FIX (Ene 2026): Validar que usuario aún tiene acceso a la sucursal del token
        if (decoded.sucursalId) {
            const dbSucursal = await getDb();
            try {
                await dbSucursal.query("SELECT set_config('app.bypass_rls', 'true', false)");

                const sucursalValida = await dbSucursal.query(`
                    SELECT 1 FROM usuarios_sucursales
                    WHERE usuario_id = $1 AND sucursal_id = $2 AND activo = true
                `, [usuario.id, decoded.sucursalId]);

                if (sucursalValida.rows.length === 0) {
                    logger.warn('Token con sucursal revocada', {
                        userId: usuario.id,
                        sucursalId: decoded.sucursalId,
                        ip: req.ip,
                        path: req.path
                    });
                    return ResponseHelper.error(res, 'Acceso a sucursal revocado', 401, {
                        code: 'SUCURSAL_ACCESS_REVOKED'
                    });
                }
            } catch (sucursalError) {
                logger.error('Error verificando acceso a sucursal', {
                    error: sucursalError.message,
                    userId: usuario.id,
                    sucursalId: decoded.sucursalId
                });
                // Si no podemos verificar, continuamos (la sucursal puede no existir aún en nueva org)
            } finally {
                try {
                    await dbSucursal.query("SELECT set_config('app.bypass_rls', 'false', false)");
                } catch (e) { /* ignore */ }
                dbSucursal.release();
            }
        }

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
 *
 * MODELO DE SEGURIDAD (Nov 2025):
 * - TODOS los usuarios (incluido super_admin) solo pueden acceder a SU organización
 * - Super_admin tiene acceso extra al panel /superadmin/* pero NO a datos de otros tenants
 *
 * @param {number} organizacionId - ID de la organización a verificar
 */
const verifyOrganizationAccess = (organizacionId) => {
    return (req, res, next) => {
        if (!req.user) {
            logger.error('verifyOrganizationAccess usado sin autenticación previa');
            return ResponseHelper.error(res, 'Error de configuración', 500);
        }

        // TODOS los usuarios solo pueden acceder a su propia organización
        // (incluido super_admin - modelo de seguridad Nov 2025)
        if (req.user.organizacion_id !== organizacionId) {
            logger.warn('Intento de acceso a organización no autorizada', {
                userId: req.user.id,
                userRol: req.user.rol,
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