/**
 * @fileoverview Middleware de Verificación de Permisos
 * @description Middleware para verificar permisos usando el sistema normalizado
 * @version 2.0.0
 * @date Enero 2026
 *
 * Características v2:
 * - Cache distribuido con Redis Pub/Sub (DB 4)
 * - Sincronización en tiempo real entre instancias
 * - Fallback automático a cache local
 */

const { getDb } = require('../config/database');
const logger = require('../utils/logger');
const { ResponseHelper } = require('../utils/helpers');
const permisosCacheService = require('../services/permisosCacheService');
const sucursalCacheService = require('../services/sucursalCacheService');

/**
 * Obtiene sucursalId de la request con prioridad expl\u00edcita
 *
 * PRIORIDAD (de mayor a menor):
 * 1. params.sucursalId o params.sucursal_id (ruta con :sucursalId)
 * 2. query.sucursalId o query.sucursal_id (query string)
 * 3. body.sucursalId o body.sucursal_id (body del request)
 * 4. user.sucursal_id (sucursal por defecto del usuario)
 *
 * @param {import('express').Request} req - Request de Express
 * @param {Object} options - Opciones adicionales
 * @param {boolean} options.usarSucursalDeParams - Forzar uso de params
 * @param {boolean} options.usarSucursalDeQuery - Forzar uso de query
 * @returns {{ sucursalId: number|null, source: string }} Objeto con sucursalId y fuente
 */
function obtenerSucursalId(req, options = {}) {
    let sucursalId = null;
    let source = 'none';

    // 1. Params (prioridad m\u00e1s alta si est\u00e1 habilitado o siempre presente)
    if (options.usarSucursalDeParams || req.params.sucursalId || req.params.sucursal_id) {
        const paramValue = req.params.sucursalId || req.params.sucursal_id;
        if (paramValue) {
            sucursalId = parseInt(paramValue);
            source = 'params';
        }
    }

    // 2. Query (si no se encontr\u00f3 en params)
    if (!sucursalId && (options.usarSucursalDeQuery || req.query.sucursalId || req.query.sucursal_id)) {
        const queryValue = req.query.sucursalId || req.query.sucursal_id;
        if (queryValue) {
            sucursalId = parseInt(queryValue);
            source = 'query';
        }
    }

    // 3. Body (si no se encontr\u00f3 antes)
    if (!sucursalId && req.body) {
        const bodyValue = req.body.sucursalId || req.body.sucursal_id;
        if (bodyValue) {
            sucursalId = parseInt(bodyValue);
            source = 'body';
        }
    }

    // 4. User default (fallback)
    if (!sucursalId && req.user?.sucursal_id) {
        sucursalId = parseInt(req.user.sucursal_id);
        source = 'user_default';
    }

    // Validar que sea un n\u00famero positivo
    if (sucursalId && (isNaN(sucursalId) || sucursalId <= 0)) {
        logger.warn('[Permisos] sucursalId inv\u00e1lido', {
            rawValue: req.params.sucursalId || req.query.sucursalId || req.body?.sucursalId,
            source,
            parsed: sucursalId
        });
        sucursalId = null;
        source = 'invalid';
    }

    return { sucursalId, source };
}

/**
 * Valida que una sucursal pertenezca a la organización del usuario
 * ✅ SECURITY FIX v2.1: Previene acceso a sucursales de otras organizaciones
 * ✅ PERFORMANCE v2.2: Cache en memoria con TTL de 5 minutos
 *
 * @param {number} sucursalId - ID de la sucursal a validar
 * @param {number} organizacionId - ID de la organización del usuario
 * @returns {Promise<boolean>} true si la sucursal pertenece a la organización
 */
async function validarSucursalPerteneceAOrganizacion(sucursalId, organizacionId) {
    // Usa cache service con TTL de 5 minutos
    return await sucursalCacheService.validarSucursalPerteneceAOrg(sucursalId, organizacionId);
}

/**
 * Verificar si usuario tiene un permiso (con cache Redis + fallback local)
 * @param {number} usuarioId
 * @param {number} sucursalId
 * @param {string} codigoPermiso
 * @returns {Promise<boolean>}
 */
async function tienePermiso(usuarioId, sucursalId, codigoPermiso) {
    // Verificar cache (Redis o local)
    const cached = await permisosCacheService.get(usuarioId, sucursalId, codigoPermiso);

    if (cached.found) {
        return cached.valor;
    }

    // Consultar BD
    const db = await getDb();
    try {
        const result = await db.query(
            'SELECT tiene_permiso($1, $2, $3) as tiene',
            [usuarioId, sucursalId, codigoPermiso]
        );
        const tiene = result.rows[0]?.tiene === true;

        // Guardar en cache (Redis + local)
        await permisosCacheService.set(usuarioId, sucursalId, codigoPermiso, tiene);

        return tiene;
    } finally {
        db.release();
    }
}

/**
 * Obtener valor numérico de un permiso (con cache Redis + fallback local)
 * @param {number} usuarioId
 * @param {number} sucursalId
 * @param {string} codigoPermiso
 * @returns {Promise<number>}
 */
async function obtenerValorNumerico(usuarioId, sucursalId, codigoPermiso) {
    // Usar prefijo 'num:' para diferenciar de permisos boolean
    const codigoConPrefijo = `num:${codigoPermiso}`;
    const cached = await permisosCacheService.get(usuarioId, sucursalId, codigoConPrefijo);

    if (cached.found) {
        return cached.valor;
    }

    const db = await getDb();
    try {
        const result = await db.query(
            'SELECT obtener_valor_permiso_numerico($1, $2, $3) as valor',
            [usuarioId, sucursalId, codigoPermiso]
        );
        const valor = result.rows[0]?.valor || 0;

        await permisosCacheService.set(usuarioId, sucursalId, codigoConPrefijo, valor);

        return valor;
    } finally {
        db.release();
    }
}

/**
 * Valida y adjunta sucursal al request
 * Función interna que consolida la lógica de validación de sucursal
 * usada en todos los middlewares de permisos
 *
 * @param {import('express').Request} req - Request de Express
 * @param {import('express').Response} res - Response de Express
 * @param {Object} options - Opciones de obtención de sucursal
 * @param {string} contextName - Nombre del contexto para logging
 * @param {string|string[]} permisoInfo - Permiso(s) para auditoría de super_admin
 * @returns {Promise<{success: boolean, sucursalId?: number, isSuperAdmin?: boolean}>}
 */
async function validarYAdjuntarSucursal(req, res, options, contextName, permisoInfo) {
    const usuarioId = req.user?.id;

    if (!usuarioId) {
        ResponseHelper.error(res, 'Usuario no autenticado', 401);
        return { success: false };
    }

    // Bypass de permisos ANTES de validar sucursal: super_admin no necesita sucursal
    // Usa propiedad bypass_permisos del nuevo sistema de roles
    if (req.user.bypass_permisos || req.user.rol === 'super_admin') {
        logger.warn(`[Permisos] Bypass de permisos (pre-sucursal) - ${contextName}`, {
            usuario_id: usuarioId,
            email: req.user.email,
            rol_codigo: req.user.rol_codigo,
            nivel_jerarquia: req.user.nivel_jerarquia,
            permiso: permisoInfo,
            ruta: req.originalUrl,
            ip: req.ip
        });
        return { success: true, sucursalId: null, isSuperAdmin: true };
    }

    // Obtener sucursalId usando helper consolidado
    const { sucursalId, source } = obtenerSucursalId(req, options);

    if (!sucursalId) {
        logger.debug(`[Permisos] sucursalId no encontrado (${contextName})`, {
            source,
            options,
            path: req.originalUrl
        });
        ResponseHelper.error(res, 'Se requiere una sucursal para verificar permisos', 400);
        return { success: false };
    }

    // Adjuntar info de sucursal al request
    req.sucursalId = sucursalId;
    req.sucursalSource = source;

    // Bypass adicional para roles con bypass_permisos que SÍ tienen sucursal
    if (req.user.bypass_permisos) {
        logger.warn(`[Permisos] Bypass de permisos - ${contextName}`, {
            usuario_id: usuarioId,
            email: req.user.email,
            rol_codigo: req.user.rol_codigo,
            nivel_jerarquia: req.user.nivel_jerarquia,
            sucursal_id: sucursalId,
            permiso: permisoInfo,
            ruta: req.originalUrl,
            ip: req.ip
        });
        return { success: true, sucursalId, isSuperAdmin: true };
    }

    // Validar que sucursal pertenece a la organización del usuario
    const sucursalValida = await validarSucursalPerteneceAOrganizacion(
        sucursalId,
        req.user.organizacion_id
    );

    if (!sucursalValida) {
        logger.warn('[Permisos] Intento de acceso a sucursal de otra organización', {
            usuario_id: usuarioId,
            organizacion_id: req.user.organizacion_id,
            sucursal_id: sucursalId,
            source,
            ruta: req.originalUrl,
            ip: req.ip
        });
        ResponseHelper.error(res, 'Sucursal no válida para esta organización', 403);
        return { success: false };
    }

    return { success: true, sucursalId, isSuperAdmin: false };
}

/**
 * Limpiar cache de un usuario específico (con Pub/Sub para sincronizar instancias)
 * Llamar después de modificar permisos
 * @param {number} usuarioId
 */
async function invalidarCacheUsuario(usuarioId) {
    await permisosCacheService.invalidarUsuario(usuarioId);
    logger.debug('[Permisos] Cache invalidado para usuario', { usuarioId });
}

/**
 * Limpiar cache de una sucursal específica (con Pub/Sub para sincronizar instancias)
 * @param {number} sucursalId
 */
async function invalidarCacheSucursal(sucursalId) {
    await permisosCacheService.invalidarSucursal(sucursalId);
    logger.debug('[Permisos] Cache invalidado para sucursal', { sucursalId });
}

/**
 * Limpiar todo el cache (con Pub/Sub para sincronizar instancias)
 */
async function invalidarTodoCache() {
    await permisosCacheService.invalidarTodo();
    logger.debug('[Permisos] Cache global invalidado');
}

/**
 * Obtener estadísticas del cache de permisos
 * @returns {Promise<Object>}
 */
async function getCacheStats() {
    return await permisosCacheService.getStats();
}

/**
 * Middleware factory para verificar un permiso específico
 *
 * @param {string} codigoPermiso - Código del permiso a verificar
 * @param {Object} options - Opciones adicionales
 * @param {boolean} options.usarSucursalDeQuery - Usar sucursalId de query params
 * @param {boolean} options.usarSucursalDeParams - Usar sucursalId de route params
 * @returns {Function} Middleware de Express
 *
 * @example
 * // En rutas:
 * router.post('/ventas',
 *     authenticateToken,
 *     verificarPermiso('pos.crear_ventas'),
 *     VentasController.crear
 * );
 *
 * // Con sucursal de params:
 * router.post('/sucursales/:sucursalId/ventas',
 *     authenticateToken,
 *     verificarPermiso('pos.crear_ventas', { usarSucursalDeParams: true }),
 *     VentasController.crear
 * );
 */
function verificarPermiso(codigoPermiso, options = {}) {
    return async (req, res, next) => {
        try {
            // Validar y adjuntar sucursal (incluye bypass super_admin con auditoría)
            const validacion = await validarYAdjuntarSucursal(
                req, res, options, 'verificarPermiso', codigoPermiso
            );

            if (!validacion.success) return; // Response ya enviada
            if (validacion.isSuperAdmin) return next();

            const { sucursalId } = validacion;
            const usuarioId = req.user.id;

            // Verificar permiso
            const tiene = await tienePermiso(usuarioId, sucursalId, codigoPermiso);

            if (!tiene) {
                logger.warn('[Permisos] Acceso denegado', {
                    usuario_id: usuarioId,
                    sucursal_id: sucursalId,
                    permiso: codigoPermiso,
                    ruta: req.originalUrl
                });

                return ResponseHelper.error(
                    res,
                    `No tienes permiso para realizar esta acción (${codigoPermiso})`,
                    403
                );
            }

            req.permisoVerificado = codigoPermiso;
            next();
        } catch (error) {
            logger.error('[Permisos] Error verificando permiso', {
                error: error.message,
                permiso: codigoPermiso
            });
            return ResponseHelper.error(res, 'Error verificando permisos', 500);
        }
    };
}

/**
 * Middleware factory para verificar múltiples permisos (OR)
 * El usuario debe tener AL MENOS UNO de los permisos
 *
 * @param {string[]} codigosPermisos - Array de códigos de permisos
 * @returns {Function} Middleware de Express
 *
 * @example
 * router.get('/reportes',
 *     authenticateToken,
 *     verificarAlgunPermiso(['reportes.ver_ventas', 'reportes.ver_citas']),
 *     ReportesController.listar
 * );
 */
function verificarAlgunPermiso(codigosPermisos, options = {}) {
    return async (req, res, next) => {
        try {
            // Validar y adjuntar sucursal (incluye bypass super_admin con auditoría)
            const validacion = await validarYAdjuntarSucursal(
                req, res, options, 'verificarAlgunPermiso', codigosPermisos
            );

            if (!validacion.success) return;
            if (validacion.isSuperAdmin) return next();

            const { sucursalId } = validacion;
            const usuarioId = req.user.id;

            // Verificar cada permiso hasta encontrar uno válido
            for (const codigo of codigosPermisos) {
                const tiene = await tienePermiso(usuarioId, sucursalId, codigo);
                if (tiene) {
                    req.permisoVerificado = codigo;
                    return next();
                }
            }

            logger.warn('[Permisos] Acceso denegado (ningún permiso)', {
                usuario_id: usuarioId,
                sucursal_id: sucursalId,
                permisos: codigosPermisos,
                ruta: req.originalUrl
            });

            return ResponseHelper.error(
                res,
                'No tienes ninguno de los permisos requeridos',
                403
            );
        } catch (error) {
            logger.error('[Permisos] Error verificando permisos', { error: error.message });
            return ResponseHelper.error(res, 'Error verificando permisos', 500);
        }
    };
}

/**
 * Middleware factory para verificar todos los permisos (AND)
 * El usuario debe tener TODOS los permisos
 *
 * @param {string[]} codigosPermisos - Array de códigos de permisos
 * @returns {Function} Middleware de Express
 */
function verificarTodosPermisos(codigosPermisos, options = {}) {
    return async (req, res, next) => {
        try {
            // Validar y adjuntar sucursal (incluye bypass super_admin con auditoría)
            const validacion = await validarYAdjuntarSucursal(
                req, res, options, 'verificarTodosPermisos', codigosPermisos
            );

            if (!validacion.success) return;
            if (validacion.isSuperAdmin) return next();

            const { sucursalId } = validacion;
            const usuarioId = req.user.id;

            // Verificar todos los permisos
            const permisosFaltantes = [];
            for (const codigo of codigosPermisos) {
                const tiene = await tienePermiso(usuarioId, sucursalId, codigo);
                if (!tiene) {
                    permisosFaltantes.push(codigo);
                }
            }

            if (permisosFaltantes.length > 0) {
                logger.warn('[Permisos] Acceso denegado (permisos faltantes)', {
                    usuario_id: usuarioId,
                    sucursal_id: sucursalId,
                    faltantes: permisosFaltantes,
                    ruta: req.originalUrl
                });

                return ResponseHelper.error(
                    res,
                    `Permisos faltantes: ${permisosFaltantes.join(', ')}`,
                    403
                );
            }

            req.permisosVerificados = codigosPermisos;
            next();
        } catch (error) {
            logger.error('[Permisos] Error verificando permisos', { error: error.message });
            return ResponseHelper.error(res, 'Error verificando permisos', 500);
        }
    };
}

/**
 * Middleware para verificar límite numérico
 * Ej: Verificar que el descuento no exceda el máximo permitido
 *
 * @param {string} codigoPermiso - Código del permiso numérico
 * @param {Function} obtenerValor - Función que extrae el valor a verificar del request
 * @returns {Function} Middleware de Express
 *
 * @example
 * router.post('/ventas/descuento',
 *     authenticateToken,
 *     verificarLimiteNumerico('pos.max_descuento', (req) => req.body.descuento),
 *     VentasController.aplicarDescuento
 * );
 */
function verificarLimiteNumerico(codigoPermiso, obtenerValor, options = {}) {
    return async (req, res, next) => {
        try {
            // Validar y adjuntar sucursal (incluye bypass super_admin con auditoría)
            const validacion = await validarYAdjuntarSucursal(
                req, res, options, 'verificarLimiteNumerico', codigoPermiso
            );

            if (!validacion.success) return;
            if (validacion.isSuperAdmin) return next();

            const { sucursalId } = validacion;
            const usuarioId = req.user.id;

            const limite = await obtenerValorNumerico(usuarioId, sucursalId, codigoPermiso);
            const valorSolicitado = obtenerValor(req);

            if (valorSolicitado > limite) {
                logger.warn('[Permisos] Límite excedido', {
                    usuario_id: usuarioId,
                    permiso: codigoPermiso,
                    limite,
                    solicitado: valorSolicitado
                });

                return ResponseHelper.error(
                    res,
                    `Límite excedido. Máximo permitido: ${limite}, solicitado: ${valorSolicitado}`,
                    403
                );
            }

            req.limiteVerificado = { permiso: codigoPermiso, limite, valor: valorSolicitado };
            next();
        } catch (error) {
            logger.error('[Permisos] Error verificando límite', { error: error.message });
            return ResponseHelper.error(res, 'Error verificando límite', 500);
        }
    };
}

/**
 * Invalida cache de validación sucursal-organización
 * Llamar cuando se modifique una sucursal
 * @param {number} orgId - ID de la organización
 */
function invalidarCacheSucursalOrganizacion(orgId) {
    sucursalCacheService.invalidarOrganizacion(orgId);
}

/**
 * Obtener estadísticas de todos los caches (permisos + sucursales)
 * @returns {Promise<Object>}
 */
async function getAllCacheStats() {
    return {
        permisos: await permisosCacheService.getStats(),
        sucursales: sucursalCacheService.getStats()
    };
}

module.exports = {
    verificarPermiso,
    verificarAlgunPermiso,
    verificarTodosPermisos,
    verificarLimiteNumerico,
    tienePermiso,
    obtenerValorNumerico,
    invalidarCacheUsuario,
    invalidarCacheSucursal,
    invalidarTodoCache,
    invalidarCacheSucursalOrganizacion,
    getCacheStats,
    getAllCacheStats
};
