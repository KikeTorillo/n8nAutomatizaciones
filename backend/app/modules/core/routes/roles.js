/**
 * @fileoverview Rutas de Roles
 * @description Endpoints CRUD para gestión de roles dinámicos
 * @version 1.0.0
 * @date Enero 2026
 */

const express = require('express');
const RolesController = require('../controllers/roles.controller');
const rolesSchemas = require('../schemas/roles.schemas');
const asyncHandler = require('../../../middleware/asyncHandler');
const { validate } = require('../../../middleware/validation');
const { authenticateToken, requireAdminRole } = require('../../../middleware/auth');
const { rateLimiting } = require('../../../middleware');

const router = express.Router();

/**
 * @route GET /api/v1/roles
 * @desc Listar roles de la organización
 * @access Private (autenticado)
 */
router.get('/',
  authenticateToken,
  rateLimiting.apiRateLimit,
  validate(rolesSchemas.listar),
  asyncHandler(RolesController.listar)
);

/**
 * @route GET /api/v1/roles/:id
 * @desc Obtener un rol por ID
 * @access Private (autenticado)
 */
router.get('/:id',
  authenticateToken,
  rateLimiting.apiRateLimit,
  validate(rolesSchemas.obtenerPorId),
  asyncHandler(RolesController.obtenerPorId)
);

/**
 * @route POST /api/v1/roles
 * @desc Crear un nuevo rol
 * @access Private (admin)
 */
router.post('/',
  authenticateToken,
  requireAdminRole,
  rateLimiting.apiRateLimit,
  validate(rolesSchemas.crear),
  asyncHandler(RolesController.crear)
);

/**
 * @route PUT /api/v1/roles/:id
 * @desc Actualizar un rol
 * @access Private (admin)
 */
router.put('/:id',
  authenticateToken,
  requireAdminRole,
  rateLimiting.apiRateLimit,
  validate(rolesSchemas.actualizar),
  asyncHandler(RolesController.actualizar)
);

/**
 * @route DELETE /api/v1/roles/:id
 * @desc Eliminar un rol
 * @access Private (admin)
 */
router.delete('/:id',
  authenticateToken,
  requireAdminRole,
  rateLimiting.apiRateLimit,
  validate(rolesSchemas.eliminar),
  asyncHandler(RolesController.eliminar)
);

/**
 * @route POST /api/v1/roles/:id/copiar-permisos
 * @desc Copiar permisos de otro rol
 * @access Private (admin)
 */
router.post('/:id/copiar-permisos',
  authenticateToken,
  requireAdminRole,
  rateLimiting.apiRateLimit,
  validate(rolesSchemas.copiarPermisos),
  asyncHandler(RolesController.copiarPermisos)
);

/**
 * @route GET /api/v1/roles/:id/permisos
 * @desc Obtener permisos de un rol
 * @access Private (admin)
 */
router.get('/:id/permisos',
  authenticateToken,
  requireAdminRole,
  rateLimiting.apiRateLimit,
  validate(rolesSchemas.obtenerPermisos),
  asyncHandler(RolesController.obtenerPermisos)
);

/**
 * @route PUT /api/v1/roles/:id/permisos/:permisoId
 * @desc Actualizar un permiso de un rol
 * @access Private (admin)
 */
router.put('/:id/permisos/:permisoId',
  authenticateToken,
  requireAdminRole,
  rateLimiting.apiRateLimit,
  validate(rolesSchemas.actualizarPermiso),
  asyncHandler(RolesController.actualizarPermiso)
);

/**
 * @route PUT /api/v1/roles/:id/permisos
 * @desc Actualizar múltiples permisos de un rol (batch)
 * @access Private (admin)
 */
router.put('/:id/permisos',
  authenticateToken,
  requireAdminRole,
  rateLimiting.apiRateLimit,
  validate(rolesSchemas.actualizarPermisosBatch),
  asyncHandler(RolesController.actualizarPermisosBatch)
);

module.exports = router;
