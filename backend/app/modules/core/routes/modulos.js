/**
 * @fileoverview Rutas de Módulos
 * @description Endpoints para consultar y gestionar módulos activos
 */

const express = require('express');
const router = express.Router();

const ModulosController = require('../controllers/modulos.controller');
const { authenticateToken, requireRole } = require('../../../middleware/auth');
const { setTenantContext } = require('../../../middleware/tenant');
const { validate, validateParams } = require('../../../middleware/validation');
const asyncHandler = require('../../../middleware/asyncHandler');
const modulosSchemas = require('../schemas/modulos.schemas');

/**
 * GET /api/v1/modulos/disponibles
 * Lista todos los módulos disponibles en el sistema
 * Público para que usuarios puedan ver opciones antes de comprar
 */
router.get('/disponibles',
  asyncHandler(ModulosController.listarDisponibles)
);

/**
 * GET /api/v1/modulos/activos
 * Obtiene los módulos activos de la organización del usuario
 * Requiere autenticación
 */
router.get('/activos',
  authenticateToken,
  setTenantContext,
  asyncHandler(ModulosController.obtenerActivos)
);

/**
 * GET /api/v1/modulos/verificar/:modulo
 * Verifica si un módulo específico está activo
 * Requiere autenticación
 */
router.get('/verificar/:modulo',
  authenticateToken,
  setTenantContext,
  validateParams(modulosSchemas.verificarModuloParam),
  asyncHandler(ModulosController.verificarModulo)
);

/**
 * PUT /api/v1/modulos/activar
 * Activa un módulo para la organización
 * Solo admin/propietario
 */
router.put('/activar',
  authenticateToken,
  setTenantContext,
  requireRole(['super_admin', 'propietario', 'admin']),
  validate(modulosSchemas.cambiarEstadoModulo),
  asyncHandler(ModulosController.activarModulo)
);

/**
 * PUT /api/v1/modulos/desactivar
 * Desactiva un módulo para la organización
 * Solo admin/propietario
 */
router.put('/desactivar',
  authenticateToken,
  setTenantContext,
  requireRole(['super_admin', 'propietario', 'admin']),
  validate(modulosSchemas.cambiarEstadoModulo),
  asyncHandler(ModulosController.desactivarModulo)
);

module.exports = router;
