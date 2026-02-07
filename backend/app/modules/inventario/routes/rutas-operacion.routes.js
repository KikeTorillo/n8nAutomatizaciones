/**
 * ====================================================================
 * ROUTES - RUTAS DE OPERACION
 * ====================================================================
 * Incluye: rutas, productos-rutas, reglas de reabastecimiento, transferencias
 */

const express = require('express');
const RutasOperacionController = require('../controllers/rutas-operacion.controller');
const { auth, tenant, rateLimiting, modules } = require('../../../middleware');

const router = express.Router();

// ===================================================================
// RUTAS DE OPERACION
// ===================================================================

/**
 * POST /api/v1/inventario/rutas-operacion/init
 * Crear rutas por defecto para la organizacion
 */
router.post('/rutas-operacion/init',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    RutasOperacionController.crearRutasDefault
);

/**
 * GET /api/v1/inventario/rutas-operacion
 * Listar rutas de operacion
 */
router.get('/rutas-operacion',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    RutasOperacionController.listarRutas
);

/**
 * POST /api/v1/inventario/rutas-operacion
 * Crear ruta de operacion
 */
router.post('/rutas-operacion',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    RutasOperacionController.crearRuta
);

/**
 * GET /api/v1/inventario/rutas-operacion/:id
 * Obtener ruta por ID
 */
router.get('/rutas-operacion/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    RutasOperacionController.obtenerRuta
);

/**
 * PUT /api/v1/inventario/rutas-operacion/:id
 * Actualizar ruta
 */
router.put('/rutas-operacion/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    RutasOperacionController.actualizarRuta
);

/**
 * DELETE /api/v1/inventario/rutas-operacion/:id
 * Eliminar ruta
 */
router.delete('/rutas-operacion/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    RutasOperacionController.eliminarRuta
);

// ===================================================================
// PRODUCTOS-RUTAS
// ===================================================================

/**
 * GET /api/v1/inventario/productos/:productoId/rutas
 * Obtener rutas asignadas a un producto
 */
router.get('/productos/:productoId/rutas',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    RutasOperacionController.obtenerRutasDeProducto
);

/**
 * POST /api/v1/inventario/productos/:productoId/rutas
 * Asignar ruta a producto
 */
router.post('/productos/:productoId/rutas',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    RutasOperacionController.asignarRutaAProducto
);

/**
 * DELETE /api/v1/inventario/productos/:productoId/rutas/:rutaId
 * Quitar ruta de producto
 */
router.delete('/productos/:productoId/rutas/:rutaId',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    RutasOperacionController.quitarRutaDeProducto
);

/**
 * GET /api/v1/inventario/productos/:productoId/determinar-ruta
 * Determinar mejor ruta de reabastecimiento
 */
router.get('/productos/:productoId/determinar-ruta',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    RutasOperacionController.determinarRutaReabastecimiento
);

// ===================================================================
// REGLAS DE REABASTECIMIENTO
// ===================================================================

/**
 * GET /api/v1/inventario/reglas-reabastecimiento
 * Listar reglas de reabastecimiento
 */
router.get('/reglas-reabastecimiento',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    RutasOperacionController.listarReglas
);

/**
 * POST /api/v1/inventario/reglas-reabastecimiento
 * Crear regla de reabastecimiento
 */
router.post('/reglas-reabastecimiento',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    RutasOperacionController.crearRegla
);

/**
 * GET /api/v1/inventario/reglas-reabastecimiento/:id
 * Obtener regla por ID
 */
router.get('/reglas-reabastecimiento/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    RutasOperacionController.obtenerRegla
);

/**
 * PUT /api/v1/inventario/reglas-reabastecimiento/:id
 * Actualizar regla
 */
router.put('/reglas-reabastecimiento/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    RutasOperacionController.actualizarRegla
);

/**
 * DELETE /api/v1/inventario/reglas-reabastecimiento/:id
 * Eliminar regla
 */
router.delete('/reglas-reabastecimiento/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    RutasOperacionController.eliminarRegla
);

// ===================================================================
// TRANSFERENCIAS
// ===================================================================

/**
 * GET /api/v1/inventario/transferencias
 * Listar solicitudes de transferencia
 */
router.get('/transferencias',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    RutasOperacionController.listarSolicitudesTransferencia
);

/**
 * POST /api/v1/inventario/transferencias
 * Crear solicitud de transferencia
 */
router.post('/transferencias',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    RutasOperacionController.crearSolicitudTransferencia
);

/**
 * GET /api/v1/inventario/transferencias/:id
 * Obtener solicitud con items
 */
router.get('/transferencias/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    RutasOperacionController.obtenerSolicitudTransferencia
);

/**
 * POST /api/v1/inventario/transferencias/:id/aprobar
 * Aprobar solicitud de transferencia
 */
router.post('/transferencias/:id/aprobar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    RutasOperacionController.aprobarSolicitud
);

/**
 * POST /api/v1/inventario/transferencias/:id/rechazar
 * Rechazar solicitud de transferencia
 */
router.post('/transferencias/:id/rechazar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    RutasOperacionController.rechazarSolicitud
);

/**
 * POST /api/v1/inventario/transferencias/:id/enviar
 * Marcar transferencia como enviada
 */
router.post('/transferencias/:id/enviar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    RutasOperacionController.enviarTransferencia
);

/**
 * POST /api/v1/inventario/transferencias/:id/recibir
 * Marcar transferencia como recibida
 */
router.post('/transferencias/:id/recibir',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    RutasOperacionController.recibirTransferencia
);

module.exports = router;
