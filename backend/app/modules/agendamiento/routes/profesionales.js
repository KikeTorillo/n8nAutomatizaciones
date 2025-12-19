const express = require('express');
const ProfesionalController = require('../controllers/profesional.controller');
const { auth, tenant, rateLimiting, validation, subscription } = require('../../../middleware');
const schemas = require('../schemas/profesional.schemas');

const router = express.Router();

// ========== Rutas Bulk ==========

router.post('/bulk-create',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    subscription.checkActiveSubscription,  // Verificar suscripción activa
    // NO agregar checkResourceLimit aquí - se valida dentro del método bulkCrear
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.bulkCrear),
    ProfesionalController.bulkCrear
);

// ========== Rutas Admin ==========

router.post('/',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    subscription.checkActiveSubscription,              // ✅ Verificar suscripción activa
    subscription.checkResourceLimit('profesionales'),  // ✅ Verificar límite de profesionales
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.crear),
    ProfesionalController.crear
);

router.get('/estadisticas',
    auth.authenticateToken,
    tenant.setTenantContext,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.obtenerEstadisticas),
    ProfesionalController.obtenerEstadisticas
);

router.post('/validar-email',
    auth.authenticateToken,
    tenant.setTenantContext,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.validarEmail),
    ProfesionalController.validarEmail
);

router.put('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.actualizar),
    ProfesionalController.actualizar
);

router.patch('/:id/estado',
    auth.authenticateToken,
    tenant.setTenantContext,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.cambiarEstado),
    ProfesionalController.cambiarEstado
);

router.delete('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.eliminar),
    ProfesionalController.eliminar
);

// ========== Rutas Modelo Unificado Profesional-Usuario (Nov 2025) ==========

// Obtener usuarios disponibles para vincular (sin profesional asignado)
router.get('/usuarios-disponibles',
    auth.authenticateToken,
    tenant.setTenantContext,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    ProfesionalController.obtenerUsuariosDisponibles
);

// Listar profesionales por módulo habilitado
router.get('/por-modulo/:modulo',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.listarPorModulo),
    ProfesionalController.listarPorModulo
);

// Buscar profesional vinculado a un usuario
router.get('/por-usuario/:usuarioId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.buscarPorUsuario),
    ProfesionalController.buscarPorUsuario
);

// Vincular/desvincular usuario a profesional
router.patch('/:id/vincular-usuario',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.vincularUsuario),
    ProfesionalController.vincularUsuario
);

// Actualizar módulos habilitados para un profesional
router.patch('/:id/modulos',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.actualizarModulos),
    ProfesionalController.actualizarModulos
);

// ========== Rutas Autenticadas ==========

router.get('/tipo/:tipoId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.buscarPorTipo),
    ProfesionalController.buscarPorTipo
);

router.get('/',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.listar),
    ProfesionalController.listar
);

router.get('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.obtenerPorId),
    ProfesionalController.obtenerPorId
);

router.patch('/:id/metricas',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.actualizarMetricas),
    ProfesionalController.actualizarMetricas
);

// ========== Rutas Jerarquía Organizacional (Dic 2025) ==========

// Obtener subordinados de un profesional
router.get('/:id/subordinados',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.obtenerSubordinados),
    ProfesionalController.obtenerSubordinados
);

// Obtener cadena de supervisores de un profesional
router.get('/:id/supervisores',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.obtenerSupervisores),
    ProfesionalController.obtenerSupervisores
);

// ========== Rutas Categorías de Profesional (Dic 2025) ==========

// Obtener categorías de un profesional
router.get('/:id/categorias',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.obtenerCategoriasProfesional),
    ProfesionalController.obtenerCategorias
);

// Asignar categoría a un profesional
router.post('/:id/categorias',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.asignarCategoria),
    ProfesionalController.asignarCategoria
);

// Eliminar categoría de un profesional
router.delete('/:id/categorias/:categoriaId',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.eliminarCategoria),
    ProfesionalController.eliminarCategoria
);

// Sincronizar categorías de un profesional (reemplaza todas)
router.put('/:id/categorias',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.sincronizarCategorias),
    ProfesionalController.sincronizarCategorias
);

module.exports = router;
