/**
 * @fileoverview Rutas de Autenticación - API SaaS Multi-Tenant
 * @description Router principal que agrupa todos los sub-routers de auth
 * @version 3.0.0 - Refactorizado con sub-routers
 *
 * Sub-routers:
 * - auth-onboarding.js: registro, activación, onboarding
 * - auth-oauth.js: OAuth providers (Google, etc.)
 * - auth-recovery.js: reset password, magic links, verificación email
 */

const express = require('express');
const AuthController = require('../controllers/auth.controller');
const { auth, tenant, rateLimiting, validation } = require('../../../middleware');
const authSchemas = require('../schemas/auth.schemas');

// Sub-routers
const onboardingRouter = require('./auth-onboarding');
const oauthRouter = require('./auth-oauth');
const recoveryRouter = require('./auth-recovery');

const router = express.Router();

// ========================================================================
// RUTAS CORE (Login, Logout, Refresh, Me, Profile)
// ========================================================================

// Login
router.post('/login',
    rateLimiting.authRateLimit,
    validation.validate(authSchemas.login),
    AuthController.login
);

// Registro directo (legacy - sin activación)
router.post('/register',
    rateLimiting.apiRateLimit,
    validation.validate(authSchemas.register),
    AuthController.register
);

// Crear primer admin (solo si no hay usuarios)
router.post('/crear-primer-admin',
    rateLimiting.apiRateLimit,
    validation.validate(authSchemas.crearPrimerAdmin),
    AuthController.crearPrimerAdmin
);

// Refresh token
router.post('/refresh',
    rateLimiting.apiRateLimit,
    validation.validate(authSchemas.refresh),
    AuthController.refresh
);

// Logout (autenticado)
router.post('/logout',
    auth.authenticateToken,
    rateLimiting.apiRateLimit,
    AuthController.logout
);

// Información del usuario actual
router.get('/me',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    AuthController.me
);

// Actualizar perfil
router.put('/profile',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(authSchemas.updateProfile),
    AuthController.actualizarPerfil
);

// Cambiar contraseña
router.post('/change-password',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.heavyOperationRateLimit,
    validation.validate(authSchemas.changePassword),
    AuthController.cambiarPassword
);

// Cambiar sucursal activa
router.post('/cambiar-sucursal',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(authSchemas.cambiarSucursal),
    AuthController.cambiarSucursal
);

// ========================================================================
// MONTAR SUB-ROUTERS
// ========================================================================

// Onboarding: /registrar, /activar, /onboarding/*
router.use('/', onboardingRouter);

// OAuth: /oauth/google
router.use('/', oauthRouter);

// Recovery: /reset-password, /magic-link, /verificar-email
router.use('/', recoveryRouter);

module.exports = router;
