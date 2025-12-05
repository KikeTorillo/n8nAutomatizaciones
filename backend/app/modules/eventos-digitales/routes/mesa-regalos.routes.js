/**
 * ====================================================================
 * RUTAS AUTENTICADAS - MESA DE REGALOS
 * ====================================================================
 * Rutas para gestión de mesa de regalos (requiere autenticación + módulo activo).
 *
 * Endpoints:
 * POST   /eventos/:eventoId/mesa-regalos              - Crear regalo
 * GET    /eventos/:eventoId/mesa-regalos              - Listar regalos
 * GET    /eventos/:eventoId/mesa-regalos/estadisticas - Estadísticas
 * GET    /mesa-regalos/:id                            - Obtener regalo
 * PUT    /mesa-regalos/:id                            - Actualizar regalo
 * PUT    /mesa-regalos/:id/comprar                    - Marcar comprado
 * DELETE /mesa-regalos/:id                            - Eliminar regalo
 *
 * Fecha creación: 4 Diciembre 2025
 */

const express = require('express');
const router = express.Router();

// Controllers
const MesaRegalosController = require('../controllers/mesa-regalos.controller');

// Schemas
const mesaRegalosSchemas = require('../schemas/mesa-regalos.schema');

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
// RUTAS DE MESA DE REGALOS POR EVENTO
// ============================================================================

/**
 * POST /eventos/:eventoId/mesa-regalos
 * Crear regalo
 */
router.post('/eventos/:eventoId/mesa-regalos',
    ...middlewareComun,
    validate(mesaRegalosSchemas.crearRegalo),
    asyncHandler(MesaRegalosController.crear)
);

/**
 * GET /eventos/:eventoId/mesa-regalos
 * Listar regalos del evento
 */
router.get('/eventos/:eventoId/mesa-regalos',
    ...middlewareComun,
    validate(mesaRegalosSchemas.listarRegalos),
    asyncHandler(MesaRegalosController.listar)
);

/**
 * GET /eventos/:eventoId/mesa-regalos/estadisticas
 * Estadísticas de mesa de regalos
 */
router.get('/eventos/:eventoId/mesa-regalos/estadisticas',
    ...middlewareComun,
    validate(mesaRegalosSchemas.estadisticasRegalos),
    asyncHandler(MesaRegalosController.estadisticas)
);

// ============================================================================
// RUTAS DE REGALO INDIVIDUAL
// ============================================================================

/**
 * GET /mesa-regalos/:id
 * Obtener regalo por ID
 */
router.get('/mesa-regalos/:id',
    ...middlewareComun,
    validate(mesaRegalosSchemas.obtenerRegalo),
    asyncHandler(MesaRegalosController.obtenerPorId)
);

/**
 * PUT /mesa-regalos/:id
 * Actualizar regalo
 */
router.put('/mesa-regalos/:id',
    ...middlewareComun,
    validate(mesaRegalosSchemas.actualizarRegalo),
    asyncHandler(MesaRegalosController.actualizar)
);

/**
 * PUT /mesa-regalos/:id/comprar
 * Marcar regalo como comprado
 */
router.put('/mesa-regalos/:id/comprar',
    ...middlewareComun,
    validate(mesaRegalosSchemas.marcarComprado),
    asyncHandler(MesaRegalosController.marcarComprado)
);

/**
 * DELETE /mesa-regalos/:id
 * Eliminar regalo
 */
router.delete('/mesa-regalos/:id',
    ...middlewareComun,
    validate(mesaRegalosSchemas.eliminarRegalo),
    asyncHandler(MesaRegalosController.eliminar)
);

module.exports = router;
