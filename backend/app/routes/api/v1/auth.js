/**
 * @fileoverview Rutas de Autenticación para API SaaS
 * @description Define endpoints de login, registro, refresh token y gestión de usuarios
 * @author SaaS Agendamiento
 * @version 2.0.0 - Migrado a Joi
 */

const express = require('express');
const AuthController = require('../../../controllers/auth.controller');
const { auth, tenant, rateLimiting, validation } = require('../../../middleware');
const authSchemas = require('../../../schemas/auth.schemas');

const router = express.Router();

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login de usuario
 * @access  Public
 */
router.post('/login',
    rateLimiting.authRateLimit,
    validation.validate(authSchemas.login),
    AuthController.login
);

/**
 * @route   POST /api/v1/auth/register
 * @desc    Registro de nuevo usuario
 * @access  Public
 */
router.post('/register',
    rateLimiting.apiRateLimit,
    validation.validate(authSchemas.register),
    AuthController.register
);

/**
 * @route   POST /api/v1/auth/crear-primer-admin
 * @desc    Crear primer usuario super_admin si no existen usuarios en el sistema
 * @access  Public (solo si no hay usuarios)
 */
router.post('/crear-primer-admin',
    rateLimiting.apiRateLimit,
    validation.validate(authSchemas.crearPrimerAdmin),
    AuthController.crearPrimerAdmin
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refrescar access token
 * @access  Public
 */
router.post('/refresh',
    rateLimiting.apiRateLimit,
    validation.validate(authSchemas.refresh),
    AuthController.refresh
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Cerrar sesión
 * @access  Private
 */
router.post('/logout',
    auth.authenticateToken,
    rateLimiting.apiRateLimit,
    AuthController.logout
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Obtener información del usuario actual
 * @access  Private
 */
router.get('/me',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    AuthController.me
);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Cambiar contraseña del usuario actual
 * @access  Private
 */
router.post('/change-password',
    auth.authenticateToken,
    rateLimiting.heavyOperationRateLimit,
    validation.validate(authSchemas.changePassword),
    AuthController.cambiarPassword
);

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Actualizar perfil del usuario actual
 * @access  Private
 */
router.put('/profile',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(authSchemas.updateProfile),
    AuthController.actualizarPerfil
);

/**
 * @route   POST /api/v1/auth/unlock-user
 * @desc    Desbloquear usuario (solo administradores)
 * @access  Private (admin, super_admin, propietario)
 */
router.post('/unlock-user',
    auth.authenticateToken,
    tenant.setTenantContext,
    auth.requireRole(['admin', 'super_admin', 'propietario']),
    rateLimiting.heavyOperationRateLimit,
    validation.validate(authSchemas.unlockUser),
    AuthController.desbloquearUsuario
);

/**
 * @route   GET /api/v1/auth/blocked-users
 * @desc    Obtener lista de usuarios bloqueados (solo administradores)
 * @access  Private (admin, super_admin, propietario)
 */
router.get('/blocked-users',
    auth.authenticateToken,
    tenant.setTenantContext,
    auth.requireRole(['admin', 'super_admin', 'propietario']),
    rateLimiting.apiRateLimit,
    validation.validate(authSchemas.getBlockedUsers),
    AuthController.obtenerUsuariosBloqueados
);

/**
 * @route   GET /api/v1/auth/check-lock/:userId
 * @desc    Verificar estado de bloqueo de un usuario
 * @access  Private
 */
router.get('/check-lock/:userId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(authSchemas.checkLock),
    AuthController.verificarBloqueo
);

/**
 * @route   POST /api/v1/auth/registrar-usuario-org
 * @desc    Registrar usuario automáticamente para organización
 * @access  Private (super_admin, admin, propietario)
 */
router.post('/registrar-usuario-org',
    auth.authenticateToken,
    tenant.setTenantContext,
    auth.requireRole(['super_admin', 'admin', 'propietario']),
    rateLimiting.heavyOperationRateLimit,
    validation.validate(authSchemas.registrarUsuarioOrg),
    AuthController.registrarUsuarioOrganizacion
);

/**
 * @route   GET /api/v1/auth/verificar-email/:token
 * @desc    Verificar email con token de verificación
 * @access  Public
 */
router.get('/verificar-email/:token',
    rateLimiting.apiRateLimit,
    validation.validate(authSchemas.verificarEmail),
    AuthController.verificarEmail
);

/**
 * @route   PUT /api/v1/auth/cambiar-rol
 * @desc    Cambiar rol de usuario (solo administradores)
 * @access  Private (super_admin, admin, propietario)
 */
router.put('/cambiar-rol',
    auth.authenticateToken,
    tenant.setTenantContext,
    auth.requireRole(['super_admin', 'admin', 'propietario']),
    rateLimiting.heavyOperationRateLimit,
    validation.validate(authSchemas.cambiarRol),
    AuthController.cambiarRol
);

/**
 * @route   GET /api/v1/auth/usuarios-organizacion
 * @desc    Listar usuarios por organización (administradores)
 * @access  Private (super_admin, admin, propietario)
 */
router.get('/usuarios-organizacion',
    auth.authenticateToken,
    tenant.setTenantContext,
    auth.requireRole(['super_admin', 'admin', 'propietario']),
    rateLimiting.apiRateLimit,
    validation.validate(authSchemas.listarUsuariosOrg),
    AuthController.listarUsuariosOrganizacion
);

module.exports = router;
