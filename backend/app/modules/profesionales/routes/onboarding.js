/**
 * Rutas de Onboarding de Empleados
 * Fase 5 del Plan de Empleados Competitivo - Enero 2026
 *
 * Rutas para gestionar plantillas de onboarding y dashboard RRHH.
 * Las rutas de progreso individual están en /profesionales/:id/onboarding
 */
const express = require('express');
const OnboardingController = require('../controllers/onboarding.controller');
const { auth, tenant, rateLimiting, validation } = require('../../../middleware');
const schemas = require('../schemas/onboarding.schemas');

const router = express.Router();

// ========== PLANTILLAS DE ONBOARDING ==========

// GET /onboarding-empleados/plantillas - Listar plantillas
router.get('/plantillas',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.listarPlantillas),
    OnboardingController.listarPlantillas
);

// POST /onboarding-empleados/plantillas - Crear plantilla
router.post('/plantillas',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.crearPlantilla),
    OnboardingController.crearPlantilla
);

// GET /onboarding-empleados/plantillas/sugeridas/:profesionalId - Plantillas sugeridas
router.get('/plantillas/sugeridas/:profesionalId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.plantillasSugeridas),
    OnboardingController.obtenerPlantillasSugeridas
);

// GET /onboarding-empleados/plantillas/:id - Obtener plantilla con tareas
router.get('/plantillas/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.obtenerPlantilla),
    OnboardingController.obtenerPlantilla
);

// PUT /onboarding-empleados/plantillas/:id - Actualizar plantilla
router.put('/plantillas/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.actualizarPlantilla),
    OnboardingController.actualizarPlantilla
);

// DELETE /onboarding-empleados/plantillas/:id - Eliminar plantilla
router.delete('/plantillas/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.eliminarPlantilla),
    OnboardingController.eliminarPlantilla
);

// ========== TAREAS DE PLANTILLA ==========

// POST /onboarding-empleados/plantillas/:id/tareas - Agregar tarea
router.post('/plantillas/:id/tareas',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.crearTarea),
    OnboardingController.crearTarea
);

// PATCH /onboarding-empleados/plantillas/:id/tareas/reordenar - Reordenar tareas
router.patch('/plantillas/:id/tareas/reordenar',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.reordenarTareas),
    OnboardingController.reordenarTareas
);

// PUT /onboarding-empleados/tareas/:tareaId - Actualizar tarea
router.put('/tareas/:tareaId',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.actualizarTarea),
    OnboardingController.actualizarTarea
);

// DELETE /onboarding-empleados/tareas/:tareaId - Eliminar tarea
router.delete('/tareas/:tareaId',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.eliminarTarea),
    OnboardingController.eliminarTarea
);

// ========== DASHBOARD RRHH ==========

// GET /onboarding-empleados/dashboard - Dashboard general
router.get('/dashboard',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.obtenerDashboard),
    OnboardingController.obtenerDashboard
);

// GET /onboarding-empleados/vencidas - Tareas vencidas
router.get('/vencidas',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.obtenerTareasVencidas),
    OnboardingController.obtenerTareasVencidas
);

module.exports = router;
