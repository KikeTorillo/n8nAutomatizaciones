/**
 * ====================================================================
 * RUTAS DE ACTIVIDADES CLIENTE (Timeline)
 * ====================================================================
 *
 * Fase 4A - Timeline de Actividad (Ene 2026)
 * Rutas para CRUD de actividades, notas, tareas y timeline
 *
 * Endpoints:
 * - GET    /clientes/:clienteId/actividades           - Listar actividades
 * - GET    /clientes/:clienteId/timeline              - Timeline unificado
 * - POST   /clientes/:clienteId/actividades           - Crear actividad
 * - GET    /clientes/:clienteId/actividades/conteo    - Contar actividades
 * - GET    /clientes/:clienteId/actividades/:id       - Obtener por ID
 * - PUT    /clientes/:clienteId/actividades/:id       - Actualizar
 * - DELETE /clientes/:clienteId/actividades/:id       - Eliminar
 * - PATCH  /clientes/:clienteId/actividades/:id/completar - Completar tarea
 *
 * ====================================================================
 */

const express = require('express');
const ActividadClienteController = require('../controllers/actividad.controller');
const { auth, tenant, validation, rateLimiting } = require('../../../middleware');
const actividadSchemas = require('../schemas/actividad.schemas');

const router = express.Router({ mergeParams: true }); // Para acceder a :clienteId

// ===================================================================
// TIMELINE Y LISTADO
// ===================================================================

/**
 * GET /clientes/:clienteId/actividades
 * Listar actividades de un cliente
 */
router.get('/',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(actividadSchemas.listar),
    ActividadClienteController.listar
);

/**
 * GET /clientes/:clienteId/timeline
 * Obtener timeline unificado (actividades + citas + ventas)
 */
router.get('/timeline',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(actividadSchemas.timeline),
    ActividadClienteController.obtenerTimeline
);

/**
 * GET /clientes/:clienteId/actividades/conteo
 * Contar actividades por tipo
 */
router.get('/conteo',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(actividadSchemas.conteo),
    ActividadClienteController.contarActividades
);

// ===================================================================
// CRUD DE ACTIVIDADES
// ===================================================================

/**
 * POST /clientes/:clienteId/actividades
 * Crear nueva actividad (nota, llamada, tarea, email)
 */
router.post('/',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(actividadSchemas.crear),
    ActividadClienteController.crear
);

/**
 * GET /clientes/:clienteId/actividades/:actividadId
 * Obtener actividad por ID
 */
router.get('/:actividadId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(actividadSchemas.obtenerPorId),
    ActividadClienteController.obtenerPorId
);

/**
 * PUT /clientes/:clienteId/actividades/:actividadId
 * Actualizar actividad
 */
router.put('/:actividadId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(actividadSchemas.actualizar),
    ActividadClienteController.actualizar
);

/**
 * DELETE /clientes/:clienteId/actividades/:actividadId
 * Eliminar actividad
 */
router.delete('/:actividadId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(actividadSchemas.eliminar),
    ActividadClienteController.eliminar
);

/**
 * PATCH /clientes/:clienteId/actividades/:actividadId/completar
 * Marcar tarea como completada
 */
router.patch('/:actividadId/completar',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(actividadSchemas.marcarCompletada),
    ActividadClienteController.marcarCompletada
);

module.exports = router;
