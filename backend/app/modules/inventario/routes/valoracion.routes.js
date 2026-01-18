/**
 * ====================================================================
 * ROUTES - VALORACION DE INVENTARIO (FIFO/AVCO)
 * ====================================================================
 * Metodos contables de valoracion de inventario
 */

const express = require('express');
const ValoracionController = require('../controllers/valoracion.controller');
const { auth, tenant, rateLimiting, modules } = require('../../../middleware');

const router = express.Router();

/**
 * GET /api/v1/inventario/valoracion/configuracion
 * Obtener configuracion de valoracion de la organizacion
 */
router.get('/valoracion/configuracion',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    ValoracionController.obtenerConfiguracion
);

/**
 * PUT /api/v1/inventario/valoracion/configuracion
 * Actualizar metodo de valoracion preferido
 */
router.put('/valoracion/configuracion',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    ValoracionController.actualizarConfiguracion
);

/**
 * GET /api/v1/inventario/valoracion/resumen
 * Resumen comparativo de todos los metodos para dashboard
 */
router.get('/valoracion/resumen',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    ValoracionController.resumen
);

/**
 * GET /api/v1/inventario/valoracion/total
 * Valor total del inventario segun metodo seleccionado
 * Query params: metodo (fifo|avco|promedio), categoria_id, sucursal_id
 */
router.get('/valoracion/total',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    ValoracionController.valorTotal
);

/**
 * GET /api/v1/inventario/valoracion/comparativa
 * Comparar valoracion de todos los productos por los 3 metodos
 * Query params: producto_id (opcional, para un producto especifico)
 */
router.get('/valoracion/comparativa',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    ValoracionController.comparativa
);

/**
 * GET /api/v1/inventario/valoracion/reporte/categorias
 * Reporte de valoracion agrupado por categorias
 */
router.get('/valoracion/reporte/categorias',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    ValoracionController.reportePorCategorias
);

/**
 * GET /api/v1/inventario/valoracion/reporte/diferencias
 * Productos con mayor diferencia entre metodos
 * Query params: limite (default 10)
 */
router.get('/valoracion/reporte/diferencias',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    ValoracionController.reporteDiferencias
);

/**
 * GET /api/v1/inventario/valoracion/producto/:id
 * Valoracion detallada de un producto con todos los metodos
 */
router.get('/valoracion/producto/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    ValoracionController.valorProducto
);

/**
 * GET /api/v1/inventario/valoracion/producto/:id/fifo
 * Valoracion FIFO de un producto
 */
router.get('/valoracion/producto/:id/fifo',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    ValoracionController.valorFIFO
);

/**
 * GET /api/v1/inventario/valoracion/producto/:id/avco
 * Valoracion AVCO de un producto
 */
router.get('/valoracion/producto/:id/avco',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    ValoracionController.valorAVCO
);

/**
 * GET /api/v1/inventario/valoracion/producto/:id/capas
 * Capas de inventario FIFO detalladas con trazabilidad
 */
router.get('/valoracion/producto/:id/capas',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    ValoracionController.capasProducto
);

module.exports = router;
