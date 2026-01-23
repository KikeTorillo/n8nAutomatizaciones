/**
 * ====================================================================
 * ROUTES: PLANES DE SUSCRIPCIÓN
 * ====================================================================
 */

const express = require('express');
const router = express.Router();
const { PlanesController } = require('../controllers');
const schemas = require('../schemas/suscripciones.schemas');
const { validate } = require('../../../middleware/validation');
const { auth, tenant, permisos } = require('../../../middleware');

// Middleware chain común
const authChain = [
    auth.authenticateToken,
    tenant.setTenantContext
];

// ====================================================================
// RUTAS PÚBLICAS (sin autenticación)
// ====================================================================

/**
 * GET /api/v1/suscripciones-negocio/planes/publicos
 * Listar planes públicos de Nexo Team (para página de checkout)
 * NO requiere autenticación
 */
router.get(
    '/publicos',
    PlanesController.listarPublicos
);

// ====================================================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ====================================================================

/**
 * GET /api/v1/suscripciones-negocio/planes
 * Listar planes con paginación y filtros
 */
router.get(
    '/',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.ver_planes'),
    validate(schemas.listarPlanes, 'query'),
    PlanesController.listar
);

/**
 * GET /api/v1/suscripciones-negocio/planes/activos
 * Listar solo planes activos (sin paginación)
 */
router.get(
    '/activos',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.ver_planes'),
    PlanesController.listarActivos
);

/**
 * GET /api/v1/suscripciones-negocio/planes/:id
 * Buscar plan por ID
 */
router.get(
    '/:id',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.ver_planes'),
    PlanesController.buscarPorId
);

/**
 * GET /api/v1/suscripciones-negocio/planes/:id/suscripciones-activas
 * Contar suscripciones activas de un plan
 */
router.get(
    '/:id/suscripciones-activas',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.ver_planes'),
    PlanesController.contarSuscripcionesActivas
);

/**
 * POST /api/v1/suscripciones-negocio/planes
 * Crear nuevo plan
 */
router.post(
    '/',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.crear_planes'),
    validate(schemas.crearPlan),
    PlanesController.crear
);

/**
 * PUT /api/v1/suscripciones-negocio/planes/:id
 * Actualizar plan existente
 */
router.put(
    '/:id',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.editar_planes'),
    validate(schemas.actualizarPlan),
    PlanesController.actualizar
);

/**
 * DELETE /api/v1/suscripciones-negocio/planes/:id
 * Eliminar plan (solo si no tiene suscripciones activas)
 */
router.delete(
    '/:id',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.eliminar_planes'),
    PlanesController.eliminar
);

module.exports = router;
