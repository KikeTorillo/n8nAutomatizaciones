/**
 * ====================================================================
 * ROUTES: SUSCRIPCIONES
 * ====================================================================
 */

const express = require('express');
const router = express.Router();
const { SuscripcionesController } = require('../controllers');
const schemas = require('../schemas/suscripciones.schemas');
const { validate } = require('../../../middleware/validation');
const { auth, tenant, permisos } = require('../../../middleware');

// Middleware chain común
const authChain = [
    auth.authenticateToken,
    tenant.setTenantContext
];

/**
 * GET /api/v1/suscripciones-negocio/suscripciones/mi-suscripcion
 * Obtener mi suscripción activa (para página MiPlan)
 * Disponible para cualquier usuario autenticado
 */
router.get(
    '/mi-suscripcion',
    ...authChain,
    // Sin verificación de permisos - cualquier usuario puede ver su propio plan
    SuscripcionesController.obtenerMiSuscripcion
);

/**
 * PATCH /api/v1/suscripciones-negocio/suscripciones/mi-suscripcion/cambiar-plan
 * Cambiar plan de mi propia suscripción
 * Disponible para cualquier usuario autenticado (solo puede cambiar su propio plan)
 */
router.patch(
    '/mi-suscripcion/cambiar-plan',
    ...authChain,
    // Sin verificación de permisos - el controller valida que sea su propia suscripción
    validate(schemas.cambiarPlan),
    SuscripcionesController.cambiarMiPlan
);

// ============================================================================
// CUSTOMER BILLING: Admin crea suscripciones para clientes
// ============================================================================

/**
 * POST /api/v1/suscripciones-negocio/suscripciones/cliente
 * Crear suscripción para un cliente (genera link de checkout)
 */
router.post(
    '/cliente',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.crear_suscripciones'),
    validate(schemas.crearParaCliente),
    SuscripcionesController.crearParaCliente
);

/**
 * GET /api/v1/suscripciones-negocio/suscripciones/tokens
 * Listar tokens de checkout generados
 */
router.get(
    '/tokens',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.ver_suscripciones'),
    validate(schemas.listarCheckoutTokens, 'query'),
    SuscripcionesController.listarCheckoutTokens
);

/**
 * DELETE /api/v1/suscripciones-negocio/suscripciones/tokens/:tokenId
 * Cancelar token de checkout
 */
router.delete(
    '/tokens/:tokenId',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.editar_suscripciones'),
    SuscripcionesController.cancelarCheckoutToken
);

// ============================================================================
// CRUD SUSCRIPCIONES
// ============================================================================

/**
 * GET /api/v1/suscripciones-negocio/suscripciones
 * Listar suscripciones con paginación y filtros
 */
router.get(
    '/',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.ver_suscripciones'),
    validate(schemas.listarSuscripciones, 'query'),
    SuscripcionesController.listar
);

/**
 * GET /api/v1/suscripciones-negocio/suscripciones/cliente/:clienteId
 * Buscar suscripciones de un cliente
 */
router.get(
    '/cliente/:clienteId',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.ver_suscripciones'),
    SuscripcionesController.buscarPorCliente
);

/**
 * GET /api/v1/suscripciones-negocio/suscripciones/:id
 * Buscar suscripción por ID
 */
router.get(
    '/:id',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.ver_suscripciones'),
    SuscripcionesController.buscarPorId
);

/**
 * GET /api/v1/suscripciones-negocio/suscripciones/:id/historial
 * Obtener historial de cambios de una suscripción
 */
router.get(
    '/:id/historial',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.ver_suscripciones'),
    SuscripcionesController.obtenerHistorial
);

/**
 * POST /api/v1/suscripciones-negocio/suscripciones
 * Crear nueva suscripción
 */
router.post(
    '/',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.crear_suscripciones'),
    validate(schemas.crearSuscripcion),
    SuscripcionesController.crear
);

/**
 * PUT /api/v1/suscripciones-negocio/suscripciones/:id
 * Actualizar suscripción existente
 */
router.put(
    '/:id',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.editar_suscripciones'),
    validate(schemas.actualizarSuscripcion),
    SuscripcionesController.actualizar
);

/**
 * PATCH /api/v1/suscripciones-negocio/suscripciones/:id/estado
 * Cambiar estado de suscripción
 */
router.patch(
    '/:id/estado',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.editar_suscripciones'),
    validate(schemas.cambiarEstado),
    SuscripcionesController.cambiarEstado
);

/**
 * PATCH /api/v1/suscripciones-negocio/suscripciones/:id/cambiar-plan
 * Cambiar plan de suscripción
 */
router.patch(
    '/:id/cambiar-plan',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.editar_suscripciones'),
    validate(schemas.cambiarPlan),
    SuscripcionesController.cambiarPlan
);

/**
 * POST /api/v1/suscripciones-negocio/suscripciones/:id/cancelar
 * Cancelar suscripción
 */
router.post(
    '/:id/cancelar',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.cancelar_suscripciones'),
    validate(schemas.cancelarSuscripcion),
    SuscripcionesController.cancelar
);

/**
 * POST /api/v1/suscripciones-negocio/suscripciones/:id/pausar
 * Pausar suscripción
 */
router.post(
    '/:id/pausar',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.editar_suscripciones'),
    validate(schemas.pausarSuscripcion),
    SuscripcionesController.pausar
);

/**
 * POST /api/v1/suscripciones-negocio/suscripciones/:id/reactivar
 * Reactivar suscripción pausada
 */
router.post(
    '/:id/reactivar',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.editar_suscripciones'),
    SuscripcionesController.reactivar
);

/**
 * PATCH /api/v1/suscripciones-negocio/suscripciones/:id/proximo-cobro
 * Actualizar fecha de próximo cobro
 */
router.patch(
    '/:id/proximo-cobro',
    ...authChain,
    permisos.verificarPermiso('suscripciones_negocio.editar_suscripciones'),
    validate(schemas.actualizarProximoCobro),
    SuscripcionesController.actualizarProximoCobro
);

module.exports = router;
