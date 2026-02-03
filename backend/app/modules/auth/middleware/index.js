/**
 * @fileoverview Exportaciones de middleware del módulo Auth
 * @description Re-exporta todos los middleware de autenticación
 */

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
    checkTokenBlacklist
} = require('./auth');

const {
    requireOnboarding,
    checkOnboarding
} = require('./onboarding');

module.exports = {
    // Auth middleware
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
    // Onboarding middleware
    requireOnboarding,
    checkOnboarding
};
