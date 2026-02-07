/**
 * ====================================================================
 * ROUTES: CONECTORES DE PAGO
 * ====================================================================
 * Rutas para gestionar conectores de pago multi-tenant.
 *
 * Base path: /api/v1/suscripciones-negocio/conectores
 *
 * @module suscripciones-negocio/routes/conectores
 * @version 1.0.0
 * @date Enero 2026
 */

const express = require('express');
const ConectoresController = require('../controllers/conectores.controller');
const conectoresSchemas = require('../schemas/conectores.schemas');
const { auth, tenant, validation, rateLimiting } = require('../../../middleware');

const router = express.Router();

/**
 * GET /gateways
 * Obtener lista de gateways soportados
 * Público para mostrar opciones antes de configurar
 */
router.get('/gateways',
    auth.authenticateToken,
    tenant.setTenantContext,
    ConectoresController.listarGateways
);

/**
 * GET /
 * Listar conectores de la organización
 * Solo admin/propietario
 */
router.get('/',
    auth.authenticateToken,
    tenant.setTenantContext,
    auth.requireRole(['super_admin', 'admin']),
    validation.validate(conectoresSchemas.listar),
    ConectoresController.listar
);

/**
 * GET /:id
 * Obtener conector por ID
 * Solo admin/propietario
 */
router.get('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    auth.requireRole(['super_admin', 'admin']),
    validation.validate(conectoresSchemas.porId),
    ConectoresController.obtenerPorId
);

/**
 * POST /
 * Crear nuevo conector
 * Solo admin/propietario
 */
router.post('/',
    auth.authenticateToken,
    tenant.setTenantContext,
    auth.requireRole(['super_admin', 'admin']),
    rateLimiting.userRateLimit,
    validation.validate(conectoresSchemas.crear),
    ConectoresController.crear
);

/**
 * PUT /:id
 * Actualizar conector
 * Solo admin/propietario
 */
router.put('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    auth.requireRole(['super_admin', 'admin']),
    rateLimiting.userRateLimit,
    validation.validate(conectoresSchemas.actualizar),
    ConectoresController.actualizar
);

/**
 * DELETE /:id
 * Eliminar conector
 * Solo admin/propietario
 */
router.delete('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    auth.requireRole(['super_admin', 'admin']),
    rateLimiting.userRateLimit,
    validation.validate(conectoresSchemas.porId),
    ConectoresController.eliminar
);

/**
 * POST /:id/verificar
 * Verificar conectividad del conector
 * Solo admin/propietario
 */
router.post('/:id/verificar',
    auth.authenticateToken,
    tenant.setTenantContext,
    auth.requireRole(['super_admin', 'admin']),
    rateLimiting.userRateLimit,
    validation.validate(conectoresSchemas.verificar),
    ConectoresController.verificarConectividad
);

module.exports = router;
