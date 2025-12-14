/**
 * ====================================================================
 * RUTAS AUTENTICADAS - GALERÍA COMPARTIDA
 * ====================================================================
 * Rutas para gestión de fotos del evento (requiere autenticación + módulo activo).
 *
 * Endpoints:
 * POST   /eventos/:eventoId/galeria  - Subir foto
 * GET    /eventos/:eventoId/galeria  - Listar fotos
 * GET    /galeria/:id                - Obtener foto
 * PUT    /galeria/:id/estado         - Cambiar estado (visible/oculta)
 * DELETE /galeria/:id                - Eliminar foto (soft delete)
 * DELETE /galeria/:id/permanente     - Eliminar foto permanentemente
 *
 * Fecha creación: 14 Diciembre 2025
 */

const express = require('express');
const router = express.Router();

// Controllers
const GaleriaController = require('../controllers/galeria.controller');

// Schemas
const galeriaSchemas = require('../schemas/galeria.schema');

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
// RUTAS DE GALERÍA POR EVENTO
// ============================================================================

/**
 * POST /eventos/:eventoId/galeria
 * Subir foto
 */
router.post('/eventos/:eventoId/galeria',
    ...middlewareComun,
    validate(galeriaSchemas.subirFoto),
    asyncHandler(GaleriaController.subir)
);

/**
 * GET /eventos/:eventoId/galeria
 * Listar fotos del evento
 */
router.get('/eventos/:eventoId/galeria',
    ...middlewareComun,
    validate(galeriaSchemas.listarFotos),
    asyncHandler(GaleriaController.listar)
);

// ============================================================================
// RUTAS DE FOTO INDIVIDUAL
// ============================================================================

/**
 * GET /galeria/:id
 * Obtener foto por ID
 */
router.get('/galeria/:id',
    ...middlewareComun,
    validate(galeriaSchemas.obtenerFoto),
    asyncHandler(GaleriaController.obtenerPorId)
);

/**
 * PUT /galeria/:id/estado
 * Cambiar estado de foto (visible/oculta)
 */
router.put('/galeria/:id/estado',
    ...middlewareComun,
    validate(galeriaSchemas.cambiarEstado),
    asyncHandler(GaleriaController.cambiarEstado)
);

/**
 * DELETE /galeria/:id
 * Eliminar foto (soft delete)
 */
router.delete('/galeria/:id',
    ...middlewareComun,
    validate(galeriaSchemas.eliminarFoto),
    asyncHandler(GaleriaController.eliminar)
);

/**
 * DELETE /galeria/:id/permanente
 * Eliminar foto permanentemente
 */
router.delete('/galeria/:id/permanente',
    ...middlewareComun,
    validate(galeriaSchemas.eliminarFoto),
    asyncHandler(GaleriaController.eliminarPermanente)
);

module.exports = router;
