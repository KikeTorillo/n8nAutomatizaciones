/**
 * @fileoverview Rutas de Autenticación - API SaaS Multi-Tenant
 * @version 2.0.0 - Migrado a Joi
 */

const express = require('express');
const AuthController = require('../controllers/auth.controller');
const { auth, tenant, rateLimiting, validation } = require('../../../middleware');
const authSchemas = require('../schemas/auth.schemas');
const activacionSchemas = require('../../../schemas/activacion.schemas');

const router = express.Router();

// ========== Rutas Públicas ==========

// Login y registro
router.post('/login', rateLimiting.authRateLimit, validation.validate(authSchemas.login), AuthController.login);
router.post('/register', rateLimiting.apiRateLimit, validation.validate(authSchemas.register), AuthController.register);
router.post('/crear-primer-admin', rateLimiting.apiRateLimit, validation.validate(authSchemas.crearPrimerAdmin), AuthController.crearPrimerAdmin);

// Tokens
router.post('/refresh', rateLimiting.apiRateLimit, validation.validate(authSchemas.refresh), AuthController.refresh);

// Recuperación de contraseña
router.post('/reset-password', rateLimiting.heavyOperationRateLimit, validation.validate(authSchemas.recuperarPassword), AuthController.recuperarPassword);
router.post('/reset-password/:token', rateLimiting.heavyOperationRateLimit, validation.validate(authSchemas.confirmarResetPassword), AuthController.confirmarResetPassword);
router.get('/validate-reset-token/:token', rateLimiting.apiRateLimit, validation.validate(authSchemas.validarTokenReset), AuthController.validarTokenReset);
router.post('/password-strength', rateLimiting.apiRateLimit, validation.validate(authSchemas.evaluarFortalezaPassword), AuthController.evaluarFortalezaPassword);

// Verificación de email
router.get('/verificar-email/:token', rateLimiting.apiRateLimit, validation.validate(authSchemas.verificarEmail), AuthController.verificarEmail);

// ========== Onboarding Simplificado - Fase 2 (Nov 2025) ==========

// Registro simplificado (sin password, envía email de activación)
router.post('/registrar', rateLimiting.heavyOperationRateLimit, validation.validate(activacionSchemas.registrar), AuthController.registrarSimplificado);

// Validar token de activación (GET para mostrar formulario)
router.get('/activar/:token', rateLimiting.apiRateLimit, validation.validate(activacionSchemas.validarToken), AuthController.validarActivacion);

// Activar cuenta con password (POST para crear usuario)
router.post('/activar/:token', rateLimiting.heavyOperationRateLimit, validation.validate(activacionSchemas.activar), AuthController.activarCuenta);

// Reenviar email de activación
router.post('/reenviar-activacion', rateLimiting.heavyOperationRateLimit, validation.validate(activacionSchemas.reenviar), AuthController.reenviarActivacion);

// ========== Rutas Privadas (Autenticadas) ==========

// Sesión
router.post('/logout', auth.authenticateToken, rateLimiting.apiRateLimit, AuthController.logout);
router.get('/me', auth.authenticateToken, tenant.setTenantContext, rateLimiting.apiRateLimit, AuthController.me);

// Perfil y contraseña
router.put('/profile', auth.authenticateToken, tenant.setTenantContext, rateLimiting.apiRateLimit, validation.validate(authSchemas.updateProfile), AuthController.actualizarPerfil);
router.post('/change-password', auth.authenticateToken, tenant.setTenantContext, rateLimiting.heavyOperationRateLimit, validation.validate(authSchemas.changePassword), AuthController.cambiarPassword);

module.exports = router;
