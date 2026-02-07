/**
 * ====================================================================
 * ROUTES - PAQUETES DE ENVIO
 * ====================================================================
 */

const express = require('express');
const PaquetesController = require('../controllers/paquetes.controller');
const { auth, tenant, rateLimiting, validation, modules } = require('../../../middleware');
const inventarioSchemas = require('../schemas/inventario.schemas');

const router = express.Router();
const validate = validation.validate;

/**
 * POST /api/v1/inventario/operaciones/:operacionId/paquetes
 * Crear paquete para operacion de empaque
 */
router.post('/operaciones/:operacionId/paquetes',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.crearPaquete),
    PaquetesController.crear
);

/**
 * GET /api/v1/inventario/operaciones/:operacionId/paquetes
 * Listar paquetes de una operacion
 */
router.get('/operaciones/:operacionId/paquetes',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    PaquetesController.listar
);

/**
 * GET /api/v1/inventario/operaciones/:operacionId/items-disponibles
 * Items disponibles para empacar
 */
router.get('/operaciones/:operacionId/items-disponibles',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    PaquetesController.itemsDisponibles
);

/**
 * GET /api/v1/inventario/operaciones/:operacionId/resumen-empaque
 * Resumen de empaque de la operacion
 */
router.get('/operaciones/:operacionId/resumen-empaque',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    PaquetesController.resumenEmpaque
);

/**
 * GET /api/v1/inventario/paquetes/:id
 * Obtener paquete por ID
 */
router.get('/paquetes/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    PaquetesController.obtener
);

/**
 * PUT /api/v1/inventario/paquetes/:id
 * Actualizar dimensiones/peso del paquete
 */
router.put('/paquetes/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.actualizarPaquete),
    PaquetesController.actualizar
);

/**
 * POST /api/v1/inventario/paquetes/:id/items
 * Agregar item al paquete
 */
router.post('/paquetes/:id/items',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.agregarItemPaquete),
    PaquetesController.agregarItem
);

/**
 * DELETE /api/v1/inventario/paquetes/:id/items/:itemId
 * Remover item del paquete
 */
router.delete('/paquetes/:id/items/:itemId',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    PaquetesController.removerItem
);

/**
 * POST /api/v1/inventario/paquetes/:id/cerrar
 * Cerrar paquete
 */
router.post('/paquetes/:id/cerrar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    PaquetesController.cerrar
);

/**
 * POST /api/v1/inventario/paquetes/:id/cancelar
 * Cancelar paquete
 */
router.post('/paquetes/:id/cancelar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.cancelarPaquete),
    PaquetesController.cancelar
);

/**
 * POST /api/v1/inventario/paquetes/:id/etiquetar
 * Marcar paquete como etiquetado
 */
router.post('/paquetes/:id/etiquetar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.etiquetarPaquete),
    PaquetesController.etiquetar
);

/**
 * POST /api/v1/inventario/paquetes/:id/enviar
 * Marcar paquete como enviado
 */
router.post('/paquetes/:id/enviar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    PaquetesController.enviar
);

/**
 * GET /api/v1/inventario/paquetes/:id/etiqueta
 * Generar datos de etiqueta del paquete
 */
router.get('/paquetes/:id/etiqueta',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    PaquetesController.generarEtiqueta
);

module.exports = router;
