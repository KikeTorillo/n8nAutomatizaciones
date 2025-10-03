/**
 * Rutas de Clientes
 * Endpoints para gestión CRUD de clientes con aislamiento multi-tenant
 */

const express = require('express');
const ClienteController = require('../../../controllers/cliente.controller');
const { auth, tenant, validation, rateLimiting } = require('../../../middleware');
const clienteSchemas = require('../../../schemas/cliente.schemas');

const router = express.Router();

/**
 * @route   POST /api/v1/clientes
 * @desc    Crear nuevo cliente
 * @access  Private (admin, organizacion_admin, manager, empleado)
 */
router.post('/',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(clienteSchemas.crear),
    ClienteController.crear
);

/**
 * @route   GET /api/v1/clientes
 * @desc    Listar clientes con filtros y paginación
 * @access  Private (todos los roles autenticados de la organización)
 */
router.get('/',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(clienteSchemas.listar),
    ClienteController.listar
);

/**
 * @route   GET /api/v1/clientes/estadisticas
 * @desc    Obtener estadísticas de clientes de la organización
 * @access  Private (admin, organizacion_admin, manager)
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
 * @route   GET /api/v1/clientes/buscar-telefono
 * @desc    Buscar cliente por teléfono con fuzzy matching (CRÍTICO PARA IA)
 * @access  Private (todos los roles autenticados de la organización)
 */
router.get('/buscar-telefono',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(clienteSchemas.buscarPorTelefono),
    ClienteController.buscarPorTelefono
);

/**
 * @route   GET /api/v1/clientes/buscar-nombre
 * @desc    Buscar clientes por nombre con fuzzy matching (COMPLEMENTARIO PARA IA)
 * @access  Private (todos los roles autenticados de la organización)
 */
router.get('/buscar-nombre',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(clienteSchemas.buscarPorNombre),
    ClienteController.buscarPorNombre
);

/**
 * @route   GET /api/v1/clientes/buscar
 * @desc    Buscar clientes por texto (nombre, email, teléfono)
 * @access  Private (todos los roles autenticados de la organización)
 */
router.get('/buscar',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(clienteSchemas.buscar),
    ClienteController.buscar
);

/**
 * @route   GET /api/v1/clientes/:id
 * @desc    Obtener cliente por ID
 * @access  Private (todos los roles autenticados de la organización)
 */
router.get('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(clienteSchemas.obtenerPorId),
    ClienteController.obtenerPorId
);

/**
 * @route   PUT /api/v1/clientes/:id
 * @desc    Actualizar cliente
 * @access  Private (admin, organizacion_admin, manager, empleado)
 */
router.put('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(clienteSchemas.actualizar),
    ClienteController.actualizar
);

/**
 * @route   PATCH /api/v1/clientes/:id/estado
 * @desc    Cambiar estado de cliente (activar/desactivar)
 * @access  Private (admin, organizacion_admin, manager)
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
 * @route   DELETE /api/v1/clientes/:id
 * @desc    Eliminar cliente (soft delete)
 * @access  Private (admin, organizacion_admin)
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
