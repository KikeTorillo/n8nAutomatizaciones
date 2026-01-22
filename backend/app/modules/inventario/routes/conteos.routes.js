/**
 * ====================================================================
 * ROUTES - CONTEOS DE INVENTARIO (CONTEO FISICO)
 * ====================================================================
 * Verificacion fisica del stock con ajustes automaticos
 */

const express = require('express');
const ConteosController = require('../controllers/conteos.controller');
const { auth, tenant, rateLimiting, validation, subscription, modules } = require('../../../middleware');
const inventarioSchemas = require('../schemas/inventario.schemas');

const router = express.Router();
const validate = validation.validate;

/**
 * GET /api/v1/inventario/conteos/estadisticas
 * Estadisticas de conteos por periodo
 */
router.get('/conteos/estadisticas',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.estadisticasConteos),
    ConteosController.obtenerEstadisticas
);

/**
 * POST /api/v1/inventario/conteos
 * Crear nuevo conteo de inventario
 */
router.post('/conteos',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.crearConteo),
    ConteosController.crear
);

/**
 * GET /api/v1/inventario/conteos/:id/buscar-item
 * Buscar item por codigo de barras o SKU
 */
router.get('/conteos/:id/buscar-item',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.buscarItemConteo),
    ConteosController.buscarItem
);

/**
 * GET /api/v1/inventario/conteos/:id
 * Obtener conteo por ID con items
 */
router.get('/conteos/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.obtenerConteoPorId),
    ConteosController.obtenerPorId
);

/**
 * GET /api/v1/inventario/conteos
 * Listar conteos con filtros
 */
router.get('/conteos',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.listarConteos),
    ConteosController.listar
);

/**
 * POST /api/v1/inventario/conteos/:id/iniciar
 * Iniciar conteo (genera items y cambia a en_proceso)
 */
router.post('/conteos/:id/iniciar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.iniciarConteo),
    ConteosController.iniciar
);

/**
 * PUT /api/v1/inventario/conteos/items/:itemId
 * Registrar cantidad contada para un item
 */
router.put('/conteos/items/:itemId',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.registrarConteoItem),
    ConteosController.registrarConteo
);

/**
 * POST /api/v1/inventario/conteos/:id/completar
 * Completar conteo (validar que todos esten contados)
 */
router.post('/conteos/:id/completar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.completarConteo),
    ConteosController.completar
);

/**
 * POST /api/v1/inventario/conteos/:id/aplicar-ajustes
 * Aplicar ajustes de inventario basados en el conteo
 */
router.post('/conteos/:id/aplicar-ajustes',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.aplicarAjustesConteo),
    ConteosController.aplicarAjustes
);

/**
 * POST /api/v1/inventario/conteos/:id/cancelar
 * Cancelar conteo
 */
router.post('/conteos/:id/cancelar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(inventarioSchemas.cancelarConteo),
    ConteosController.cancelar
);

module.exports = router;
