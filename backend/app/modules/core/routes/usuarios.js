const express = require('express');
const UsuarioController = require('../controllers/usuario.controller');
const UsuariosUbicacionesController = require('../controllers/usuariosUbicaciones.controller');
const { auth, tenant, rateLimiting, validation, subscription } = require('../../../middleware');
const usuarioSchemas = require('../schemas/usuario.schemas');
const usuariosUbicacionesSchemas = require('../schemas/usuariosUbicaciones.schemas');

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
    rateLimiting.userRateLimit,
    validation.validate(usuarioSchemas.listar),
    UsuarioController.listar
);

router.get('/bloqueados',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    validation.validate(usuarioSchemas.obtenerBloqueados),
    UsuarioController.obtenerBloqueados
);

// Obtener profesionales sin usuario (para selector) - DEBE estar antes de /:id
router.get('/profesionales-disponibles',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    validation.validate(usuarioSchemas.obtenerProfesionalesDisponibles),
    UsuarioController.obtenerProfesionalesDisponibles
);

// Obtener usuarios sin profesional (para vincular al crear profesional) - Dic 2025
router.get('/sin-profesional',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    validation.validate(usuarioSchemas.obtenerUsuariosSinProfesional),
    UsuarioController.obtenerUsuariosSinProfesional
);

router.get('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    validation.validate(usuarioSchemas.obtenerPorId),
    UsuarioController.obtenerPorId
);

router.get('/:id/bloqueo',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    validation.validate(usuarioSchemas.verificarBloqueo),
    UsuarioController.verificarBloqueo
);

router.put('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
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

// ========== Gestión de Usuarios - Dic 2025 ==========

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

// ========== Gestión de Ubicaciones de Usuario - Ene 2026 ==========

// Obtener ubicaciones disponibles para asignar (ANTES de /:id/ubicaciones)
router.get('/:id/ubicaciones-disponibles',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    validation.validate(usuariosUbicacionesSchemas.ubicacionesDisponibles),
    UsuariosUbicacionesController.obtenerDisponibles
);

// Obtener ubicaciones asignadas a un usuario
router.get('/:id/ubicaciones',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    validation.validate(usuariosUbicacionesSchemas.listarUbicaciones),
    UsuariosUbicacionesController.obtenerUbicaciones
);

// Asignar ubicación a usuario
router.post('/:id/ubicaciones',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.heavyOperationRateLimit,
    validation.validate(usuariosUbicacionesSchemas.asignarUbicacion),
    UsuariosUbicacionesController.asignarUbicacion
);

// Actualizar permisos de asignación de ubicación
router.patch('/:id/ubicaciones/:ubicacionId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.heavyOperationRateLimit,
    validation.validate(usuariosUbicacionesSchemas.actualizarAsignacion),
    UsuariosUbicacionesController.actualizarAsignacion
);

// Desasignar ubicación de usuario
router.delete('/:id/ubicaciones/:ubicacionId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.heavyOperationRateLimit,
    validation.validate(usuariosUbicacionesSchemas.desasignarUbicacion),
    UsuariosUbicacionesController.desasignarUbicacion
);

module.exports = router;