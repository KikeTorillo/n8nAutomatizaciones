/**
 * Rutas de Organizaciones
 * Endpoints para gestión CRUD de organizaciones (tenants)
 * Incluye middleware de autenticación y validaciones con Joi
 */

const express = require('express');
const OrganizacionController = require('../../../controllers/organizacion.controller');
const { auth, tenant, rateLimiting, validation } = require('../../../middleware');
const organizacionSchemas = require('../../../schemas/organizacion.schemas');

const router = express.Router();

/**
 * @route   POST /api/v1/organizaciones
 * @desc    Crear nueva organización
 * @access  Public (para registro inicial) / Private (super_admin)
 */
router.post('/',
    auth.authenticateToken,
    rateLimiting.apiRateLimit,
    validation.validate(organizacionSchemas.crear),
    OrganizacionController.crear
);

/**
 * @route   GET /api/v1/organizaciones
 * @desc    Listar organizaciones con paginación y filtros
 * @access  Private (super_admin, admin)
 */
router.get('/',
    auth.authenticateToken,
    rateLimiting.apiRateLimit,
    validation.validate(organizacionSchemas.listar),
    OrganizacionController.listar
);

/**
 * @route   POST /api/v1/organizaciones/onboarding
 * @desc    Proceso completo de onboarding para nueva organización
 * @access  Private (super_admin)
 * @note    DEBE IR ANTES de /:id para evitar que /onboarding se interprete como :id
 */
router.post('/onboarding',
    auth.authenticateToken,
    auth.requireRole(['super_admin']),
    rateLimiting.heavyOperationRateLimit,
    validation.validate(organizacionSchemas.onboarding),
    OrganizacionController.onboarding
);

/**
 * @route   GET /api/v1/organizaciones/:id
 * @desc    Obtener organización por ID
 * @access  Private (super_admin, admin de la org)
 */
router.get('/:id',
    auth.authenticateToken,
    rateLimiting.apiRateLimit,
    validation.validate(organizacionSchemas.obtenerPorId),
    OrganizacionController.obtenerPorId
);

/**
 * @route   PUT /api/v1/organizaciones/:id
 * @desc    Actualizar organización
 * @access  Private (super_admin, admin de la org)
 */
router.put('/:id',
    auth.authenticateToken,
    rateLimiting.apiRateLimit,
    validation.validate(organizacionSchemas.actualizar),
    OrganizacionController.actualizar
);

/**
 * @route   DELETE /api/v1/organizaciones/:id
 * @desc    Desactivar organización (soft delete)
 * @access  Private (super_admin only)
 */
router.delete('/:id',
    auth.authenticateToken,
    auth.requireRole(['super_admin']),
    rateLimiting.heavyOperationRateLimit,
    validation.validate(organizacionSchemas.desactivar),
    OrganizacionController.desactivar
);

/**
 * @route   GET /api/v1/organizaciones/:id/limites
 * @desc    Verificar límites de organización (citas, profesionales, servicios)
 * @access  Private (super_admin, admin de la org)
 */
router.get('/:id/limites',
    auth.authenticateToken,
    tenant.setTenantContext,
    validation.validate(organizacionSchemas.verificarLimites),
    OrganizacionController.verificarLimites
);

/**
 * @route   GET /api/v1/organizaciones/:id/estadisticas
 * @desc    Obtener estadísticas de organización
 * @access  Private (super_admin, admin de la org)
 */
router.get('/:id/estadisticas',
    auth.authenticateToken,
    tenant.setTenantContext,
    validation.validate(organizacionSchemas.obtenerEstadisticas),
    OrganizacionController.obtenerEstadisticas
);

/**
 * @route   PUT /api/v1/organizaciones/:id/suspender
 * @desc    Suspender organización
 * @access  Private (super_admin)
 */
router.put('/:id/suspender',
    auth.authenticateToken,
    auth.requireRole(['super_admin']),
    rateLimiting.heavyOperationRateLimit,
    validation.validate(organizacionSchemas.suspender),
    OrganizacionController.suspender
);

/**
 * @route   PUT /api/v1/organizaciones/:id/reactivar
 * @desc    Reactivar organización suspendida
 * @access  Private (super_admin)
 */
router.put('/:id/reactivar',
    auth.authenticateToken,
    auth.requireRole(['super_admin']),
    rateLimiting.heavyOperationRateLimit,
    validation.validate(organizacionSchemas.reactivar),
    OrganizacionController.reactivar
);

/**
 * @route   GET /api/v1/organizaciones/:id/metricas
 * @desc    Obtener métricas detalladas de organización para dashboard
 * @access  Private (super_admin, admin de la org)
 */
router.get('/:id/metricas',
    auth.authenticateToken,
    tenant.setTenantContext,
    validation.validate(organizacionSchemas.obtenerMetricas),
    OrganizacionController.obtenerMetricas
);

/**
 * @route   PUT /api/v1/organizaciones/:id/plan
 * @desc    Cambiar plan de subscripción de organización
 * @access  Private (super_admin)
 */
router.put('/:id/plan',
    auth.authenticateToken,
    auth.requireRole(['super_admin']),
    rateLimiting.heavyOperationRateLimit,
    validation.validate(organizacionSchemas.cambiarPlan),
    OrganizacionController.cambiarPlan
);

module.exports = router;