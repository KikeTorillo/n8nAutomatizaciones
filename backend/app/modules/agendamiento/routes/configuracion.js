/**
 * ====================================================================
 * RUTAS DE CONFIGURACIÓN AGENDAMIENTO
 * ====================================================================
 *
 * Endpoints para gestionar configuración del módulo de agendamiento
 *
 * @module routes/configuracion
 * @since Enero 2026
 */

const express = require('express');
const router = express.Router();

const ConfiguracionController = require('../controllers/configuracion.controller');
const { auth, tenant, rateLimiting } = require('../../../middleware');

/**
 * GET /api/v1/agendamiento/configuracion
 * Obtiene la configuración de agendamiento de la organización
 */
router.get('/',
    rateLimiting.userRateLimit,
    auth.authenticateToken,
    tenant.setTenantContext,
    ConfiguracionController.obtener
);

/**
 * PUT /api/v1/agendamiento/configuracion
 * Actualiza la configuración de agendamiento
 * Requiere rol admin
 */
router.put('/',
    rateLimiting.userRateLimit,
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    ConfiguracionController.actualizar
);

/**
 * POST /api/v1/agendamiento/configuracion/round-robin/toggle
 * Toggle rápido para activar/desactivar round-robin
 * Requiere rol admin
 */
router.post('/round-robin/toggle',
    rateLimiting.userRateLimit,
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    ConfiguracionController.toggleRoundRobin
);

module.exports = router;
