/**
 * ====================================================================
 * ROUTES: CUPONES DE DESCUENTO
 * ====================================================================
 */

const express = require('express');
const router = express.Router();
const { CuponesController } = require('../controllers');
const schemas = require('../schemas/suscripciones.schemas');
const { validate } = require('../../../middleware/validation');
const { auth, tenant, permisos } = require('../../../middleware');

// Middleware chain común
const authChain = [
    auth.authenticateToken,
    tenant.setTenantContext
];

/**
 * GET /api/v1/suscripciones-negocio/cupones
 * Listar cupones con paginación y filtros
 */
router.get(
    '/',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.ver_cupones'),
    validate(schemas.listarCupones, 'query'),
    CuponesController.listar
);

/**
 * GET /api/v1/suscripciones-negocio/cupones/activos
 * Listar solo cupones activos y vigentes
 */
router.get(
    '/activos',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.ver_cupones'),
    CuponesController.listarActivos
);

/**
 * POST /api/v1/suscripciones-negocio/cupones/validar
 * Validar cupón para uso
 */
router.post(
    '/validar',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.ver_cupones'),
    validate(schemas.validarCupon),
    CuponesController.validar
);

/**
 * GET /api/v1/suscripciones-negocio/cupones/codigo/:codigo
 * Buscar cupón por código
 */
router.get(
    '/codigo/:codigo',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.ver_cupones'),
    CuponesController.buscarPorCodigo
);

/**
 * GET /api/v1/suscripciones-negocio/cupones/:id
 * Buscar cupón por ID
 */
router.get(
    '/:id',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.ver_cupones'),
    CuponesController.buscarPorId
);

/**
 * POST /api/v1/suscripciones-negocio/cupones
 * Crear nuevo cupón
 */
router.post(
    '/',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.crear_cupones'),
    validate(schemas.crearCupon),
    CuponesController.crear
);

/**
 * PUT /api/v1/suscripciones-negocio/cupones/:id
 * Actualizar cupón existente
 */
router.put(
    '/:id',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.editar_cupones'),
    validate(schemas.actualizarCupon),
    CuponesController.actualizar
);

/**
 * PATCH /api/v1/suscripciones-negocio/cupones/:id/desactivar
 * Desactivar cupón
 */
router.patch(
    '/:id/desactivar',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.editar_cupones'),
    CuponesController.desactivar
);

/**
 * DELETE /api/v1/suscripciones-negocio/cupones/:id
 * Eliminar cupón (solo si no tiene usos)
 */
router.delete(
    '/:id',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.eliminar_cupones'),
    CuponesController.eliminar
);

module.exports = router;
