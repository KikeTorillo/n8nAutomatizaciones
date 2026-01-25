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
        // FASE 7 COMPLETADA: Solo rolId (sistema dinámico)
        if (!decoded.userId || !decoded.email || !decoded.rolId) {
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

            // Incluir información del rol dinámico
            const result = await db.query(
                `SELECT
                    u.id, u.email, u.nombre, u.apellidos, u.telefono,
                    u.rol_id, u.organizacion_id,
                    u.activo, u.email_verificado, u.creado_en, u.actualizado_en,
                    r.codigo AS rol_codigo,
                    r.nombre AS rol_nombre,
                    r.nivel_jerarquia,
                    r.bypass_permisos,
                    r.es_rol_sistema,
                    r.puede_crear_usuarios,
                    r.puede_modificar_permisos
                 FROM usuarios u
                 LEFT JOIN roles r ON r.id = u.rol_id
                 WHERE u.id = $1 AND u.activo = TRUE`,
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
            // ✅ FIX v2.1: Si cleanup falla, destruir conexión para evitar pool contamination
            let cleanupSuccess = false;
            try {
                await db.query('SELECT set_config($1, $2, false)', ['app.bypass_rls', 'false']);
                cleanupSuccess = true;
            } catch (e) {
                logger.error('Error CRÍTICO restaurando RLS - destruyendo conexión', { error: e.message });
            }

            if (cleanupSuccess) {
                db.release();
            } else {
                // SECURITY: Destruir conexión contaminada, NO devolverla al pool
                db.release(new Error('RLS cleanup failed - connection contaminated'));
            }
        }

        // 5. Verificar consistencia entre token y base de datos
        // ✅ SECURITY FIX: Usar comparación de tiempo constante para prevenir timing attacks
        const emailMatch = timingSafeStringCompare(usuario.email, decoded.email);

        // FASE 7 COMPLETADA: Solo verificar rol_id
        const rolMatch = String(usuario.rol_id) === String(decoded.rolId);

        if (!emailMatch || !rolMatch) {
            logger.warn('Inconsistencia entre token y base de datos', {
                tokenEmail: decoded.email,
                dbEmail: usuario.email,
                tokenRolId: decoded.rolId,
                dbRolId: usuario.rol_id,
                userId: usuario.id,
                ip: req.ip
            });
            return ResponseHelper.error(res, 'Token desactualizado', 401, { code: 'TOKEN_OUTDATED' });
        }

        // 6. Configurar información del usuario en el request
        // FASE 7 COMPLETADA: Solo sistema de roles dinámicos
        req.user = {
            id: usuario.id,
            email: usuario.email,
            nombre: usuario.nombre,
            apellidos: usuario.apellidos,
            telefono: usuario.telefono,
            // Sistema de roles dinámicos
            rol_id: usuario.rol_id,                                // FK a tabla roles
            rol_codigo: usuario.rol_codigo,                        // Código del rol para lógica
            rol_nombre: usuario.rol_nombre,                        // Nombre legible
            nivel_jerarquia: usuario.nivel_jerarquia || 10,        // Nivel jerárquico (default: empleado)
            bypass_permisos: usuario.bypass_permisos || false,     // Si tiene bypass de RBAC
            es_rol_sistema: usuario.es_rol_sistema || false,       // Si es super_admin o bot
            puede_crear_usuarios: usuario.puede_crear_usuarios || false,
            puede_modificar_permisos: usuario.puede_modificar_permisos || false,
            // Contexto
            organizacion_id: usuario.organizacion_id,
            sucursal_id: decoded.sucursalId || null,
            // Estado
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
                // ✅ FIX v2.1: Si cleanup falla, destruir conexión para evitar pool contamination
                let cleanupSuccess = false;
                try {
                    await dbSucursal.query("SELECT set_config('app.bypass_rls', 'false', false)");
                    cleanupSuccess = true;
                } catch (e) {
                    logger.error('Error CRÍTICO restaurando RLS (sucursal) - destruyendo conexión', { error: e.message });
                }

                if (cleanupSuccess) {
                    dbSucursal.release();
                } else {
                    dbSucursal.release(new Error('RLS cleanup failed - connection contaminated'));
                }
            }
        }

        // 7. Log exitoso
        logger.debug('Usuario autenticado exitosamente', {
            userId: usuario.id,
            email: usuario.email,
            rol_codigo: usuario.rol_codigo,
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
 * FASE 7 COMPLETADA: Solo usa rol_codigo del sistema dinámico
 * @param {Array|string} allowedRoles - Roles permitidos (códigos)
 */
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            logger.error('requireRole usado sin autenticación previa');
            return ResponseHelper.error(res, 'Error de configuración', 500);
        }

        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
        const userRolCodigo = req.user.rol_codigo;

        // super_admin siempre tiene acceso (bypass)
        const isSuperAdmin = userRolCodigo === 'super_admin';

        if (!isSuperAdmin && !roles.includes(userRolCodigo)) {
            logger.warn('Acceso denegado por rol insuficiente', {
                userId: req.user.id,
                userRol: userRolCodigo,
                nivel_jerarquia: req.user.nivel_jerarquia,
                rolesRequeridos: roles,
                path: req.path,
                ip: req.ip
            });
            return ResponseHelper.error(res, 'Acceso denegado', 403, {
                code: 'INSUFFICIENT_ROLE',
                userRole: userRolCodigo,
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
                userRol: req.user.rol_codigo,
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
 * Middleware para requerir nivel jerárquico mínimo (reemplaza requireRole)
 *
 * Niveles de referencia:
 * - 100: super_admin
 * - 90: admin
 * - 80: propietario
 * - 50: manager/empleado_senior
 * - 10: empleado
 * - 5: cliente
 *
 * @param {number} nivelMinimo - Nivel jerárquico mínimo requerido
 */
const requireMinLevel = (nivelMinimo) => {
    const { RolHelper } = require('../utils/helpers');

    return (req, res, next) => {
        if (!req.user) {
            logger.error('requireMinLevel usado sin autenticación previa');
            return ResponseHelper.error(res, 'Error de configuración', 500);
        }

        // Bypass para super_admin o roles con bypass_permisos
        if (req.user.bypass_permisos || RolHelper.esSuperAdmin(req.user)) {
            return next();
        }

        if (!RolHelper.tieneNivelMinimo(req.user, nivelMinimo)) {
            logger.warn('Acceso denegado por nivel insuficiente', {
                userId: req.user.id,
                userRol: req.user.rol_codigo,
                nivel_usuario: req.user.nivel_jerarquia,
                nivel_requerido: nivelMinimo,
                path: req.path,
                ip: req.ip
            });
            return ResponseHelper.error(res, 'Acceso denegado', 403, {
                code: 'INSUFFICIENT_LEVEL',
                userLevel: req.user.nivel_jerarquia,
                requiredLevel: nivelMinimo
            });
        }
        next();
    };
};

/**
 * Aliases para legibilidad común
 * - requireOwner: nivel 80+ (propietario, admin, super_admin)
 * - requireManager: nivel 50+ (manager, propietario, admin, super_admin)
 */
const requireOwner = () => requireMinLevel(80);
const requireManager = () => requireMinLevel(50);

/**
 * Middleware para requerir rol de administrador
 * FASE 7 COMPLETADA: Usa bypass_permisos o nivel_jerarquia >= 80
 */
const requireAdminRole = (req, res, next) => {
    if (!req.user) {
        return ResponseHelper.error(res, 'Autenticación requerida', 401);
    }

    // Verificar bypass_permisos o nivel jerárquico >= 80 (admin/propietario)
    const tieneAcceso = req.user.bypass_permisos || (req.user.nivel_jerarquia >= 80);

    if (!tieneAcceso) {
        logger.warn('Intento de acceso con rol insuficiente', {
            userId: req.user.id,
            userRol: req.user.rol_codigo,
            nivel_jerarquia: req.user.nivel_jerarquia,
            bypass_permisos: req.user.bypass_permisos,
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
 * Usa nivel jerárquico >= 80 o bypass_permisos (igual que requireAdminRole)
 */
const requireOwnerOrAdmin = (req, res, next) => {
    // Usa la misma lógica que requireAdminRole
    return requireAdminRole(req, res, next);
};

module.exports = {
    authenticateToken,
    requireRole,
    requireMinLevel,
    requireOwner,
    requireManager,
    requireAdmin,
    requireAdminRole,
    requireOwnerOrAdmin,
    verifyOrganizationAccess,
    optionalAuth,
    addToTokenBlacklist,
    checkTokenBlacklist
};