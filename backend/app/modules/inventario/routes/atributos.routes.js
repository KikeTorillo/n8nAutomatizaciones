/**
 * ====================================================================
 * ROUTES - ATRIBUTOS DE PRODUCTO
 * ====================================================================
 * Tipos de atributos para variantes: Color, Talla, Material, etc.
 */

const express = require('express');
const AtributosController = require('../controllers/atributos.controller');
const { auth, tenant, rateLimiting, validation, modules } = require('../../../middleware');
const variantesSchemas = require('../schemas/variantes.schemas');

const router = express.Router();
const validate = validation.validate;

/**
 * POST /api/v1/inventario/atributos/defecto
 * Crear atributos por defecto (Color, Talla)
 */
router.post('/atributos/defecto',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    AtributosController.crearDefecto
);

/**
 * POST /api/v1/inventario/atributos
 * Crear nuevo atributo
 */
router.post('/atributos',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(variantesSchemas.crearAtributo),
    AtributosController.crear
);

/**
 * GET /api/v1/inventario/atributos
 * Listar atributos
 */
router.get('/atributos',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    AtributosController.listar
);

/**
 * GET /api/v1/inventario/atributos/:id
 * Obtener atributo con valores
 */
router.get('/atributos/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    AtributosController.obtenerPorId
);

/**
 * PUT /api/v1/inventario/atributos/:id
 * Actualizar atributo
 */
router.put('/atributos/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(variantesSchemas.actualizarAtributo),
    AtributosController.actualizar
);

/**
 * DELETE /api/v1/inventario/atributos/:id
 * Eliminar atributo
 */
router.delete('/atributos/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    AtributosController.eliminar
);

/**
 * POST /api/v1/inventario/atributos/:id/valores
 * Agregar valor a atributo
 */
router.post('/atributos/:id/valores',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(variantesSchemas.crearValor),
    AtributosController.agregarValor
);

/**
 * GET /api/v1/inventario/atributos/:id/valores
 * Obtener valores de un atributo
 */
router.get('/atributos/:id/valores',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    AtributosController.obtenerValores
);

/**
 * PUT /api/v1/inventario/valores/:valorId
 * Actualizar valor de atributo
 */
router.put('/valores/:valorId',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(variantesSchemas.actualizarValor),
    AtributosController.actualizarValor
);

/**
 * DELETE /api/v1/inventario/valores/:valorId
 * Eliminar valor de atributo
 */
router.delete('/valores/:valorId',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    AtributosController.eliminarValor
);

module.exports = router;
