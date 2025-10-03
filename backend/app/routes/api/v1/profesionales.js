/**
 * Rutas de Profesionales
 * Endpoints para gestión CRUD de profesionales con aislamiento multi-tenant
 */

const express = require('express');
const ProfesionalController = require('../../../controllers/profesional.controller');
const { auth, tenant, rateLimiting, validation } = require('../../../middleware');
const schemas = require('../../../schemas/profesional.schemas');

const router = express.Router();

/**
 * @route   POST /api/v1/profesionales
 * @desc    Crear nuevo profesional
 * @access  Private (admin, organizacion_admin)
 */
router.post('/',
    auth.authenticateToken,
    tenant.setTenantContext,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.crear),
    ProfesionalController.crear
);

/**
 * @route   GET /api/v1/profesionales/estadisticas
 * @desc    Obtener estadísticas de profesionales de la organización
 * @access  Private (admin, organizacion_admin)
 */
router.get('/estadisticas',
    auth.authenticateToken,
    tenant.setTenantContext,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.obtenerEstadisticas),
    ProfesionalController.obtenerEstadisticas
);

/**
 * @route   POST /api/v1/profesionales/validar-email
 * @desc    Validar disponibilidad de email
 * @access  Private (admin, organizacion_admin)
 */
router.post('/validar-email',
    auth.authenticateToken,
    tenant.setTenantContext,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.validarEmail),
    ProfesionalController.validarEmail
);

/**
 * @route   GET /api/v1/profesionales/tipo/:tipo
 * @desc    Buscar profesionales por tipo
 * @access  Private (todos los roles autenticados de la organización)
 */
router.get('/tipo/:tipo',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.buscarPorTipo),
    ProfesionalController.buscarPorTipo
);

/**
 * @route   GET /api/v1/profesionales
 * @desc    Listar profesionales con filtros y paginación
 * @access  Private (todos los roles autenticados de la organización)
 */
router.get('/',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.listar),
    ProfesionalController.listar
);

/**
 * @route   GET /api/v1/profesionales/:id
 * @desc    Obtener profesional por ID
 * @access  Private (todos los roles autenticados de la organización)
 */
router.get('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.obtenerPorId),
    ProfesionalController.obtenerPorId
);

/**
 * @route   PUT /api/v1/profesionales/:id
 * @desc    Actualizar profesional
 * @access  Private (admin, organizacion_admin)
 */
router.put('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.actualizar),
    ProfesionalController.actualizar
);

/**
 * @route   PATCH /api/v1/profesionales/:id/estado
 * @desc    Cambiar estado de profesional (activar/desactivar)
 * @access  Private (admin, organizacion_admin)
 */
router.patch('/:id/estado',
    auth.authenticateToken,
    tenant.setTenantContext,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.cambiarEstado),
    ProfesionalController.cambiarEstado
);

/**
 * @route   PATCH /api/v1/profesionales/:id/metricas
 * @desc    Actualizar métricas de profesional
 * @access  Private (sistema interno, admin)
 */
router.patch('/:id/metricas',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.actualizarMetricas),
    ProfesionalController.actualizarMetricas
);

/**
 * @route   DELETE /api/v1/profesionales/:id
 * @desc    Eliminar profesional (soft delete)
 * @access  Private (admin, organizacion_admin)
 */
router.delete('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.eliminar),
    ProfesionalController.eliminar
);

module.exports = router;
