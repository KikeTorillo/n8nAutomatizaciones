/**
 * @fileoverview Rutas de Registro y Onboarding
 * @description Maneja registro, activación y onboarding de usuarios
 * @version 1.0.0
 */

const express = require('express');
const AuthController = require('../controllers/auth.controller');
const { rateLimiting, validation } = require('../../../middleware');
const authMiddleware = require('../middleware');
const activacionSchemas = require('../schemas/activacion.schemas');

const router = express.Router();

// ========== Registro Simplificado ==========

// Registro (sin password, envía email de activación) - doble rate limit: por IP heavy + por email
router.post('/registrar',
    rateLimiting.heavyOperationRateLimit,
    rateLimiting.emailRateLimit,
    validation.validate(activacionSchemas.registrar),
    AuthController.registrarSimplificado
);

// Validar token de activación (GET para mostrar formulario)
router.get('/activar/:token',
    rateLimiting.apiRateLimit,
    validation.validate(activacionSchemas.validarToken),
    AuthController.validarActivacion
);

// Activar cuenta con password (POST para crear usuario)
router.post('/activar/:token',
    rateLimiting.heavyOperationRateLimit,
    validation.validate(activacionSchemas.activar),
    AuthController.activarCuenta
);

// Reenviar email de activación - doble rate limit: por IP heavy + por email
router.post('/reenviar-activacion',
    rateLimiting.heavyOperationRateLimit,
    rateLimiting.emailRateLimit,
    validation.validate(activacionSchemas.reenviar),
    AuthController.reenviarActivacion
);

// ========== Onboarding ==========

// Estado del onboarding (requiere auth)
router.get('/onboarding/status',
    authMiddleware.authenticateToken,
    rateLimiting.userRateLimit,
    AuthController.onboardingStatus
);

// Completar onboarding (requiere auth)
router.post('/onboarding/complete',
    authMiddleware.authenticateToken,
    rateLimiting.userRateLimit,
    validation.validate(activacionSchemas.onboardingComplete),
    AuthController.onboardingComplete
);

module.exports = router;
