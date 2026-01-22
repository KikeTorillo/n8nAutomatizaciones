const express = require('express');
const UsuarioController = require('../controllers/usuario.controller');
const { auth, tenant, rateLimiting, validation, subscription } = require('../../../middleware');
const usuarioSchemas = require('../schemas/usuario.schemas');

const router = express.Router();

// ========== Rutas Privadas ==========
router.post('/',
    auth.authenticateToken,
    tenant.setTenantContext,
    auth.requireAdminRole,
    rateLimiting.heavyOperationRateLimit,
    validation.validate(usuarioSchemas.crear),
    UsuarioController.crear
);

router.get('/',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(usuarioSchemas.listar),
    UsuarioController.listar
);

router.get('/bloqueados',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(usuarioSchemas.obtenerBloqueados),
    UsuarioController.obtenerBloqueados
);

// Obtener profesionales sin usuario (para selector) - DEBE estar antes de /:id
router.get('/profesionales-disponibles',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(usuarioSchemas.obtenerProfesionalesDisponibles),
    UsuarioController.obtenerProfesionalesDisponibles
);

// Obtener usuarios sin profesional (para vincular al crear profesional) - Dic 2025
router.get('/sin-profesional',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(usuarioSchemas.obtenerUsuariosSinProfesional),
    UsuarioController.obtenerUsuariosSinProfesional
);

router.get('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(usuarioSchemas.obtenerPorId),
    UsuarioController.obtenerPorId
);

router.get('/:id/bloqueo',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(usuarioSchemas.verificarBloqueo),
    UsuarioController.verificarBloqueo
);

router.put('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(usuarioSchemas.actualizar),
    UsuarioController.actualizar
);

router.patch('/:id/rol',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.heavyOperationRateLimit,
    validation.validate(usuarioSchemas.cambiarRol),
    UsuarioController.cambiarRol
);

router.patch('/:id/desbloquear',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.heavyOperationRateLimit,
    validation.validate(usuarioSchemas.desbloquear),
    UsuarioController.desbloquear
);

// ========== Gestión de Usuarios Estilo Odoo - Dic 2025 ==========

// Crear usuario directo (sin invitación)
router.post('/directo',
    auth.authenticateToken,
    tenant.setTenantContext,
    auth.requireAdminRole,
    rateLimiting.heavyOperationRateLimit,
    validation.validate(usuarioSchemas.crearDirecto),
    UsuarioController.crearDirecto
);

// Cambiar estado activo de usuario
router.patch('/:id/estado',
    auth.authenticateToken,
    tenant.setTenantContext,
    auth.requireAdminRole,
    rateLimiting.heavyOperationRateLimit,
    validation.validate(usuarioSchemas.cambiarEstado),
    UsuarioController.cambiarEstado
);

// Vincular/desvincular profesional a usuario
router.patch('/:id/vincular-profesional',
    auth.authenticateToken,
    tenant.setTenantContext,
    auth.requireAdminRole,
    rateLimiting.heavyOperationRateLimit,
    validation.validate(usuarioSchemas.vincularProfesional),
    UsuarioController.vincularProfesional
);

module.exports = router;