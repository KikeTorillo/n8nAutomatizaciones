const express = require('express');
const OrganizacionController = require('../../../controllers/organizacion.controller');
const { auth, tenant, rateLimiting, validation } = require('../../../middleware');
const organizacionSchemas = require('../../../schemas/organizacion.schemas');

const router = express.Router();

// ========== Auto-Registro Público (Patrón SaaS) ==========

// Self-service signup - Clientes nuevos se registran automáticamente
router.post('/register',
    rateLimiting.heavyOperationRateLimit,
    validation.validate(organizacionSchemas.onboarding),
    OrganizacionController.onboarding
);

// ========== Rutas CRUD Básicas (Super Admin) ==========

router.post('/',
    auth.authenticateToken,
    auth.requireRole(['super_admin']),
    rateLimiting.apiRateLimit,
    validation.validate(organizacionSchemas.crear),
    OrganizacionController.crear
);

router.get('/',
    auth.authenticateToken,
    rateLimiting.apiRateLimit,
    validation.validate(organizacionSchemas.listar),
    OrganizacionController.listar
);

router.get('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(organizacionSchemas.obtenerPorId),
    OrganizacionController.obtenerPorId
);

router.put('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(organizacionSchemas.actualizar),
    OrganizacionController.actualizar
);

router.delete('/:id',
    auth.authenticateToken,
    auth.requireRole(['super_admin']),
    rateLimiting.heavyOperationRateLimit,
    validation.validate(organizacionSchemas.desactivar),
    OrganizacionController.desactivar
);

// ========== Rutas de Consulta/Métricas ==========

router.get('/:id/limites',
    auth.authenticateToken,
    tenant.setTenantContext,
    validation.validate(organizacionSchemas.verificarLimites),
    OrganizacionController.verificarLimites
);

router.get('/:id/estadisticas',
    auth.authenticateToken,
    tenant.setTenantContext,
    auth.requireAdminRole,
    validation.validate(organizacionSchemas.obtenerEstadisticas),
    OrganizacionController.obtenerEstadisticas
);

router.get('/:id/metricas',
    auth.authenticateToken,
    tenant.setTenantContext,
    validation.validate(organizacionSchemas.obtenerMetricas),
    OrganizacionController.obtenerMetricas
);

// ========== Rutas Administrativas ==========

router.put('/:id/suspender',
    auth.authenticateToken,
    auth.requireRole(['super_admin']),
    rateLimiting.heavyOperationRateLimit,
    validation.validate(organizacionSchemas.suspender),
    OrganizacionController.suspender
);

router.put('/:id/reactivar',
    auth.authenticateToken,
    auth.requireRole(['super_admin']),
    rateLimiting.heavyOperationRateLimit,
    validation.validate(organizacionSchemas.reactivar),
    OrganizacionController.reactivar
);

router.put('/:id/plan',
    auth.authenticateToken,
    auth.requireRole(['super_admin']),
    rateLimiting.heavyOperationRateLimit,
    validation.validate(organizacionSchemas.cambiarPlan),
    OrganizacionController.cambiarPlan
);

module.exports = router;