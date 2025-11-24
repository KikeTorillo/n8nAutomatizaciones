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

module.exports = router;
