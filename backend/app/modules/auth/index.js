/**
 * @fileoverview Barrel Export del Módulo de Autenticación
 * @description Punto de entrada único para todo el módulo auth
 * @version 1.0.0
 *
 * Uso:
 *   const { AuthController, JwtService, authenticateToken } = require('../auth');
 */

// Controllers
const { AuthController } = require('./controllers');

// Models
const { AuthModel, ActivacionModel } = require('./models');

// Services
const { JwtService, tokenBlacklistService, OnboardingService } = require('./services');

// Middleware
const {
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
    checkTokenBlacklist,
    requireOnboarding,
    checkOnboarding
} = require('./middleware');

// Schemas
const { authSchemas, activacionSchemas } = require('./schemas');

// Routes (para RouteLoader)
const authRouter = require('./routes');

module.exports = {
    // Controllers
    AuthController,

    // Models
    AuthModel,
    ActivacionModel,

    // Services
    JwtService,
    tokenBlacklistService,
    OnboardingService,

    // Middleware
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
    checkTokenBlacklist,
    requireOnboarding,
    checkOnboarding,

    // Schemas
    authSchemas,
    activacionSchemas,

    // Router
    authRouter
};
