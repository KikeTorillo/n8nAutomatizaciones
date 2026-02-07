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
 * - Designer (CRUD de definiciones)
 */

const express = require('express');
const { AprobacionesController, DesignerController } = require('../controllers');
const { auth, tenant, rateLimiting, validation, modules, permisos } = require('../../../middleware');
const workflowsSchemas = require('../schemas/workflows.schemas');
const designerSchemas = require('../schemas/designer.schemas');

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
    rateLimiting.userRateLimit,
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
    rateLimiting.userRateLimit,
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
    rateLimiting.userRateLimit,
    validate(workflowsSchemas.obtenerPorId),
    AprobacionesController.obtenerInstancia
);

/**
 * POST /api/v1/workflows/instancias/:id/aprobar
 * Aprobar una solicitud
 * Nota: No usa permisos.verificarPermiso porque:
 * 1. Las aprobaciones son a nivel organización, no sucursal
 * 2. WorkflowEngine.aprobar() ya verifica permisos con puede_aprobar_workflow()
 */
router.post('/instancias/:id/aprobar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('workflows'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(workflowsSchemas.aprobar),
    AprobacionesController.aprobar
);

/**
 * POST /api/v1/workflows/instancias/:id/rechazar
 * Rechazar una solicitud
 * Nota: No usa permisos.verificarPermiso - WorkflowEngine ya verifica permisos
 */
router.post('/instancias/:id/rechazar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('workflows'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
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
    rateLimiting.userRateLimit,
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
    rateLimiting.userRateLimit,
    validate(workflowsSchemas.listarDelegaciones),
    AprobacionesController.listarDelegaciones
);

/**
 * POST /api/v1/workflows/delegaciones
 * Crear nueva delegación
 * Nota: Delegaciones son a nivel organización, no requiere verificar sucursal
 */
router.post('/delegaciones',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('workflows'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
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
    rateLimiting.userRateLimit,
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
    rateLimiting.userRateLimit,
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
    rateLimiting.userRateLimit,
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
    rateLimiting.userRateLimit,
    validate(workflowsSchemas.obtenerDefinicion),
    AprobacionesController.obtenerDefinicion
);

// ===================================================================
// DESIGNER - CRUD DE DEFINICIONES
// ===================================================================
// Requiere permiso 'workflows.gestionar'

/**
 * GET /api/v1/workflows/designer/entidades
 * Listar tipos de entidad disponibles
 */
router.get('/designer/entidades',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('workflows'),
    permisos.verificarPermiso('workflows.gestionar'),
    rateLimiting.userRateLimit,
    DesignerController.listarEntidades
);

/**
 * GET /api/v1/workflows/designer/roles
 * Listar roles disponibles para aprobadores
 */
router.get('/designer/roles',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('workflows'),
    permisos.verificarPermiso('workflows.gestionar'),
    rateLimiting.userRateLimit,
    DesignerController.listarRoles
);

/**
 * GET /api/v1/workflows/designer/permisos
 * Listar permisos disponibles para aprobadores
 */
router.get('/designer/permisos',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('workflows'),
    permisos.verificarPermiso('workflows.gestionar'),
    rateLimiting.userRateLimit,
    DesignerController.listarPermisos
);

/**
 * POST /api/v1/workflows/designer/definiciones
 * Crear nueva definición de workflow
 */
router.post('/designer/definiciones',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('workflows'),
    tenant.verifyTenantActive,
    permisos.verificarPermiso('workflows.gestionar'),
    rateLimiting.userRateLimit,
    validate(designerSchemas.crearDefinicion),
    DesignerController.crear
);

/**
 * PUT /api/v1/workflows/designer/definiciones/:id
 * Actualizar definición de workflow
 */
router.put('/designer/definiciones/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('workflows'),
    tenant.verifyTenantActive,
    permisos.verificarPermiso('workflows.gestionar'),
    rateLimiting.userRateLimit,
    validate(designerSchemas.actualizarDefinicion),
    DesignerController.actualizar
);

/**
 * DELETE /api/v1/workflows/designer/definiciones/:id
 * Eliminar definición de workflow
 */
router.delete('/designer/definiciones/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('workflows'),
    tenant.verifyTenantActive,
    permisos.verificarPermiso('workflows.gestionar'),
    rateLimiting.userRateLimit,
    validate(designerSchemas.eliminarDefinicion),
    DesignerController.eliminar
);

/**
 * POST /api/v1/workflows/designer/definiciones/:id/duplicar
 * Duplicar un workflow existente
 */
router.post('/designer/definiciones/:id/duplicar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('workflows'),
    tenant.verifyTenantActive,
    permisos.verificarPermiso('workflows.gestionar'),
    rateLimiting.userRateLimit,
    validate(designerSchemas.duplicarDefinicion),
    DesignerController.duplicar
);

/**
 * PATCH /api/v1/workflows/designer/definiciones/:id/publicar
 * Publicar o despublicar workflow
 */
router.patch('/designer/definiciones/:id/publicar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('workflows'),
    tenant.verifyTenantActive,
    permisos.verificarPermiso('workflows.gestionar'),
    rateLimiting.userRateLimit,
    validate(designerSchemas.cambiarEstadoPublicacion),
    DesignerController.cambiarEstadoPublicacion
);

/**
 * GET /api/v1/workflows/designer/definiciones/:id/validar
 * Validar estructura de un workflow
 */
router.get('/designer/definiciones/:id/validar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('workflows'),
    permisos.verificarPermiso('workflows.gestionar'),
    rateLimiting.userRateLimit,
    DesignerController.validarWorkflow
);

module.exports = router;
