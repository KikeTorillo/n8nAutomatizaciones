/**
 * ====================================================================
 * ROUTES - CONFIGURACION DE ALMACEN
 * ====================================================================
 * Configurar rutas multi-paso por sucursal (Pasos de Recepcion/Envio)
 */

const express = require('express');
const ConfiguracionAlmacenController = require('../controllers/configuracion-almacen.controller');
const { auth, tenant, rateLimiting, modules } = require('../../../middleware');

const router = express.Router();

/**
 * GET /api/v1/inventario/configuracion-almacen
 * Listar configuraciones de todas las sucursales
 */
router.get('/configuracion-almacen',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    ConfiguracionAlmacenController.listar
);

/**
 * GET /api/v1/inventario/configuracion-almacen/descripciones-pasos
 * Obtener descripciones de todos los pasos disponibles
 */
router.get('/configuracion-almacen/descripciones-pasos',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    ConfiguracionAlmacenController.obtenerDescripcionesPasos
);

/**
 * GET /api/v1/inventario/configuracion-almacen/:sucursalId
 * Obtener configuracion por sucursal
 */
router.get('/configuracion-almacen/:sucursalId',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    ConfiguracionAlmacenController.obtenerPorSucursal
);

/**
 * GET /api/v1/inventario/configuracion-almacen/:sucursalId/usa-multietapa
 * Verificar si la sucursal usa rutas multietapa
 */
router.get('/configuracion-almacen/:sucursalId/usa-multietapa',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    rateLimiting.userRateLimit,
    ConfiguracionAlmacenController.verificarMultietapa
);

/**
 * PUT /api/v1/inventario/configuracion-almacen/:sucursalId
 * Actualizar configuracion
 */
router.put('/configuracion-almacen/:sucursalId',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    ConfiguracionAlmacenController.actualizar
);

/**
 * POST /api/v1/inventario/configuracion-almacen/:sucursalId/crear-ubicaciones
 * Crear ubicaciones por defecto para rutas multietapa
 */
router.post('/configuracion-almacen/:sucursalId/crear-ubicaciones',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    ConfiguracionAlmacenController.crearUbicacionesDefault
);

module.exports = router;
