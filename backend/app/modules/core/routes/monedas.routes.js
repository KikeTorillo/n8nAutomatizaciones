/**
 * ====================================================================
 * ROUTES - MONEDAS
 * ====================================================================
 *
 * Rutas para gestión de monedas y tasas de cambio.
 * Módulo: Multi-Moneda (Fase 4)
 */

const express = require('express');
const MonedasController = require('../controllers/monedas.controller');
const { auth, tenant, rateLimiting } = require('../../../middleware');

const router = express.Router();

// ===================================================================
// RUTAS PÚBLICAS (sin autenticación)
// ===================================================================

/**
 * GET /api/v1/monedas
 * Listar monedas disponibles (público)
 */
router.get('/',
    rateLimiting.apiRateLimit,
    MonedasController.listar
);

/**
 * GET /api/v1/monedas/:codigo
 * Obtener moneda por código (público)
 */
router.get('/:codigo',
    rateLimiting.apiRateLimit,
    MonedasController.obtenerPorCodigo
);

// ===================================================================
// RUTAS AUTENTICADAS
// ===================================================================

/**
 * GET /api/v1/monedas/tasas
 * Obtener tasa de cambio actual
 */
router.get('/tasas/actual',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    MonedasController.obtenerTasa
);

/**
 * GET /api/v1/monedas/tasas/historial
 * Obtener historial de tasas
 */
router.get('/tasas/historial',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    MonedasController.obtenerHistorialTasas
);

/**
 * POST /api/v1/monedas/tasas
 * Guardar nueva tasa de cambio (admin)
 */
router.post('/tasas',
    auth.authenticateToken,
    tenant.setTenantContext,
    auth.requireRole(['admin', 'propietario', 'super_admin']),
    rateLimiting.apiRateLimit,
    MonedasController.guardarTasa
);

/**
 * POST /api/v1/monedas/convertir
 * Convertir monto entre monedas
 */
router.post('/convertir',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    MonedasController.convertir
);

/**
 * POST /api/v1/monedas/convertir/multiple
 * Convertir múltiples montos
 */
router.post('/convertir/multiple',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    MonedasController.convertirMultiple
);

module.exports = router;
