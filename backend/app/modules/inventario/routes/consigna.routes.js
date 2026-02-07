/**
 * ====================================================================
 * ROUTES - CONSIGNA (Inventario en Consignacion)
 * ====================================================================
 */

const express = require('express');
const ConsignaController = require('../controllers/consigna.controller');
const { auth, tenant, rateLimiting, validation, subscription, modules } = require('../../../middleware');
const inventarioSchemas = require('../schemas/inventario.schemas');

const router = express.Router();
const validate = validation.validate;

// ===================================================================
// ACUERDOS DE CONSIGNA
// ===================================================================

/**
 * POST /api/v1/inventario/consigna/acuerdos
 * Crear nuevo acuerdo de consignacion
 */
router.post('/consigna/acuerdos',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.crearAcuerdoConsigna),
    ConsignaController.crearAcuerdo
);

/**
 * GET /api/v1/inventario/consigna/acuerdos
 * Listar acuerdos de consignacion
 */
router.get('/consigna/acuerdos',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    ConsignaController.listarAcuerdos
);

/**
 * GET /api/v1/inventario/consigna/acuerdos/:id
 * Obtener acuerdo por ID
 */
router.get('/consigna/acuerdos/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    ConsignaController.obtenerAcuerdo
);

/**
 * PUT /api/v1/inventario/consigna/acuerdos/:id
 * Actualizar acuerdo
 */
router.put('/consigna/acuerdos/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.actualizarAcuerdoConsigna),
    ConsignaController.actualizarAcuerdo
);

/**
 * POST /api/v1/inventario/consigna/acuerdos/:id/activar
 * Activar acuerdo
 */
router.post('/consigna/acuerdos/:id/activar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    ConsignaController.activarAcuerdo
);

/**
 * POST /api/v1/inventario/consigna/acuerdos/:id/pausar
 * Pausar acuerdo
 */
router.post('/consigna/acuerdos/:id/pausar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    ConsignaController.pausarAcuerdo
);

/**
 * POST /api/v1/inventario/consigna/acuerdos/:id/terminar
 * Terminar acuerdo
 */
router.post('/consigna/acuerdos/:id/terminar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    ConsignaController.terminarAcuerdo
);

// ===================================================================
// PRODUCTOS DEL ACUERDO
// ===================================================================

/**
 * POST /api/v1/inventario/consigna/acuerdos/:id/productos
 * Agregar producto al acuerdo
 */
router.post('/consigna/acuerdos/:id/productos',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.agregarProductoConsigna),
    ConsignaController.agregarProducto
);

/**
 * GET /api/v1/inventario/consigna/acuerdos/:id/productos
 * Listar productos del acuerdo
 */
router.get('/consigna/acuerdos/:id/productos',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    ConsignaController.listarProductos
);

/**
 * PUT /api/v1/inventario/consigna/acuerdos/:id/productos/:productoId
 * Actualizar producto del acuerdo
 */
router.put('/consigna/acuerdos/:id/productos/:productoId',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.actualizarProductoConsigna),
    ConsignaController.actualizarProducto
);

/**
 * DELETE /api/v1/inventario/consigna/acuerdos/:id/productos/:productoId
 * Remover producto del acuerdo
 */
router.delete('/consigna/acuerdos/:id/productos/:productoId',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    ConsignaController.removerProducto
);

// ===================================================================
// STOCK CONSIGNA
// ===================================================================

/**
 * POST /api/v1/inventario/consigna/acuerdos/:id/recibir
 * Recibir mercancia en consignacion
 */
router.post('/consigna/acuerdos/:id/recibir',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.recibirMercanciaConsigna),
    ConsignaController.recibirMercancia
);

/**
 * GET /api/v1/inventario/consigna/stock
 * Consultar stock en consignacion
 */
router.get('/consigna/stock',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    ConsignaController.consultarStock
);

/**
 * POST /api/v1/inventario/consigna/stock/:id/ajuste
 * Ajustar stock consigna
 */
router.post('/consigna/stock/:id/ajuste',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.ajustarStockConsigna),
    ConsignaController.ajustarStock
);

/**
 * POST /api/v1/inventario/consigna/acuerdos/:id/devolver
 * Devolver mercancia al proveedor
 */
router.post('/consigna/acuerdos/:id/devolver',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.devolverMercanciaConsigna),
    ConsignaController.devolverMercancia
);

// ===================================================================
// LIQUIDACIONES
// ===================================================================

/**
 * POST /api/v1/inventario/consigna/liquidaciones
 * Generar liquidacion
 */
router.post('/consigna/liquidaciones',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.generarLiquidacion),
    ConsignaController.generarLiquidacion
);

/**
 * GET /api/v1/inventario/consigna/liquidaciones
 * Listar liquidaciones
 */
router.get('/consigna/liquidaciones',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    ConsignaController.listarLiquidaciones
);

/**
 * GET /api/v1/inventario/consigna/liquidaciones/:id
 * Obtener liquidacion con detalle
 */
router.get('/consigna/liquidaciones/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    ConsignaController.obtenerLiquidacion
);

/**
 * POST /api/v1/inventario/consigna/liquidaciones/:id/confirmar
 * Confirmar liquidacion
 */
router.post('/consigna/liquidaciones/:id/confirmar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    ConsignaController.confirmarLiquidacion
);

/**
 * POST /api/v1/inventario/consigna/liquidaciones/:id/pagar
 * Registrar pago de liquidacion
 */
router.post('/consigna/liquidaciones/:id/pagar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.pagarLiquidacion),
    ConsignaController.pagarLiquidacion
);

/**
 * DELETE /api/v1/inventario/consigna/liquidaciones/:id
 * Cancelar liquidacion
 */
router.delete('/consigna/liquidaciones/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    ConsignaController.cancelarLiquidacion
);

// ===================================================================
// REPORTES CONSIGNA
// ===================================================================

/**
 * GET /api/v1/inventario/consigna/reportes/stock
 * Reporte de stock consigna
 */
router.get('/consigna/reportes/stock',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    ConsignaController.reporteStock
);

/**
 * GET /api/v1/inventario/consigna/reportes/ventas
 * Reporte de ventas consigna
 */
router.get('/consigna/reportes/ventas',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    ConsignaController.reporteVentas
);

/**
 * GET /api/v1/inventario/consigna/reportes/pendiente
 * Reporte pendiente de liquidar
 */
router.get('/consigna/reportes/pendiente',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    ConsignaController.reportePendiente
);

module.exports = router;
