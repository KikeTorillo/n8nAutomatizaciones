/**
 * ====================================================================
 * RUTAS AUTENTICADAS - EVENTOS DIGITALES
 * ====================================================================
 * Rutas para gestión de eventos (requiere autenticación + módulo activo).
 *
 * Endpoints:
 * POST   /api/v1/eventos-digitales/eventos          - Crear evento
 * GET    /api/v1/eventos-digitales/eventos          - Listar eventos
 * GET    /api/v1/eventos-digitales/eventos/:id      - Obtener evento
 * PUT    /api/v1/eventos-digitales/eventos/:id      - Actualizar evento
 * DELETE /api/v1/eventos-digitales/eventos/:id      - Eliminar evento
 * POST   /api/v1/eventos-digitales/eventos/:id/publicar - Publicar evento
 * GET    /api/v1/eventos-digitales/eventos/:id/estadisticas - Estadísticas
 *
 * Fecha creación: 4 Diciembre 2025
 */

const express = require('express');
const router = express.Router();

// Controllers
const EventosController = require('../controllers/eventos.controller');

// Schemas
const eventosSchemas = require('../schemas/evento.schemas');

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
// MIDDLEWARE COMÚN PARA TODAS LAS RUTAS
// ============================================================================
// Todas las rutas de este archivo requieren:
// - Autenticación JWT
// - Contexto de tenant (RLS)
// - Módulo eventos-digitales activo
// - Suscripción activa

const middlewareComun = [
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('eventos-digitales'),
    rateLimiting.apiRateLimit
];

// ============================================================================
// RUTAS DE EVENTOS
// ============================================================================

/**
 * POST /eventos
 * Crear nuevo evento
 */
router.post('/eventos',
    ...middlewareComun,
    validate(eventosSchemas.crearEvento),
    asyncHandler(EventosController.crear)
);

/**
 * GET /eventos
 * Listar eventos de la organización
 */
router.get('/eventos',
    ...middlewareComun,
    validate(eventosSchemas.listarEventos),
    asyncHandler(EventosController.listar)
);

/**
 * GET /eventos/:id
 * Obtener evento por ID
 */
router.get('/eventos/:id',
    ...middlewareComun,
    validate(eventosSchemas.obtenerEvento),
    asyncHandler(EventosController.obtenerPorId)
);

/**
 * PUT /eventos/:id
 * Actualizar evento
 */
router.put('/eventos/:id',
    ...middlewareComun,
    validate(eventosSchemas.actualizarEvento),
    asyncHandler(EventosController.actualizar)
);

/**
 * DELETE /eventos/:id
 * Eliminar evento (soft delete)
 */
router.delete('/eventos/:id',
    ...middlewareComun,
    validate(eventosSchemas.eliminarEvento),
    asyncHandler(EventosController.eliminar)
);

/**
 * POST /eventos/:id/publicar
 * Publicar evento (cambiar estado de borrador a publicado)
 */
router.post('/eventos/:id/publicar',
    ...middlewareComun,
    validate(eventosSchemas.publicarEvento),
    asyncHandler(EventosController.publicar)
);

/**
 * GET /eventos/:id/estadisticas
 * Obtener estadísticas de RSVP del evento
 */
router.get('/eventos/:id/estadisticas',
    ...middlewareComun,
    validate(eventosSchemas.estadisticasEvento),
    asyncHandler(EventosController.estadisticas)
);

module.exports = router;
