/**
 * ====================================================================
 * RUTAS AUTENTICADAS - FELICITACIONES (LIBRO DE VISITAS)
 * ====================================================================
 * Rutas para gestión de felicitaciones (requiere autenticación + módulo activo).
 *
 * Endpoints:
 * POST   /eventos/:eventoId/felicitaciones  - Crear felicitación
 * GET    /eventos/:eventoId/felicitaciones  - Listar felicitaciones
 * GET    /felicitaciones/:id                - Obtener felicitación
 * PUT    /felicitaciones/:id/aprobar        - Aprobar felicitación
 * PUT    /felicitaciones/:id/rechazar       - Rechazar felicitación
 * DELETE /felicitaciones/:id                - Eliminar felicitación
 *
 * Fecha creación: 4 Diciembre 2025
 */

const express = require('express');
const router = express.Router();

// Controllers
const FelicitacionesController = require('../controllers/felicitaciones.controller');

// Schemas
const felicitacionesSchemas = require('../schemas/felicitacion.schemas');

// Middlewares
const {
    auth,
    tenant,
    modules,
    subscription,
    rateLimiting,
    validation: { validate },
    asyncHandler
} = require('../../../middleware');

// ============================================================================
// MIDDLEWARE COMÚN
// ============================================================================
const middlewareComun = [
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('eventos-digitales'),
    rateLimiting.apiRateLimit
];

// ============================================================================
// RUTAS DE FELICITACIONES POR EVENTO
// ============================================================================

/**
 * POST /eventos/:eventoId/felicitaciones
 * Crear felicitación
 */
router.post('/eventos/:eventoId/felicitaciones',
    ...middlewareComun,
    validate(felicitacionesSchemas.crearFelicitacion),
    asyncHandler(FelicitacionesController.crear)
);

/**
 * GET /eventos/:eventoId/felicitaciones
 * Listar felicitaciones del evento
 */
router.get('/eventos/:eventoId/felicitaciones',
    ...middlewareComun,
    validate(felicitacionesSchemas.listarFelicitaciones),
    asyncHandler(FelicitacionesController.listar)
);

// ============================================================================
// RUTAS DE FELICITACIÓN INDIVIDUAL
// ============================================================================

/**
 * GET /felicitaciones/:id
 * Obtener felicitación por ID
 */
router.get('/felicitaciones/:id',
    ...middlewareComun,
    validate(felicitacionesSchemas.obtenerFelicitacion),
    asyncHandler(FelicitacionesController.obtenerPorId)
);

/**
 * PUT /felicitaciones/:id/aprobar
 * Aprobar felicitación
 */
router.put('/felicitaciones/:id/aprobar',
    ...middlewareComun,
    validate(felicitacionesSchemas.cambiarAprobacion),
    asyncHandler(FelicitacionesController.aprobar)
);

/**
 * PUT /felicitaciones/:id/rechazar
 * Rechazar felicitación
 */
router.put('/felicitaciones/:id/rechazar',
    ...middlewareComun,
    validate(felicitacionesSchemas.cambiarAprobacion),
    asyncHandler(FelicitacionesController.rechazar)
);

/**
 * DELETE /felicitaciones/:id
 * Eliminar felicitación
 */
router.delete('/felicitaciones/:id',
    ...middlewareComun,
    validate(felicitacionesSchemas.eliminarFelicitacion),
    asyncHandler(FelicitacionesController.eliminar)
);

module.exports = router;
