/**
 * ====================================================================
 * ROUTES - RESERVAS DE STOCK
 * ====================================================================
 * Evita sobreventa en ventas concurrentes
 */

const express = require('express');
const InventarioController = require('../controllers');
const { auth, tenant, rateLimiting, validation, modules } = require('../../../middleware');
const inventarioSchemas = require('../schemas/inventario.schemas');

const router = express.Router();
const validate = validation.validate;

/**
 * POST /api/v1/inventario/reservas
 * Crear nueva reserva de stock
 */
router.post('/reservas',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.crearReserva),
    InventarioController.crearReserva
);

/**
 * POST /api/v1/inventario/reservas/multiple
 * Crear multiples reservas en una transaccion
 */
router.post('/reservas/multiple',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.crearReservaMultiple),
    InventarioController.crearReservaMultiple
);

/**
 * POST /api/v1/inventario/reservas/confirmar-multiple
 * Confirmar multiples reservas
 */
router.post('/reservas/confirmar-multiple',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.confirmarReservaMultiple),
    InventarioController.confirmarReservaMultiple
);

/**
 * GET /api/v1/inventario/reservas/:id
 * Obtener reserva por ID
 */
router.get('/reservas/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.obtenerPorId),
    InventarioController.obtenerReservaPorId
);

/**
 * GET /api/v1/inventario/reservas
 * Listar reservas con filtros
 */
router.get('/reservas',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.listarReservas),
    InventarioController.listarReservas
);

/**
 * PATCH /api/v1/inventario/reservas/:id/confirmar
 * Confirmar reserva (descuenta stock real)
 */
router.patch('/reservas/:id/confirmar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.confirmarReserva),
    InventarioController.confirmarReserva
);

/**
 * PATCH /api/v1/inventario/reservas/:id/extender
 * Extender tiempo de expiracion de una reserva
 */
router.patch('/reservas/:id/extender',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.extenderReserva),
    InventarioController.extenderReserva
);

/**
 * DELETE /api/v1/inventario/reservas/origen/:tipoOrigen/:origenId
 * Cancelar reservas por origen (ej: todas las de una venta)
 */
router.delete('/reservas/origen/:tipoOrigen/:origenId',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.cancelarReservaPorOrigen),
    InventarioController.cancelarReservaPorOrigen
);

/**
 * DELETE /api/v1/inventario/reservas/:id
 * Cancelar reserva individual
 */
router.delete('/reservas/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    validate(inventarioSchemas.cancelarReserva),
    InventarioController.cancelarReserva
);

module.exports = router;
