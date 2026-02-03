/**
 * @fileoverview Rutas de Recuperación de Acceso
 * @description Maneja reset de contraseña y magic links
 * @version 1.0.0
 */

const express = require('express');
const AuthController = require('../controllers/auth.controller');
const { rateLimiting, validation } = require('../../../middleware');
const authSchemas = require('../schemas/auth.schemas');
const activacionSchemas = require('../../../schemas/activacion.schemas');

const router = express.Router();

// ========== Reset de Contraseña ==========

// Solicitar reset de contraseña (doble rate limit: por IP heavy + por email)
router.post('/reset-password',
    rateLimiting.heavyOperationRateLimit,
    rateLimiting.emailRateLimit,
    validation.validate(authSchemas.recuperarPassword),
    AuthController.recuperarPassword
);

// Confirmar reset con nueva contraseña
router.post('/reset-password/:token',
    rateLimiting.heavyOperationRateLimit,
    validation.validate(authSchemas.confirmarResetPassword),
    AuthController.confirmarResetPassword
);

// Validar token de reset
router.get('/validate-reset-token/:token',
    rateLimiting.apiRateLimit,
    validation.validate(authSchemas.validarTokenReset),
    AuthController.validarTokenReset
);

// Evaluar fortaleza de contraseña
router.post('/password-strength',
    rateLimiting.apiRateLimit,
    validation.validate(authSchemas.evaluarFortalezaPassword),
    AuthController.evaluarFortalezaPassword
);

// ========== Magic Links ==========

// Solicitar magic link (envía email) - doble rate limit: por IP heavy + por email
router.post('/magic-link',
    rateLimiting.heavyOperationRateLimit,
    rateLimiting.emailRateLimit,
    validation.validate(activacionSchemas.solicitarMagicLink),
    AuthController.solicitarMagicLink
);

// Verificar magic link y autenticar
router.get('/magic-link/verify/:token',
    rateLimiting.apiRateLimit,
    validation.validate(activacionSchemas.verificarMagicLink),
    AuthController.verificarMagicLink
);

// ========== Verificación de Email ==========

// Verificar email con token
router.get('/verificar-email/:token',
    rateLimiting.apiRateLimit,
    validation.validate(authSchemas.verificarEmail),
    AuthController.verificarEmail
);

module.exports = router;
