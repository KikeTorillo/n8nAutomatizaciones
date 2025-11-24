const express = require('express');
const router = express.Router();
const { auth, tenant, rateLimiting, validation } = require('../../../../../middleware');
const HorarioProfesionalController = require('../../../controllers/horario-profesional.controller');
const schemas = require('../../../schemas/horario-profesional.schemas');

const { validate } = validation;

// ===================================================================
// RUTAS ESPECIALES (Antes de las rutas con parámetros)
// ===================================================================

/**
 * Validar configuración de horarios de un profesional
 * GET /api/v1/horarios-profesionales/validar/:profesional_id
 */
router.get('/validar/:profesional_id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(schemas.validarConfiguracion),
    HorarioProfesionalController.validarConfiguracion
);

/**
 * Crear horarios semanales estándar (Lunes-Viernes)
 * POST /api/v1/horarios-profesionales/semanales-estandar
 */
router.post('/semanales-estandar',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validate(schemas.crearSemanalesEstandar),
    HorarioProfesionalController.crearSemanalesEstandar
);

// ===================================================================
// CRUD ESTÁNDAR
// ===================================================================

/**
 * Crear nuevo horario para un profesional
 * POST /api/v1/horarios-profesionales
 */
router.post('/',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validate(schemas.crear),
    HorarioProfesionalController.crear
);

/**
 * Listar horarios de un profesional
 * GET /api/v1/horarios-profesionales?profesional_id=X
 */
router.get('/',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(schemas.listar),
    HorarioProfesionalController.listar
);

/**
 * Obtener horario por ID
 * GET /api/v1/horarios-profesionales/:id
 */
router.get('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(schemas.obtenerPorId),
    HorarioProfesionalController.obtenerPorId
);

/**
 * Actualizar horario
 * PUT /api/v1/horarios-profesionales/:id
 */
router.put('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validate(schemas.actualizar),
    HorarioProfesionalController.actualizar
);

/**
 * Eliminar horario (soft delete)
 * DELETE /api/v1/horarios-profesionales/:id
 */
router.delete('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validate(schemas.eliminar),
    HorarioProfesionalController.eliminar
);

module.exports = router;
