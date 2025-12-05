/**
 * ====================================================================
 * RUTAS - PLANTILLAS DE EVENTOS
 * ====================================================================
 * Rutas para gestión de plantillas.
 * Lectura: autenticado (cualquier usuario con módulo activo)
 * Escritura: solo super_admin
 *
 * Endpoints:
 * GET    /plantillas                  - Listar plantillas
 * GET    /plantillas/:id              - Obtener plantilla
 * GET    /plantillas/tipo/:tipoEvento - Listar por tipo
 * POST   /plantillas                  - Crear (super_admin)
 * PUT    /plantillas/:id              - Actualizar (super_admin)
 * DELETE /plantillas/:id              - Eliminar (super_admin)
 *
 * Fecha creación: 4 Diciembre 2025
 */

const express = require('express');
const router = express.Router();

// Controllers
const PlantillasController = require('../controllers/plantillas.controller');

// Schemas
const plantillasSchemas = require('../schemas/plantilla.schema');

// Middlewares
const {
    auth,
    rateLimiting,
    validation: { validate },
    asyncHandler
} = require('../../../middleware');

// ============================================================================
// MIDDLEWARE PARA LECTURA (plantillas son globales, no requieren tenant)
// ============================================================================
const middlewareLectura = [
    auth.authenticateToken,
    rateLimiting.apiRateLimit
];

// ============================================================================
// MIDDLEWARE PARA ESCRITURA (super_admin)
// ============================================================================
const middlewareEscritura = [
    auth.authenticateToken,
    rateLimiting.apiRateLimit
];

// ============================================================================
// RUTAS DE LECTURA
// ============================================================================

/**
 * GET /plantillas
 * Listar plantillas
 */
router.get('/plantillas',
    ...middlewareLectura,
    validate(plantillasSchemas.listarPlantillas),
    asyncHandler(PlantillasController.listar)
);

/**
 * GET /plantillas/tipo/:tipoEvento
 * Listar plantillas por tipo de evento
 * Nota: Esta ruta debe ir antes de /plantillas/:id
 */
router.get('/plantillas/tipo/:tipoEvento',
    ...middlewareLectura,
    validate(plantillasSchemas.listarPorTipo),
    asyncHandler(PlantillasController.listarPorTipo)
);

/**
 * GET /plantillas/:id
 * Obtener plantilla por ID
 */
router.get('/plantillas/:id',
    ...middlewareLectura,
    validate(plantillasSchemas.obtenerPlantilla),
    asyncHandler(PlantillasController.obtenerPorId)
);

// ============================================================================
// RUTAS DE ESCRITURA (super_admin)
// ============================================================================

/**
 * POST /plantillas
 * Crear plantilla
 */
router.post('/plantillas',
    ...middlewareEscritura,
    validate(plantillasSchemas.crearPlantilla),
    asyncHandler(PlantillasController.crear)
);

/**
 * PUT /plantillas/:id
 * Actualizar plantilla
 */
router.put('/plantillas/:id',
    ...middlewareEscritura,
    validate(plantillasSchemas.actualizarPlantilla),
    asyncHandler(PlantillasController.actualizar)
);

/**
 * DELETE /plantillas/:id
 * Eliminar plantilla
 */
router.delete('/plantillas/:id',
    ...middlewareEscritura,
    validate(plantillasSchemas.eliminarPlantilla),
    asyncHandler(PlantillasController.eliminar)
);

module.exports = router;
