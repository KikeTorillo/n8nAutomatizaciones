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
const mesaRegalosSchemas = require('../schemas/mesa-regalos.schemas');

// Middlewares
const {
    auth,
    tenant,
    modules,
    subscription,
    rateLimiting,
    validation: { validate }
} = require('../../../middleware');
const { requireEvento } = require('../middleware');

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
// RUTAS DE MESA DE REGALOS POR EVENTO
// ============================================================================

/**
 * POST /eventos/:eventoId/mesa-regalos
 * Crear regalo
 */
router.post('/eventos/:eventoId/mesa-regalos',
    ...middlewareComun,
    requireEvento,
    validate(mesaRegalosSchemas.crearRegalo),
    MesaRegalosController.crear
);

/**
 * GET /eventos/:eventoId/mesa-regalos
 * Listar regalos del evento
 */
router.get('/eventos/:eventoId/mesa-regalos',
    ...middlewareComun,
    requireEvento,
    validate(mesaRegalosSchemas.listarRegalos),
    MesaRegalosController.listar
);

/**
 * GET /eventos/:eventoId/mesa-regalos/estadisticas
 * Estadísticas de mesa de regalos
 */
router.get('/eventos/:eventoId/mesa-regalos/estadisticas',
    ...middlewareComun,
    requireEvento,
    validate(mesaRegalosSchemas.estadisticasRegalos),
    MesaRegalosController.estadisticas
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
    MesaRegalosController.obtenerPorId
);

/**
 * PUT /mesa-regalos/:id
 * Actualizar regalo
 */
router.put('/mesa-regalos/:id',
    ...middlewareComun,
    validate(mesaRegalosSchemas.actualizarRegalo),
    MesaRegalosController.actualizar
);

/**
 * PUT /mesa-regalos/:id/comprar
 * Marcar regalo como comprado
 */
router.put('/mesa-regalos/:id/comprar',
    ...middlewareComun,
    validate(mesaRegalosSchemas.marcarComprado),
    MesaRegalosController.marcarComprado
);

/**
 * DELETE /mesa-regalos/:id
 * Eliminar regalo
 */
router.delete('/mesa-regalos/:id',
    ...middlewareComun,
    validate(mesaRegalosSchemas.eliminarRegalo),
    MesaRegalosController.eliminar
);

module.exports = router;
