/**
 * ====================================================================
 * MIDDLEWARE: VERIFICACIÓN DE SUSCRIPCIÓN ACTIVA
 * ====================================================================
 * Verifica el estado de suscripción de la organización y determina
 * el nivel de acceso permitido.
 *
 * Niveles de acceso:
 * - COMPLETO: trial, activa, pendiente_pago → todas las operaciones
 * - LIMITADO: grace_period, vencida → solo lectura (GET)
 * - BLOQUEADO: suspendida, cancelada → redirect a /planes
 *
 * @module middleware/suscripcionActiva
 * @author Nexo Team
 * @version 1.0.0
 * @date Enero 2026
 */

const {
    NEXO_TEAM_ORG_ID,
    RUTAS_EXENTAS_SUSCRIPCION,
    ESTADOS_BLOQUEADOS
} = require('../config/constants');
const SuscripcionesModel = require('../modules/suscripciones-negocio/models/suscripciones.model');
const logger = require('../utils/logger');

/**
 * Verificar si una ruta está exenta de verificación de suscripción
 * @param {string} path - Ruta del request
 * @returns {boolean}
 */
const esRutaExenta = (path) => {
    return RUTAS_EXENTAS_SUSCRIPCION.some(ruta => path.startsWith(ruta));
};

/**
 * Middleware que verifica el estado de suscripción
 *
 * Flujo:
 * 1. Rutas exentas → pasa
 * 2. Nexo Team (org 1) → pasa (bypass)
 * 3. SuperAdmin → pasa (bypass)
 * 4. Verifica estado → bloquea/limita según resultado
 */
const verificarSuscripcionActiva = async (req, res, next) => {
    try {
        // 1. Rutas exentas (auth, checkout, planes públicos, health)
        if (esRutaExenta(req.path)) {
            return next();
        }

        // 2. Obtener organizacionId
        const orgId = req.tenant?.organizacionId || req.user?.organizacion_id;

        // Sin organización → pasa (puede ser usuario sin org todavía)
        if (!orgId) {
            return next();
        }

        // 3. Bypass para Nexo Team (organización principal de la plataforma)
        if (orgId === NEXO_TEAM_ORG_ID) {
            return next();
        }

        // 4. Bypass para SuperAdmin (nivel jerárquico 100)
        if (req.user?.nivel_jerarquia >= 100) {
            return next();
        }

        // 5. Verificar estado de suscripción
        const estado = await SuscripcionesModel.verificarEstadoOrg(orgId);

        // Adjuntar info de suscripción al request para uso posterior
        req.suscripcion = estado;

        // 6. Sin suscripción o estado bloqueado
        if (!estado.tieneSuscripcion || !estado.puedeContinuar) {
            logger.warn(`[Suscripción] Acceso bloqueado para org ${orgId}: ${estado.mensaje || 'sin suscripción'}`);

            return res.status(403).json({
                error: 'subscription_required',
                codigo: estado.estado
                    ? `SUBSCRIPTION_${estado.estado.toUpperCase()}`
                    : 'SUBSCRIPTION_REQUIRED',
                mensaje: estado.mensaje || 'Necesitas una suscripción activa para continuar',
                redirigir_a: '/planes'
            });
        }

        // 7. Acceso limitado (grace_period, vencida) → solo lectura
        if (estado.accesoLimitado) {
            const metodosLectura = ['GET', 'HEAD', 'OPTIONS'];

            if (!metodosLectura.includes(req.method)) {
                logger.warn(`[Suscripción] Operación de escritura bloqueada para org ${orgId} en estado ${estado.estado}`);

                return res.status(403).json({
                    error: 'read_only_access',
                    codigo: 'SUBSCRIPTION_READ_ONLY',
                    mensaje: 'Tu cuenta está en modo solo lectura. Renueva tu suscripción para continuar.',
                    estado: estado.estado,
                    diasRestantes: estado.diasRestantesGracia
                });
            }
        }

        // 8. Acceso completo → continuar
        next();

    } catch (error) {
        logger.error('[Suscripción] Error verificando estado:', error);

        // En caso de error, permitir acceso (fail-open para no bloquear la plataforma)
        // En producción, considerar fail-closed si la verificación es crítica
        next();
    }
};

/**
 * Middleware que solo verifica pero no bloquea
 * Útil para adjuntar info de suscripción sin impedir acceso
 */
const adjuntarInfoSuscripcion = async (req, res, next) => {
    try {
        const orgId = req.tenant?.organizacionId || req.user?.organizacion_id;

        if (orgId && orgId !== NEXO_TEAM_ORG_ID) {
            const estado = await SuscripcionesModel.verificarEstadoOrg(orgId);
            req.suscripcion = estado;
        }

        next();
    } catch (error) {
        logger.error('[Suscripción] Error adjuntando info:', error);
        next();
    }
};

module.exports = {
    verificarSuscripcionActiva,
    adjuntarInfoSuscripcion,
    esRutaExenta
};
