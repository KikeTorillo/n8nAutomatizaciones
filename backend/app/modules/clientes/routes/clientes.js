/**
 * ====================================================================
 * RUTAS DE CLIENTES - MÓDULO CORE
 * ====================================================================
 *
 * Rutas para gestión de Clientes como módulo Core compartido.
 * Siguiendo el patrón Odoo/Salesforce donde Clientes es transversal.
 *
 * Migrado desde modules/agendamiento/routes (Nov 2025)
 * ====================================================================
 */

const express = require('express');
const ClienteController = require('../controllers/cliente.controller');
const { auth, tenant, validation, rateLimiting, subscription } = require('../../../middleware');
const clienteSchemas = require('../schemas/cliente.schemas');

const router = express.Router();

// ===================================================================
// CRUD BÁSICO
// ===================================================================

/**
 * POST /api/v1/clientes
 * Crear nuevo cliente
 */
router.post('/',
    auth.authenticateToken,
    tenant.setTenantContext,
    subscription.checkActiveSubscription,
    subscription.checkResourceLimit('clientes'),
    rateLimiting.apiRateLimit,
    validation.validate(clienteSchemas.crear),
    ClienteController.crear
);

/**
 * GET /api/v1/clientes
 * Listar clientes con paginación y filtros
 */
router.get('/',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(clienteSchemas.listar),
    ClienteController.listar
);

// ===================================================================
// ESTADÍSTICAS Y BÚSQUEDAS (antes de :id para evitar conflictos)
// ===================================================================

/**
 * GET /api/v1/clientes/estadisticas
 * Estadísticas generales de clientes de la organización
 */
router.get('/estadisticas',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    auth.requireRole(['super_admin', 'admin', 'organizacion_admin', 'manager']),
    validation.validate(clienteSchemas.obtenerEstadisticas),
    ClienteController.obtenerEstadisticas
);

/**
 * GET /api/v1/clientes/buscar-telefono
 * Búsqueda fuzzy por teléfono (para chatbots y walk-in)
 */
router.get('/buscar-telefono',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(clienteSchemas.buscarPorTelefono),
    ClienteController.buscarPorTelefono
);

/**
 * GET /api/v1/clientes/buscar-nombre
 * Búsqueda fuzzy por nombre (para chatbots)
 */
router.get('/buscar-nombre',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(clienteSchemas.buscarPorNombre),
    ClienteController.buscarPorNombre
);

/**
 * GET /api/v1/clientes/buscar
 * Búsqueda general (nombre, email, teléfono)
 */
router.get('/buscar',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(clienteSchemas.buscar),
    ClienteController.buscar
);

// ===================================================================
// OPERACIONES POR ID
// ===================================================================

/**
 * GET /api/v1/clientes/:id
 * Obtener cliente por ID
 */
router.get('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(clienteSchemas.obtenerPorId),
    ClienteController.obtenerPorId
);

/**
 * GET /api/v1/clientes/:id/estadisticas
 * Vista 360° del cliente - Estadísticas detalladas (CRM)
 */
router.get('/:id/estadisticas',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(clienteSchemas.obtenerEstadisticasCliente),
    ClienteController.obtenerEstadisticasCliente
);

/**
 * PUT /api/v1/clientes/:id
 * Actualizar cliente
 */
router.put('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(clienteSchemas.actualizar),
    ClienteController.actualizar
);

/**
 * PATCH /api/v1/clientes/:id/estado
 * Cambiar estado activo/inactivo
 */
router.patch('/:id/estado',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    auth.requireRole(['super_admin', 'admin', 'organizacion_admin', 'manager']),
    validation.validate(clienteSchemas.cambiarEstado),
    ClienteController.cambiarEstado
);

/**
 * DELETE /api/v1/clientes/:id
 * Eliminar cliente (soft delete)
 */
router.delete('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    auth.requireRole(['super_admin', 'admin', 'organizacion_admin']),
    validation.validate(clienteSchemas.eliminar),
    ClienteController.eliminar
);

module.exports = router;
