/**
 * ====================================================================
 * ROUTES - AJUSTES MASIVOS DE INVENTARIO
 * ====================================================================
 * Importacion masiva de ajustes via CSV
 */

const express = require('express');
const AjustesMasivosController = require('../controllers/ajustes-masivos.controller');
const { auth, tenant, rateLimiting, validation, subscription, modules } = require('../../../middleware');
const inventarioSchemas = require('../schemas/inventario.schemas');

const router = express.Router();
const validate = validation.validate;

/**
 * GET /api/v1/inventario/ajustes-masivos/plantilla
 * Descargar plantilla CSV
 */
router.get('/ajustes-masivos/plantilla',
    auth.authenticateToken,
    AjustesMasivosController.descargarPlantilla
);

/**
 * POST /api/v1/inventario/ajustes-masivos
 * Crear ajuste masivo desde items parseados
 */
router.post('/ajustes-masivos',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.crearAjusteMasivo),
    AjustesMasivosController.crear
);

/**
 * GET /api/v1/inventario/ajustes-masivos
 * Listar ajustes masivos con filtros
 */
router.get('/ajustes-masivos',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.listarAjustesMasivos),
    AjustesMasivosController.listar
);

/**
 * GET /api/v1/inventario/ajustes-masivos/:id
 * Obtener ajuste masivo por ID
 */
router.get('/ajustes-masivos/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.obtenerAjusteMasivo),
    AjustesMasivosController.obtenerPorId
);

/**
 * POST /api/v1/inventario/ajustes-masivos/:id/validar
 * Validar items del ajuste masivo
 */
router.post('/ajustes-masivos/:id/validar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.validarAjusteMasivo),
    AjustesMasivosController.validar
);

/**
 * POST /api/v1/inventario/ajustes-masivos/:id/aplicar
 * Aplicar ajustes de inventario
 */
router.post('/ajustes-masivos/:id/aplicar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.heavyOperationRateLimit,
    validate(inventarioSchemas.aplicarAjusteMasivo),
    AjustesMasivosController.aplicar
);

/**
 * DELETE /api/v1/inventario/ajustes-masivos/:id
 * Cancelar/eliminar ajuste masivo
 */
router.delete('/ajustes-masivos/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.cancelarAjusteMasivo),
    AjustesMasivosController.cancelar
);

module.exports = router;
