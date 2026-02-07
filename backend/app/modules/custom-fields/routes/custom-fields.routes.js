/**
 * ====================================================================
 * ROUTES - CUSTOM FIELDS
 * ====================================================================
 *
 * Rutas para gestión de campos personalizados:
 * - CRUD de definiciones de campos
 * - Lectura/escritura de valores por entidad
 * - Validación de valores
 * - Reordenamiento de campos
 */

const express = require('express');
const CustomFieldsController = require('../controllers');
const { auth, tenant, rateLimiting, validation } = require('../../../middleware');
const customFieldsSchemas = require('../schemas/custom-fields.schemas');

const router = express.Router();
const validate = validation.validate;

// ===================================================================
// ENDPOINTS DE DEFINICIONES
// ===================================================================

/**
 * GET /api/v1/custom-fields/definiciones
 * Listar definiciones de campos
 *
 * Query params:
 * - entidad_tipo: Filtrar por tipo de entidad
 * - activo: Filtrar por estado activo
 * - seccion: Filtrar por sección
 * - visible_en_formulario: Solo campos visibles en formulario
 * - visible_en_listado: Solo campos visibles en listado
 * - limit: Límite de resultados (default: 50)
 * - offset: Desplazamiento para paginación
 */
router.get('/definiciones',
  auth.authenticateToken,
  tenant.setTenantContext,
  tenant.verifyTenantActive,
  rateLimiting.userRateLimit,
  validate(customFieldsSchemas.listDefinicionesSchema),
  CustomFieldsController.listDefiniciones
);

/**
 * POST /api/v1/custom-fields/definiciones
 * Crear una nueva definición de campo
 */
router.post('/definiciones',
  auth.authenticateToken,
  tenant.setTenantContext,
  tenant.verifyTenantActive,
  auth.requireRole(['super_admin', 'admin']),
  rateLimiting.userRateLimit,
  validate(customFieldsSchemas.createDefinicionSchema),
  CustomFieldsController.createDefinicion
);

/**
 * PUT /api/v1/custom-fields/definiciones/reorder
 * Reordenar definiciones de campos
 * NOTA: Debe ir ANTES de /:id para evitar conflictos
 */
router.put('/definiciones/reorder',
  auth.authenticateToken,
  tenant.setTenantContext,
  tenant.verifyTenantActive,
  auth.requireRole(['super_admin', 'admin']),
  rateLimiting.userRateLimit,
  validate(customFieldsSchemas.reorderDefinicionesSchema),
  CustomFieldsController.reorderDefiniciones
);

/**
 * GET /api/v1/custom-fields/definiciones/:id
 * Obtener definición por ID
 */
router.get('/definiciones/:id',
  auth.authenticateToken,
  tenant.setTenantContext,
  tenant.verifyTenantActive,
  rateLimiting.userRateLimit,
  validate(customFieldsSchemas.getDefinicionSchema),
  CustomFieldsController.getDefinicion
);

/**
 * PUT /api/v1/custom-fields/definiciones/:id
 * Actualizar definición de campo
 */
router.put('/definiciones/:id',
  auth.authenticateToken,
  tenant.setTenantContext,
  tenant.verifyTenantActive,
  auth.requireRole(['super_admin', 'admin']),
  rateLimiting.userRateLimit,
  validate(customFieldsSchemas.updateDefinicionSchema),
  CustomFieldsController.updateDefinicion
);

/**
 * DELETE /api/v1/custom-fields/definiciones/:id
 * Eliminar definición de campo (soft delete)
 */
router.delete('/definiciones/:id',
  auth.authenticateToken,
  tenant.setTenantContext,
  tenant.verifyTenantActive,
  auth.requireRole(['super_admin', 'admin']),
  rateLimiting.userRateLimit,
  validate(customFieldsSchemas.deleteDefinicionSchema),
  CustomFieldsController.deleteDefinicion
);

// ===================================================================
// ENDPOINTS DE VALORES
// ===================================================================

/**
 * GET /api/v1/custom-fields/valores/:entidad_tipo/:entidad_id
 * Obtener valores de campos personalizados de una entidad
 */
router.get('/valores/:entidad_tipo/:entidad_id',
  auth.authenticateToken,
  tenant.setTenantContext,
  tenant.verifyTenantActive,
  rateLimiting.userRateLimit,
  validate(customFieldsSchemas.getValoresSchema),
  CustomFieldsController.getValores
);

/**
 * POST /api/v1/custom-fields/valores/:entidad_tipo/:entidad_id
 * Guardar valores de campos personalizados de una entidad
 */
router.post('/valores/:entidad_tipo/:entidad_id',
  auth.authenticateToken,
  tenant.setTenantContext,
  tenant.verifyTenantActive,
  rateLimiting.userRateLimit,
  validate(customFieldsSchemas.saveValoresSchema),
  CustomFieldsController.saveValores
);

// ===================================================================
// ENDPOINTS DE UTILIDADES
// ===================================================================

/**
 * POST /api/v1/custom-fields/validar/:entidad_tipo
 * Validar valores de campos personalizados (sin guardar)
 */
router.post('/validar/:entidad_tipo',
  auth.authenticateToken,
  tenant.setTenantContext,
  tenant.verifyTenantActive,
  rateLimiting.userRateLimit,
  validate(customFieldsSchemas.validateValoresSchema),
  CustomFieldsController.validateValores
);

/**
 * GET /api/v1/custom-fields/secciones/:entidad_tipo
 * Obtener secciones disponibles para un tipo de entidad
 */
router.get('/secciones/:entidad_tipo',
  auth.authenticateToken,
  tenant.setTenantContext,
  tenant.verifyTenantActive,
  rateLimiting.userRateLimit,
  CustomFieldsController.getSecciones
);

module.exports = router;
