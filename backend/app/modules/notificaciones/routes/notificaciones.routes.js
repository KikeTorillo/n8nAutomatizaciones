/**
 * ====================================================================
 * ROUTES - NOTIFICACIONES
 * ====================================================================
 *
 * Rutas para gestion del centro de notificaciones:
 * - Feed de notificaciones
 * - Marcar como leida/archivar
 * - Preferencias de notificacion
 * - Plantillas personalizadas
 */

const express = require('express');
const NotificacionesController = require('../controllers');
const { auth, tenant, rateLimiting, validation } = require('../../../middleware');
const notificacionesSchemas = require('../schemas/notificaciones.schemas');

const router = express.Router();
const validate = validation.validate;

// ===================================================================
// ENDPOINTS DE NOTIFICACIONES (USUARIO)
// ===================================================================

/**
 * GET /api/v1/notificaciones/count
 * Contar notificaciones no leidas (para badge)
 * NOTA: Debe ir ANTES de /:id
 */
router.get('/count',
  auth.authenticateToken,
  tenant.setTenantContext,
  rateLimiting.apiRateLimit,
  NotificacionesController.count
);

/**
 * GET /api/v1/notificaciones/preferencias
 * Obtener preferencias del usuario
 */
router.get('/preferencias',
  auth.authenticateToken,
  tenant.setTenantContext,
  rateLimiting.apiRateLimit,
  NotificacionesController.getPreferencias
);

/**
 * PUT /api/v1/notificaciones/preferencias
 * Actualizar preferencias del usuario
 */
router.put('/preferencias',
  auth.authenticateToken,
  tenant.setTenantContext,
  rateLimiting.apiRateLimit,
  validate(notificacionesSchemas.updatePreferenciasSchema),
  NotificacionesController.updatePreferencias
);

/**
 * GET /api/v1/notificaciones/tipos
 * Listar tipos de notificacion disponibles
 */
router.get('/tipos',
  auth.authenticateToken,
  tenant.setTenantContext,
  rateLimiting.apiRateLimit,
  NotificacionesController.getTipos
);

/**
 * PUT /api/v1/notificaciones/leer-todas
 * Marcar todas las notificaciones como leidas
 */
router.put('/leer-todas',
  auth.authenticateToken,
  tenant.setTenantContext,
  rateLimiting.apiRateLimit,
  NotificacionesController.marcarTodasLeidas
);

/**
 * GET /api/v1/notificaciones
 * Listar notificaciones del usuario
 *
 * Query params:
 * - solo_no_leidas: boolean (default: false)
 * - categoria: string (filtrar por categoria)
 * - limit: number (default: 20, max: 100)
 * - offset: number (default: 0)
 */
router.get('/',
  auth.authenticateToken,
  tenant.setTenantContext,
  rateLimiting.apiRateLimit,
  validate(notificacionesSchemas.listSchema),
  NotificacionesController.list
);

/**
 * POST /api/v1/notificaciones
 * Crear notificacion (admin/sistema)
 */
router.post('/',
  auth.authenticateToken,
  tenant.setTenantContext,
  auth.requireRole(['super_admin', 'admin']),
  rateLimiting.apiRateLimit,
  validate(notificacionesSchemas.createSchema),
  NotificacionesController.create
);

/**
 * PUT /api/v1/notificaciones/:id/leer
 * Marcar notificacion como leida
 */
router.put('/:id/leer',
  auth.authenticateToken,
  tenant.setTenantContext,
  rateLimiting.apiRateLimit,
  validate(notificacionesSchemas.marcarLeidaSchema),
  NotificacionesController.marcarLeida
);

/**
 * PUT /api/v1/notificaciones/:id/archivar
 * Archivar notificacion
 */
router.put('/:id/archivar',
  auth.authenticateToken,
  tenant.setTenantContext,
  rateLimiting.apiRateLimit,
  validate(notificacionesSchemas.archivarSchema),
  NotificacionesController.archivar
);

/**
 * DELETE /api/v1/notificaciones/:id
 * Eliminar notificacion
 */
router.delete('/:id',
  auth.authenticateToken,
  tenant.setTenantContext,
  rateLimiting.apiRateLimit,
  validate(notificacionesSchemas.deleteSchema),
  NotificacionesController.delete
);

// ===================================================================
// ENDPOINTS DE PLANTILLAS (ADMIN)
// ===================================================================

/**
 * GET /api/v1/notificaciones/plantillas
 * Listar plantillas de la organizacion
 */
router.get('/plantillas',
  auth.authenticateToken,
  tenant.setTenantContext,
  auth.requireRole(['super_admin', 'admin']),
  rateLimiting.apiRateLimit,
  NotificacionesController.getPlantillas
);

/**
 * POST /api/v1/notificaciones/plantillas
 * Crear plantilla
 */
router.post('/plantillas',
  auth.authenticateToken,
  tenant.setTenantContext,
  auth.requireRole(['super_admin', 'admin']),
  rateLimiting.apiRateLimit,
  validate(notificacionesSchemas.createPlantillaSchema),
  NotificacionesController.createPlantilla
);

/**
 * PUT /api/v1/notificaciones/plantillas/:id
 * Actualizar plantilla
 */
router.put('/plantillas/:id',
  auth.authenticateToken,
  tenant.setTenantContext,
  auth.requireRole(['super_admin', 'admin']),
  rateLimiting.apiRateLimit,
  validate(notificacionesSchemas.updatePlantillaSchema),
  NotificacionesController.updatePlantilla
);

/**
 * DELETE /api/v1/notificaciones/plantillas/:id
 * Eliminar plantilla
 */
router.delete('/plantillas/:id',
  auth.authenticateToken,
  tenant.setTenantContext,
  auth.requireRole(['super_admin', 'admin']),
  rateLimiting.apiRateLimit,
  NotificacionesController.deletePlantilla
);

module.exports = router;
