/**
 * @fileoverview Middleware de Onboarding
 * @description Verifica si el usuario completó el onboarding antes de acceder a rutas protegidas
 * @version 1.0.0
 * Dic 2025 - OAuth y Magic Links
 */

const { ResponseHelper } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Middleware que verifica si el usuario completó el onboarding
 * Redirige a /onboarding si no está completado
 *
 * NOTA: Este middleware debe usarse DESPUÉS de authenticateToken
 *
 * @example
 * router.get('/home', auth.authenticateToken, onboarding.requireOnboarding, HomeController.index);
 */
const requireOnboarding = (req, res, next) => {
    if (!req.user) {
        logger.error('[onboarding.requireOnboarding] Middleware usado sin autenticación previa');
        return ResponseHelper.error(res, 'Error de configuración', 500);
    }

    // Super admin no requiere onboarding (es usuario de plataforma)
    if (req.user.rol === 'super_admin') {
        return next();
    }

    // Verificar si completó onboarding
    // NOTA: El campo viene del token JWT o de la consulta en authenticateToken
    // Necesitamos consultarlo desde la DB para tener el valor actualizado
    // Por ahora usamos el valor del user que ya tenemos

    // Si el usuario no tiene organizacion_id, probablemente es nuevo via OAuth
    // y necesita completar el onboarding
    if (!req.user.organizacion_id) {
        logger.info('[onboarding.requireOnboarding] Usuario sin organización, requiere onboarding', {
            userId: req.user.id,
            email: req.user.email
        });

        return ResponseHelper.error(res, 'Debes completar el onboarding', 403, {
            code: 'ONBOARDING_REQUIRED',
            redirect: '/onboarding'
        });
    }

    next();
};

/**
 * Middleware opcional que agrega información de onboarding al request
 * No bloquea, solo agrega req.onboardingCompleted
 *
 * @example
 * router.get('/status', auth.authenticateToken, onboarding.checkOnboarding, StatusController.index);
 */
const checkOnboarding = async (req, res, next) => {
    if (!req.user) {
        req.onboardingCompleted = false;
        return next();
    }

    // Super admin siempre tiene onboarding "completado"
    if (req.user.rol === 'super_admin') {
        req.onboardingCompleted = true;
        return next();
    }

    // Verificar si tiene organización
    req.onboardingCompleted = !!req.user.organizacion_id;

    next();
};

module.exports = {
    requireOnboarding,
    checkOnboarding
};
