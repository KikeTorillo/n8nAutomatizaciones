const express = require('express');
const OrganizacionController = require('../../../controllers/organizacion.controller');
const { auth, tenant, rateLimiting, validation } = require('../../../middleware');
const organizacionSchemas = require('../../../schemas/organizacion.schemas');

const router = express.Router();

// ========== Auto-Registro Público (Patrón SaaS) ==========

// Self-service signup - Clientes nuevos se registran automáticamente
router.post('/register',
    rateLimiting.apiRateLimit,
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

// ========== Rutas de Consulta/Métricas (ANTES de /:id) ==========
// IMPORTANTE: Estas rutas deben estar ANTES de /:id para que Express las matchee correctamente

router.get('/:id/limites',
    auth.authenticateToken,
    tenant.setTenantContext,
    validation.validate(organizacionSchemas.verificarLimites),
    (req, res, next) => OrganizacionController.verificarLimites(req, res, next)
);

router.get('/:id/estadisticas',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    auth.requireAdminRole,
    validation.validate(organizacionSchemas.obtenerEstadisticas),
    (req, res, next) => OrganizacionController.obtenerEstadisticas(req, res, next)
);

router.get('/:id/metricas',
    auth.authenticateToken,
    tenant.setTenantContext,
    validation.validate(organizacionSchemas.obtenerMetricas),
    (req, res, next) => OrganizacionController.obtenerMetricas(req, res, next)
);

// ========== Rutas CRUD Básicas con /:id ==========

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

// ========== Rutas Administrativas ==========

router.put('/:id/suspender',
    auth.authenticateToken,
    auth.requireRole(['super_admin']),
    rateLimiting.heavyOperationRateLimit,
    validation.validate(organizacionSchemas.suspender),
    (req, res, next) => OrganizacionController.suspender(req, res, next)
);

router.put('/:id/reactivar',
    auth.authenticateToken,
    auth.requireRole(['super_admin']),
    rateLimiting.heavyOperationRateLimit,
    validation.validate(organizacionSchemas.reactivar),
    (req, res, next) => OrganizacionController.reactivar(req, res, next)
);

router.put('/:id/plan',
    auth.authenticateToken,
    auth.requireRole(['super_admin']),
    rateLimiting.heavyOperationRateLimit,
    validation.validate(organizacionSchemas.cambiarPlan),
    OrganizacionController.cambiarPlan
);

module.exports = router;