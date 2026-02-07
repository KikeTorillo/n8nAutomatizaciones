/**
 * ====================================================================
 * RUTAS AUTENTICADAS - MESAS DE EVENTOS (Seating Chart)
 * ====================================================================
 * Rutas para gestión de mesas y asignación de invitados.
 *
 * Endpoints:
 * POST   /eventos/:eventoId/mesas                  - Crear mesa
 * GET    /eventos/:eventoId/mesas                  - Listar mesas
 * GET    /eventos/:eventoId/mesas/estadisticas     - Estadísticas de ocupación
 * GET    /mesas/:mesaId                            - Obtener mesa
 * PUT    /eventos/:eventoId/mesas/:mesaId          - Actualizar mesa
 * DELETE /mesas/:mesaId                            - Eliminar mesa
 * PATCH  /eventos/:eventoId/mesas/posiciones       - Batch update posiciones
 * POST   /eventos/:eventoId/mesas/:mesaId/asignar  - Asignar invitado
 * DELETE /invitados/:invitadoId/mesa               - Desasignar invitado
 *
 * Fecha creación: 8 Diciembre 2025
 */

const express = require('express');
const router = express.Router();

// Controllers
const MesasController = require('../controllers/mesas.controller');

// Schemas
const mesasSchemas = require('../schemas/mesa.schemas');

// Middlewares
const {
    auth,
    tenant,
    modules,
    subscription,
    rateLimiting,
    validation: { validate }
} = require('../../../middleware');

// ============================================================================
// MIDDLEWARE COMÚN
// ============================================================================
const middlewareComun = [
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('eventos-digitales'),
    rateLimiting.userRateLimit
];

// ============================================================================
// RUTAS DE MESAS POR EVENTO
// ============================================================================

/**
 * POST /eventos/:eventoId/mesas
 * Crear mesa
 */
router.post('/eventos/:eventoId/mesas',
    ...middlewareComun,
    validate(mesasSchemas.crearMesa),
    MesasController.crear
);

/**
 * GET /eventos/:eventoId/mesas
 * Listar mesas del evento
 */
router.get('/eventos/:eventoId/mesas',
    ...middlewareComun,
    validate(mesasSchemas.listarMesas),
    MesasController.listar
);

/**
 * GET /eventos/:eventoId/mesas/estadisticas
 * Obtener estadísticas de ocupación
 */
router.get('/eventos/:eventoId/mesas/estadisticas',
    ...middlewareComun,
    validate(mesasSchemas.obtenerEstadisticas),
    MesasController.obtenerEstadisticas
);

/**
 * PATCH /eventos/:eventoId/mesas/posiciones
 * Actualizar posiciones de múltiples mesas (batch)
 */
router.patch('/eventos/:eventoId/mesas/posiciones',
    ...middlewareComun,
    validate(mesasSchemas.actualizarPosiciones),
    MesasController.actualizarPosiciones
);

/**
 * PUT /eventos/:eventoId/mesas/:mesaId
 * Actualizar mesa
 */
router.put('/eventos/:eventoId/mesas/:mesaId',
    ...middlewareComun,
    validate(mesasSchemas.actualizarMesa),
    MesasController.actualizar
);

/**
 * POST /eventos/:eventoId/mesas/:mesaId/asignar
 * Asignar invitado a mesa
 */
router.post('/eventos/:eventoId/mesas/:mesaId/asignar',
    ...middlewareComun,
    validate(mesasSchemas.asignarInvitado),
    MesasController.asignarInvitado
);

// ============================================================================
// RUTAS DE MESAS DIRECTAS
// ============================================================================

/**
 * GET /mesas/:mesaId
 * Obtener mesa por ID
 */
router.get('/mesas/:mesaId',
    ...middlewareComun,
    validate(mesasSchemas.obtenerMesa),
    MesasController.obtenerPorId
);

/**
 * DELETE /mesas/:mesaId
 * Eliminar mesa
 */
router.delete('/mesas/:mesaId',
    ...middlewareComun,
    validate(mesasSchemas.eliminarMesa),
    MesasController.eliminar
);

// ============================================================================
// RUTAS DE ASIGNACIÓN DE INVITADOS
// ============================================================================

/**
 * DELETE /invitados/:invitadoId/mesa
 * Desasignar invitado de mesa
 */
router.delete('/invitados/:invitadoId/mesa',
    ...middlewareComun,
    validate(mesasSchemas.desasignarInvitado),
    MesasController.desasignarInvitado
);

module.exports = router;
