/**
 * ====================================================================
 * RUTAS DE OPORTUNIDADES B2B
 * ====================================================================
 *
 * Fase 5 - Pipeline de Oportunidades (Ene 2026)
 * Rutas para CRUD de oportunidades y pipeline Kanban
 *
 * Endpoints:
 * - GET    /oportunidades/etapas                    - Listar etapas
 * - POST   /oportunidades/etapas                    - Crear etapa
 * - PUT    /oportunidades/etapas/reordenar          - Reordenar etapas
 * - PUT    /oportunidades/etapas/:etapaId           - Actualizar etapa
 * - DELETE /oportunidades/etapas/:etapaId           - Eliminar etapa
 * - GET    /oportunidades/pipeline                  - Pipeline Kanban
 * - GET    /oportunidades/estadisticas              - Estadísticas pipeline
 * - GET    /oportunidades/pronostico                - Pronóstico ventas
 * - GET    /oportunidades                           - Listar oportunidades
 * - POST   /oportunidades                           - Crear oportunidad
 * - GET    /oportunidades/:oportunidadId            - Obtener por ID
 * - PUT    /oportunidades/:oportunidadId            - Actualizar
 * - DELETE /oportunidades/:oportunidadId            - Eliminar
 * - PATCH  /oportunidades/:oportunidadId/mover      - Mover de etapa
 * - PATCH  /oportunidades/:oportunidadId/ganar      - Marcar ganada
 * - PATCH  /oportunidades/:oportunidadId/perder     - Marcar perdida
 *
 * ====================================================================
 */

const express = require('express');
const OportunidadController = require('../controllers/oportunidad.controller');
const { auth, tenant, validation, rateLimiting } = require('../../../middleware');
const oportunidadSchemas = require('../schemas/oportunidad.schemas');

const router = express.Router();

// ===================================================================
// ETAPAS DEL PIPELINE
// ===================================================================

/**
 * GET /oportunidades/etapas
 * Listar etapas del pipeline
 */
router.get('/etapas',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    OportunidadController.listarEtapas
);

/**
 * POST /oportunidades/etapas
 * Crear nueva etapa
 */
router.post('/etapas',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validateBody(oportunidadSchemas.etapaSchema),
    OportunidadController.crearEtapa
);

/**
 * PUT /oportunidades/etapas/reordenar
 * Reordenar etapas del pipeline
 */
router.put('/etapas/reordenar',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validateBody(oportunidadSchemas.reordenarEtapasSchema),
    OportunidadController.reordenarEtapas
);

/**
 * PUT /oportunidades/etapas/:etapaId
 * Actualizar etapa
 */
router.put('/etapas/:etapaId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validateBody(oportunidadSchemas.actualizarEtapaSchema),
    OportunidadController.actualizarEtapa
);

/**
 * DELETE /oportunidades/etapas/:etapaId
 * Eliminar etapa (soft delete)
 */
router.delete('/etapas/:etapaId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    OportunidadController.eliminarEtapa
);

// ===================================================================
// PIPELINE Y REPORTES
// ===================================================================

/**
 * GET /oportunidades/pipeline
 * Obtener pipeline completo para Kanban
 */
router.get('/pipeline',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    OportunidadController.obtenerPipeline
);

/**
 * GET /oportunidades/estadisticas
 * Obtener estadísticas del pipeline
 */
router.get('/estadisticas',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    OportunidadController.obtenerEstadisticasPipeline
);

/**
 * GET /oportunidades/pronostico
 * Obtener pronóstico de ventas
 */
router.get('/pronostico',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validateQuery(oportunidadSchemas.pronosticoQuerySchema),
    OportunidadController.obtenerPronostico
);

// ===================================================================
// CRUD DE OPORTUNIDADES
// ===================================================================

/**
 * GET /oportunidades
 * Listar todas las oportunidades
 */
router.get('/',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validateQuery(oportunidadSchemas.listarOportunidadesQuerySchema),
    OportunidadController.listar
);

/**
 * POST /oportunidades
 * Crear nueva oportunidad
 */
router.post('/',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validateBody(oportunidadSchemas.oportunidadSchema),
    OportunidadController.crear
);

/**
 * GET /oportunidades/:oportunidadId
 * Obtener oportunidad por ID
 */
router.get('/:oportunidadId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    OportunidadController.obtenerPorId
);

/**
 * PUT /oportunidades/:oportunidadId
 * Actualizar oportunidad
 */
router.put('/:oportunidadId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validateBody(oportunidadSchemas.actualizarOportunidadSchema),
    OportunidadController.actualizar
);

/**
 * DELETE /oportunidades/:oportunidadId
 * Eliminar oportunidad
 */
router.delete('/:oportunidadId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    OportunidadController.eliminar
);

/**
 * PATCH /oportunidades/:oportunidadId/mover
 * Mover oportunidad a otra etapa (drag & drop)
 */
router.patch('/:oportunidadId/mover',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validateBody(oportunidadSchemas.moverOportunidadSchema),
    OportunidadController.moverAEtapa
);

/**
 * PATCH /oportunidades/:oportunidadId/ganar
 * Marcar oportunidad como ganada
 */
router.patch('/:oportunidadId/ganar',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    OportunidadController.marcarGanada
);

/**
 * PATCH /oportunidades/:oportunidadId/perder
 * Marcar oportunidad como perdida
 */
router.patch('/:oportunidadId/perder',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validateBody(oportunidadSchemas.marcarPerdidaSchema),
    OportunidadController.marcarPerdida
);

module.exports = router;
