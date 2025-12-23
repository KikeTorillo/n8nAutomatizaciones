/**
 * @fileoverview Middleware de Verificación de Permisos
 * @description Middleware para verificar permisos usando el sistema normalizado
 * @version 1.0.0
 * @date Diciembre 2025
 */

const { getDb } = require('../config/database');
const logger = require('../utils/logger');
const { ResponseHelper } = require('../utils/helpers');

/**
 * Cache en memoria para permisos (TTL: 5 minutos)
 * Reduce queries a la BD para verificaciones frecuentes
 */
const permisosCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Limpiar cache cada 10 minutos
 */
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of permisosCache.entries()) {
        if (now - entry.timestamp > CACHE_TTL) {
            permisosCache.delete(key);
        }
    }
}, 10 * 60 * 1000);

/**
 * Generar clave de cache
 */
function getCacheKey(usuarioId, sucursalId, codigoPermiso) {
    return `${usuarioId}:${sucursalId}:${codigoPermiso}`;
}

/**
 * Verificar si usuario tiene un permiso (con cache)
 * @param {number} usuarioId
 * @param {number} sucursalId
 * @param {string} codigoPermiso
 * @returns {Promise<boolean>}
 */
async function tienePermiso(usuarioId, sucursalId, codigoPermiso) {
    // Verificar cache
    const cacheKey = getCacheKey(usuarioId, sucursalId, codigoPermiso);
    const cached = permisosCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
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

        // Guardar en cache
        permisosCache.set(cacheKey, {
            valor: tiene,
            timestamp: Date.now()
        });

        return tiene;
    } finally {
        db.release();
    }
}

/**
 * Obtener valor numérico de un permiso (con cache)
 * @param {number} usuarioId
 * @param {number} sucursalId
 * @param {string} codigoPermiso
 * @returns {Promise<number>}
 */
async function obtenerValorNumerico(usuarioId, sucursalId, codigoPermiso) {
    const cacheKey = getCacheKey(usuarioId, sucursalId, `num:${codigoPermiso}`);
    const cached = permisosCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.valor;
    }

    const db = await getDb();
    try {
        const result = await db.query(
            'SELECT obtener_valor_permiso_numerico($1, $2, $3) as valor',
            [usuarioId, sucursalId, codigoPermiso]
        );
        const valor = result.rows[0]?.valor || 0;

        permisosCache.set(cacheKey, {
            valor,
            timestamp: Date.now()
        });

        return valor;
    } finally {
        db.release();
    }
}

/**
 * Limpiar cache de un usuario específico
 * Llamar después de modificar permisos
 * @param {number} usuarioId
 */
function invalidarCacheUsuario(usuarioId) {
    for (const key of permisosCache.keys()) {
        if (key.startsWith(`${usuarioId}:`)) {
            permisosCache.delete(key);
        }
    }
    logger.debug('[Permisos] Cache invalidado para usuario', { usuarioId });
}

/**
 * Limpiar todo el cache
 */
function invalidarTodoCache() {
    permisosCache.clear();
    logger.debug('[Permisos] Cache global invalidado');
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
            const usuarioId = req.user?.id;

            if (!usuarioId) {
                return ResponseHelper.error(res, 'Usuario no autenticado', 401);
            }

            // Determinar sucursal
            let sucursalId;
            if (options.usarSucursalDeParams && req.params.sucursalId) {
                sucursalId = parseInt(req.params.sucursalId);
            } else if (options.usarSucursalDeQuery && req.query.sucursalId) {
                sucursalId = parseInt(req.query.sucursalId);
            } else if (req.body?.sucursalId) {
                sucursalId = parseInt(req.body.sucursalId);
            } else {
                sucursalId = req.user.sucursal_id;
            }

            if (!sucursalId) {
                return ResponseHelper.error(res, 'Se requiere una sucursal para verificar permisos', 400);
            }

            // Super admin siempre tiene acceso
            if (req.user.rol === 'super_admin') {
                return next();
            }

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

            // Adjuntar info de permiso al request (útil para logging)
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
            const usuarioId = req.user?.id;

            if (!usuarioId) {
                return ResponseHelper.error(res, 'Usuario no autenticado', 401);
            }

            let sucursalId = options.sucursalId || req.params.sucursalId || req.query.sucursalId || req.user.sucursal_id;
            sucursalId = parseInt(sucursalId);

            if (!sucursalId) {
                return ResponseHelper.error(res, 'Se requiere una sucursal', 400);
            }

            if (req.user.rol === 'super_admin') {
                return next();
            }

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
            const usuarioId = req.user?.id;

            if (!usuarioId) {
                return ResponseHelper.error(res, 'Usuario no autenticado', 401);
            }

            let sucursalId = options.sucursalId || req.params.sucursalId || req.query.sucursalId || req.user.sucursal_id;
            sucursalId = parseInt(sucursalId);

            if (!sucursalId) {
                return ResponseHelper.error(res, 'Se requiere una sucursal', 400);
            }

            if (req.user.rol === 'super_admin') {
                return next();
            }

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
function verificarLimiteNumerico(codigoPermiso, obtenerValor) {
    return async (req, res, next) => {
        try {
            const usuarioId = req.user?.id;
            const sucursalId = req.params.sucursalId || req.query.sucursalId || req.user.sucursal_id;

            if (!usuarioId || !sucursalId) {
                return ResponseHelper.error(res, 'Usuario o sucursal no identificados', 400);
            }

            if (req.user.rol === 'super_admin') {
                return next();
            }

            const limite = await obtenerValorNumerico(usuarioId, parseInt(sucursalId), codigoPermiso);
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

module.exports = {
    verificarPermiso,
    verificarAlgunPermiso,
    verificarTodosPermisos,
    verificarLimiteNumerico,
    tienePermiso,
    obtenerValorNumerico,
    invalidarCacheUsuario,
    invalidarTodoCache
};
