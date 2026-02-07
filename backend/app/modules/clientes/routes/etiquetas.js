/**
 * ====================================================================
 * RUTAS DE ETIQUETAS CLIENTES
 * ====================================================================
 *
 * Fase 2 - Segmentación de Clientes (Ene 2026)
 * Rutas para CRUD de etiquetas y asignación a clientes
 *
 * ====================================================================
 */

const express = require('express');
const EtiquetaClienteController = require('../controllers/etiqueta.controller');
const { auth, tenant, validation, rateLimiting } = require('../../../middleware');
const etiquetaSchemas = require('../schemas/etiqueta.schemas');

const router = express.Router();

// ===================================================================
// CRUD DE ETIQUETAS
// ===================================================================

/**
 * GET /api/v1/clientes/etiquetas
 * Listar etiquetas de la organización
 */
router.get('/',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    validation.validate(etiquetaSchemas.listar),
    EtiquetaClienteController.listar
);

/**
 * POST /api/v1/clientes/etiquetas
 * Crear nueva etiqueta
 */
router.post('/',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    auth.requireRole(['super_admin', 'admin', 'organizacion_admin', 'manager']),
    validation.validate(etiquetaSchemas.crear),
    EtiquetaClienteController.crear
);

/**
 * GET /api/v1/clientes/etiquetas/:id
 * Obtener etiqueta por ID
 */
router.get('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    validation.validate(etiquetaSchemas.obtenerPorId),
    EtiquetaClienteController.obtenerPorId
);

/**
 * PUT /api/v1/clientes/etiquetas/:id
 * Actualizar etiqueta
 */
router.put('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    auth.requireRole(['super_admin', 'admin', 'organizacion_admin', 'manager']),
    validation.validate(etiquetaSchemas.actualizar),
    EtiquetaClienteController.actualizar
);

/**
 * DELETE /api/v1/clientes/etiquetas/:id
 * Eliminar etiqueta
 */
router.delete('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    auth.requireRole(['super_admin', 'admin', 'organizacion_admin']),
    validation.validate(etiquetaSchemas.eliminar),
    EtiquetaClienteController.eliminar
);

module.exports = router;
