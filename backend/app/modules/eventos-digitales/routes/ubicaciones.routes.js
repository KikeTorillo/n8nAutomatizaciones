/**
 * ====================================================================
 * RUTAS AUTENTICADAS - UBICACIONES DE EVENTOS
 * ====================================================================
 * Rutas para gestión de ubicaciones (requiere autenticación + módulo activo).
 *
 * Endpoints:
 * POST   /eventos/:eventoId/ubicaciones           - Crear ubicación
 * GET    /eventos/:eventoId/ubicaciones           - Listar ubicaciones
 * PUT    /eventos/:eventoId/ubicaciones/reordenar - Reordenar ubicaciones
 * GET    /ubicaciones/:id                         - Obtener ubicación
 * PUT    /ubicaciones/:id                         - Actualizar ubicación
 * DELETE /ubicaciones/:id                         - Eliminar ubicación
 *
 * Fecha creación: 4 Diciembre 2025
 */

const express = require('express');
const router = express.Router();

// Controllers
const UbicacionesController = require('../controllers/ubicaciones.controller');

// Schemas
const ubicacionesSchemas = require('../schemas/ubicacion.schema');

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
    subscription.checkActiveSubscription,
    rateLimiting.apiRateLimit
];

// ============================================================================
// RUTAS DE UBICACIONES POR EVENTO
// ============================================================================

/**
 * POST /eventos/:eventoId/ubicaciones
 * Crear ubicación
 */
router.post('/eventos/:eventoId/ubicaciones',
    ...middlewareComun,
    validate(ubicacionesSchemas.crearUbicacion),
    asyncHandler(UbicacionesController.crear)
);

/**
 * GET /eventos/:eventoId/ubicaciones
 * Listar ubicaciones del evento
 */
router.get('/eventos/:eventoId/ubicaciones',
    ...middlewareComun,
    validate(ubicacionesSchemas.listarUbicaciones),
    asyncHandler(UbicacionesController.listar)
);

/**
 * PUT /eventos/:eventoId/ubicaciones/reordenar
 * Reordenar ubicaciones
 */
router.put('/eventos/:eventoId/ubicaciones/reordenar',
    ...middlewareComun,
    validate(ubicacionesSchemas.reordenarUbicaciones),
    asyncHandler(UbicacionesController.reordenar)
);

// ============================================================================
// RUTAS DE UBICACIÓN INDIVIDUAL
// ============================================================================

/**
 * GET /ubicaciones/:id
 * Obtener ubicación por ID
 */
router.get('/ubicaciones/:id',
    ...middlewareComun,
    validate(ubicacionesSchemas.obtenerUbicacion),
    asyncHandler(UbicacionesController.obtenerPorId)
);

/**
 * PUT /ubicaciones/:id
 * Actualizar ubicación
 */
router.put('/ubicaciones/:id',
    ...middlewareComun,
    validate(ubicacionesSchemas.actualizarUbicacion),
    asyncHandler(UbicacionesController.actualizar)
);

/**
 * DELETE /ubicaciones/:id
 * Eliminar ubicación
 */
router.delete('/ubicaciones/:id',
    ...middlewareComun,
    validate(ubicacionesSchemas.eliminarUbicacion),
    asyncHandler(UbicacionesController.eliminar)
);

module.exports = router;
