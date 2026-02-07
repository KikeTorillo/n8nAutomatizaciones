/**
 * ====================================================================
 * ROUTES - NUMEROS DE SERIE / LOTES
 * ====================================================================
 * Tracking individual de productos con trazabilidad completa
 */

const express = require('express');
const NumerosSerieController = require('../controllers/numeros-serie.controller');
const { auth, tenant, rateLimiting, modules } = require('../../../middleware');

const router = express.Router();

/**
 * GET /api/v1/inventario/numeros-serie/estadisticas
 * Estadisticas generales de numeros de serie
 */
router.get('/numeros-serie/estadisticas',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    NumerosSerieController.obtenerEstadisticas
);

/**
 * GET /api/v1/inventario/numeros-serie/buscar
 * Busqueda rapida de numeros de serie
 * Query params: q (termino de busqueda)
 */
router.get('/numeros-serie/buscar',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    NumerosSerieController.buscar
);

/**
 * GET /api/v1/inventario/numeros-serie/proximos-vencer
 * Numeros de serie proximos a vencer
 * Query params: dias (default 30)
 */
router.get('/numeros-serie/proximos-vencer',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    NumerosSerieController.obtenerProximosVencer
);

/**
 * GET /api/v1/inventario/numeros-serie/alertas-vencimiento
 * Alertas de vencimiento con niveles de urgencia (vencido, critico, urgente, proximo)
 * Query params: sucursal_id (opcional)
 */
router.get('/numeros-serie/alertas-vencimiento',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    NumerosSerieController.obtenerAlertasVencimiento
);

/**
 * GET /api/v1/inventario/numeros-serie/fefo/:productoId
 * Obtener NS para despacho usando estrategia FEFO (First Expired First Out)
 * Query params: cantidad (default 1), sucursal_id (opcional)
 */
router.get('/numeros-serie/fefo/:productoId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    NumerosSerieController.obtenerParaDespachoFEFO
);

/**
 * POST /api/v1/inventario/numeros-serie/fefo/reservar
 * Reservar NS para despacho FEFO (usado en proceso de venta)
 * Body: { ns_ids: [1, 2, 3], referencia: "VENTA-123" }
 */
router.post('/numeros-serie/fefo/reservar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    NumerosSerieController.reservarParaDespachoFEFO
);

/**
 * GET /api/v1/inventario/numeros-serie/buscar-trazabilidad
 * Buscar NS por numero o lote con trazabilidad resumida
 * Query params: q (termino de busqueda, min 2 chars)
 */
router.get('/numeros-serie/buscar-trazabilidad',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    NumerosSerieController.buscarConTrazabilidad
);

/**
 * GET /api/v1/inventario/numeros-serie/productos-con-serie
 * Productos que requieren numero de serie
 */
router.get('/numeros-serie/productos-con-serie',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    NumerosSerieController.obtenerProductosConSerie
);

/**
 * GET /api/v1/inventario/numeros-serie/existe
 * Verificar si existe un numero de serie
 * Query params: producto_id, numero_serie
 */
router.get('/numeros-serie/existe',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    NumerosSerieController.verificarExistencia
);

/**
 * POST /api/v1/inventario/numeros-serie/bulk
 * Crear multiples numeros de serie (recepcion masiva)
 */
router.post('/numeros-serie/bulk',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    NumerosSerieController.crearMultiple
);

/**
 * POST /api/v1/inventario/numeros-serie
 * Crear numero de serie individual
 */
router.post('/numeros-serie',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    NumerosSerieController.crear
);

/**
 * GET /api/v1/inventario/numeros-serie/producto/:productoId/disponibles
 * Numeros de serie disponibles para un producto
 * Query params: sucursal_id (opcional)
 */
router.get('/numeros-serie/producto/:productoId/disponibles',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    NumerosSerieController.obtenerDisponibles
);

/**
 * GET /api/v1/inventario/numeros-serie/producto/:productoId/resumen
 * Resumen de numeros de serie por producto
 */
router.get('/numeros-serie/producto/:productoId/resumen',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    NumerosSerieController.obtenerResumenProducto
);

/**
 * GET /api/v1/inventario/numeros-serie/:id/historial
 * Historial de movimientos de un numero de serie
 */
router.get('/numeros-serie/:id/historial',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    NumerosSerieController.obtenerHistorial
);

/**
 * GET /api/v1/inventario/numeros-serie/:id/trazabilidad
 * Trazabilidad completa: origen (upstream) -> estado actual -> destino (downstream)
 */
router.get('/numeros-serie/:id/trazabilidad',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    NumerosSerieController.obtenerTrazabilidad
);

/**
 * GET /api/v1/inventario/numeros-serie/:id/timeline
 * Timeline cronologico de todos los movimientos del NS
 */
router.get('/numeros-serie/:id/timeline',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    NumerosSerieController.obtenerTimeline
);

/**
 * POST /api/v1/inventario/numeros-serie/:id/vender
 * Marcar numero de serie como vendido
 */
router.post('/numeros-serie/:id/vender',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    NumerosSerieController.vender
);

/**
 * POST /api/v1/inventario/numeros-serie/:id/transferir
 * Transferir numero de serie entre sucursales/ubicaciones
 */
router.post('/numeros-serie/:id/transferir',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    NumerosSerieController.transferir
);

/**
 * POST /api/v1/inventario/numeros-serie/:id/devolver
 * Procesar devolucion de cliente
 */
router.post('/numeros-serie/:id/devolver',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    NumerosSerieController.devolver
);

/**
 * POST /api/v1/inventario/numeros-serie/:id/defectuoso
 * Marcar como defectuoso
 */
router.post('/numeros-serie/:id/defectuoso',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    NumerosSerieController.marcarDefectuoso
);

/**
 * POST /api/v1/inventario/numeros-serie/:id/reservar
 * Reservar numero de serie
 */
router.post('/numeros-serie/:id/reservar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    NumerosSerieController.reservar
);

/**
 * POST /api/v1/inventario/numeros-serie/:id/liberar
 * Liberar reserva de numero de serie
 */
router.post('/numeros-serie/:id/liberar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    NumerosSerieController.liberarReserva
);

/**
 * PUT /api/v1/inventario/numeros-serie/:id/garantia
 * Actualizar informacion de garantia
 */
router.put('/numeros-serie/:id/garantia',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    NumerosSerieController.actualizarGarantia
);

/**
 * GET /api/v1/inventario/numeros-serie/:id
 * Obtener numero de serie por ID
 */
router.get('/numeros-serie/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    NumerosSerieController.obtenerPorId
);

/**
 * GET /api/v1/inventario/numeros-serie
 * Listar numeros de serie con filtros
 */
router.get('/numeros-serie',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    NumerosSerieController.listar
);

module.exports = router;
