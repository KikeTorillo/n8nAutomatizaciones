/**
 * ====================================================================
 * ROUTES: PAGOS DE SUSCRIPCIONES
 * ====================================================================
 */

const express = require('express');
const router = express.Router();
const { PagosController } = require('../controllers');
const schemas = require('../schemas/suscripciones.schemas');
const { validate } = require('../../../middleware/validation');
const { auth, tenant, permisos } = require('../../../middleware');

// Middleware chain común
const authChain = [
    auth.authenticateToken,
    tenant.setTenantContext
];

/**
 * GET /api/v1/suscripciones-negocio/pagos
 * Listar pagos con paginación y filtros
 */
router.get(
    '/',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.ver_pagos'),
    validate(schemas.listarPagos, 'query'),
    PagosController.listar
);

/**
 * GET /api/v1/suscripciones-negocio/pagos/resumen
 * Obtener resumen de pagos (dashboard)
 */
router.get(
    '/resumen',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.ver_pagos'),
    validate(schemas.resumenPagos, 'query'),
    PagosController.obtenerResumen
);

/**
 * GET /api/v1/suscripciones-negocio/pagos/transaccion/:gateway/:transactionId
 * Buscar pago por transaction_id del gateway
 */
router.get(
    '/transaccion/:gateway/:transactionId',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.ver_pagos'),
    PagosController.buscarPorTransactionId
);

/**
 * GET /api/v1/suscripciones-negocio/pagos/:id
 * Buscar pago por ID
 */
router.get(
    '/:id',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.ver_pagos'),
    PagosController.buscarPorId
);

/**
 * POST /api/v1/suscripciones-negocio/pagos
 * Crear registro de pago
 */
router.post(
    '/',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.crear_pagos'),
    validate(schemas.crearPago),
    PagosController.crear
);

/**
 * PATCH /api/v1/suscripciones-negocio/pagos/:id/estado
 * Actualizar estado del pago
 */
router.patch(
    '/:id/estado',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.editar_pagos'),
    validate(schemas.actualizarEstadoPago),
    PagosController.actualizarEstado
);

/**
 * POST /api/v1/suscripciones-negocio/pagos/:id/reembolso
 * Procesar reembolso
 */
router.post(
    '/:id/reembolso',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.reembolsar_pagos'),
    validate(schemas.procesarReembolso),
    PagosController.procesarReembolso
);

module.exports = router;
