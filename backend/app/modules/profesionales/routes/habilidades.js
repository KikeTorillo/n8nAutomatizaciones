/**
 * Rutas del Catálogo de Habilidades
 * Fase 4 del Plan de Empleados Competitivo - Enero 2026
 *
 * Rutas para gestionar el catálogo maestro de habilidades por organización.
 * Las habilidades de empleados se gestionan desde /profesionales/:id/habilidades
 */
const express = require('express');
const { CatalogoHabilidadesController } = require('../controllers/habilidad.controller');
const { auth, tenant, rateLimiting, validation } = require('../../../middleware');
const schemas = require('../schemas/profesional.schemas');

const router = express.Router();

// ========== Catálogo de Habilidades ==========

// GET /habilidades - Listar catálogo de habilidades
router.get('/',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.listarCatalogoHabilidades),
    CatalogoHabilidadesController.listar
);

// POST /habilidades - Crear habilidad en catálogo
router.post('/',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.crearHabilidadCatalogo),
    CatalogoHabilidadesController.crear
);

// GET /habilidades/:habId - Obtener habilidad del catálogo
router.get('/:habId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.obtenerHabilidadCatalogo),
    CatalogoHabilidadesController.obtenerPorId
);

// PUT /habilidades/:habId - Actualizar habilidad del catálogo
router.put('/:habId',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.actualizarHabilidadCatalogo),
    CatalogoHabilidadesController.actualizar
);

// DELETE /habilidades/:habId - Eliminar habilidad del catálogo
router.delete('/:habId',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.eliminarHabilidadCatalogo),
    CatalogoHabilidadesController.eliminar
);

// GET /habilidades/:habId/profesionales - Listar profesionales con esta habilidad
router.get('/:habId/profesionales',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    CatalogoHabilidadesController.listarProfesionales
);

module.exports = router;
