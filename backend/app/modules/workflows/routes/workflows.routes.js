/**
 * ====================================================================
 * ROUTES - WORKFLOWS
 * ====================================================================
 *
 * Rutas para gestión de workflows de aprobación:
 * - Bandeja de aprobaciones pendientes
 * - Aprobar/Rechazar solicitudes
 * - Historial de aprobaciones
 * - Gestión de delegaciones
 * - Consulta de definiciones
 */

const express = require('express');
const AprobacionesController = require('../controllers');
const { auth, tenant, rateLimiting, validation, modules, permisos } = require('../../../middleware');
const workflowsSchemas = require('../schemas/workflows.schemas');

const router = express.Router();
const validate = validation.validate;

// ===================================================================
// BANDEJA DE APROBACIONES
// ===================================================================

/**
 * GET /api/v1/workflows/pendientes
 * Obtener aprobaciones pendientes del usuario actual
 */
router.get('/pendientes',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('workflows'),
    rateLimiting.apiRateLimit,
    validate(workflowsSchemas.listarPendientes),
    AprobacionesController.listarPendientes
);

/**
 * GET /api/v1/workflows/pendientes/count
 * Contar aprobaciones pendientes (para badge)
 */
router.get('/pendientes/count',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('workflows'),
    rateLimiting.apiRateLimit,
    AprobacionesController.contarPendientes
);

// ===================================================================
// INSTANCIAS
// ===================================================================

/**
 * GET /api/v1/workflows/instancias/:id
 * Obtener detalle de una instancia de workflow
 */
router.get('/instancias/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('workflows'),
    rateLimiting.apiRateLimit,
    validate(workflowsSchemas.obtenerPorId),
    AprobacionesController.obtenerInstancia
);

/**
 * POST /api/v1/workflows/instancias/:id/aprobar
 * Aprobar una solicitud
 */
router.post('/instancias/:id/aprobar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('workflows'),
    tenant.verifyTenantActive,
    permisos.verificarPermiso('workflows.aprobar'),
    rateLimiting.apiRateLimit,
    validate(workflowsSchemas.aprobar),
    AprobacionesController.aprobar
);

/**
 * POST /api/v1/workflows/instancias/:id/rechazar
 * Rechazar una solicitud
 */
router.post('/instancias/:id/rechazar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('workflows'),
    tenant.verifyTenantActive,
    permisos.verificarPermiso('workflows.aprobar'),
    rateLimiting.apiRateLimit,
    validate(workflowsSchemas.rechazar),
    AprobacionesController.rechazar
);

// ===================================================================
// HISTORIAL
// ===================================================================

/**
 * GET /api/v1/workflows/historial
 * Obtener historial de aprobaciones
 */
router.get('/historial',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('workflows'),
    rateLimiting.apiRateLimit,
    validate(workflowsSchemas.listarHistorial),
    AprobacionesController.listarHistorial
);

// ===================================================================
// DELEGACIONES
// ===================================================================

/**
 * GET /api/v1/workflows/delegaciones
 * Listar delegaciones del usuario
 */
router.get('/delegaciones',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('workflows'),
    rateLimiting.apiRateLimit,
    validate(workflowsSchemas.listarDelegaciones),
    AprobacionesController.listarDelegaciones
);

/**
 * POST /api/v1/workflows/delegaciones
 * Crear nueva delegación
 */
router.post('/delegaciones',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('workflows'),
    tenant.verifyTenantActive,
    permisos.verificarPermiso('workflows.aprobar'),
    rateLimiting.apiRateLimit,
    validate(workflowsSchemas.crearDelegacion),
    AprobacionesController.crearDelegacion
);

/**
 * PUT /api/v1/workflows/delegaciones/:id
 * Actualizar delegación
 */
router.put('/delegaciones/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('workflows'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(workflowsSchemas.actualizarDelegacion),
    AprobacionesController.actualizarDelegacion
);

/**
 * DELETE /api/v1/workflows/delegaciones/:id
 * Eliminar delegación
 */
router.delete('/delegaciones/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('workflows'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(workflowsSchemas.eliminarDelegacion),
    AprobacionesController.eliminarDelegacion
);

// ===================================================================
// DEFINICIONES (LECTURA)
// ===================================================================

/**
 * GET /api/v1/workflows/definiciones
 * Listar definiciones de workflows
 */
router.get('/definiciones',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('workflows'),
    rateLimiting.apiRateLimit,
    validate(workflowsSchemas.listarDefiniciones),
    AprobacionesController.listarDefiniciones
);

/**
 * GET /api/v1/workflows/definiciones/:id
 * Obtener definición por ID
 */
router.get('/definiciones/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('workflows'),
    rateLimiting.apiRateLimit,
    validate(workflowsSchemas.obtenerDefinicion),
    AprobacionesController.obtenerDefinicion
);

module.exports = router;
