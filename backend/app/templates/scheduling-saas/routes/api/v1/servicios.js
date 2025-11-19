// Rutas de Servicios - CRUD con aislamiento multi-tenant

const express = require('express');
const ServicioController = require('../../../controllers/servicio.controller');
const { auth, tenant, rateLimiting, validation, subscription } = require('../../../../../middleware');
const servicioSchemas = require('../../../schemas/servicio.schemas');

const router = express.Router();

// ========== Rutas de Búsqueda ==========
router.get('/buscar',
    rateLimiting.apiRateLimit,
    auth.authenticateToken,
    tenant.setTenantContext,
    validation.validate(servicioSchemas.buscar),
    ServicioController.buscar
);

router.get('/estadisticas',
    rateLimiting.apiRateLimit,
    auth.authenticateToken,
    tenant.setTenantContext,
    validation.validate(servicioSchemas.obtenerEstadisticas),
    ServicioController.obtenerEstadisticas
);

router.get('/estadisticas/asignaciones',
    rateLimiting.apiRateLimit,
    auth.authenticateToken,
    tenant.setTenantContext,
    (req, res, next) => ServicioController.obtenerEstadisticasAsignaciones(req, res, next)
);

// ========== Rutas de Plantillas ==========
router.post('/desde-plantilla',
    rateLimiting.heavyOperationRateLimit,
    auth.authenticateToken,
    tenant.setTenantContext,
    validation.validate(servicioSchemas.crearDesdePlantilla),
    ServicioController.crearDesdeePlantilla
);

// ========== Rutas Servicios-Profesionales ==========
router.get('/profesionales/:profesional_id/servicios',
    rateLimiting.apiRateLimit,
    auth.authenticateToken,
    tenant.setTenantContext,
    validation.validate(servicioSchemas.obtenerServiciosPorProfesional),
    ServicioController.obtenerServiciosPorProfesional
);

router.post('/:id/profesionales',
    rateLimiting.apiRateLimit,
    auth.authenticateToken,
    tenant.setTenantContext,
    validation.validate(servicioSchemas.asignarProfesional),
    ServicioController.asignarProfesional
);

router.get('/:id/profesionales',
    rateLimiting.apiRateLimit,
    auth.authenticateToken,
    tenant.setTenantContext,
    validation.validate(servicioSchemas.obtenerProfesionales),
    ServicioController.obtenerProfesionales
);

router.delete('/:id/profesionales/:profesional_id',
    rateLimiting.apiRateLimit,
    auth.authenticateToken,
    tenant.setTenantContext,
    validation.validate(servicioSchemas.desasignarProfesional),
    ServicioController.desasignarProfesional
);

// ========== Rutas Bulk ==========

router.post('/bulk-create',
    rateLimiting.heavyOperationRateLimit,
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    subscription.checkActiveSubscription,  // ✅ Verificar suscripción activa
    // NO agregar checkResourceLimit aquí - se valida dentro del método bulkCrear
    auth.requireAdminRole,
    validation.validate(servicioSchemas.bulkCrear),
    ServicioController.bulkCrear
);

// ========== Rutas CRUD Estándar ==========
router.post('/',
    rateLimiting.apiRateLimit,
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    subscription.checkActiveSubscription,         // ✅ Verificar suscripción activa
    subscription.checkResourceLimit('servicios'), // ✅ Verificar límite de servicios
    validation.validate(servicioSchemas.crear),
    ServicioController.crear
);

router.get('/:id',
    rateLimiting.apiRateLimit,
    auth.authenticateToken,
    tenant.setTenantContext,
    validation.validate(servicioSchemas.obtenerPorId),
    ServicioController.obtenerPorId
);

router.get('/',
    rateLimiting.apiRateLimit,
    auth.authenticateToken,
    tenant.setTenantContext,
    validation.validate(servicioSchemas.listar),
    ServicioController.listar
);

router.put('/:id',
    rateLimiting.heavyOperationRateLimit,
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    validation.validate(servicioSchemas.actualizar),
    ServicioController.actualizar
);

router.delete('/:id',
    rateLimiting.heavyOperationRateLimit,
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    validation.validate(servicioSchemas.eliminar),
    ServicioController.eliminar
);

router.delete('/:id/permanente',
    rateLimiting.heavyOperationRateLimit,
    auth.authenticateToken,
    auth.requireRole('super_admin'),
    tenant.setTenantContext,
    validation.validate(servicioSchemas.eliminarPermanente),
    ServicioController.eliminarPermanente
);

module.exports = router;
