/**
 * @fileoverview Rutas de Motivos de Salida
 * @description Endpoints REST para gestión de motivos de terminación
 * @version 1.0.0
 * @date Enero 2026
 *
 * Catálogo dinámico de razones de terminación
 *
 * Endpoints:
 * - GET    /motivos-salida              - Listar motivos
 * - GET    /motivos-salida/estadisticas - Estadísticas de uso
 * - GET    /motivos-salida/:id          - Obtener por ID
 * - GET    /motivos-salida/codigo/:cod  - Obtener por código
 * - POST   /motivos-salida              - Crear motivo personalizado
 * - PUT    /motivos-salida/:id          - Actualizar motivo
 * - DELETE /motivos-salida/:id          - Eliminar motivo (soft)
 */

const express = require('express');
const router = express.Router();
const { auth, tenant, rateLimiting, validation } = require('../../../middleware');
const MotivoSalidaController = require('../controllers/motivos-salida.controller');
const schemas = require('../schemas/motivos-salida.schemas');

const { validate, handleValidation } = validation;

// GET /api/v1/motivos-salida - Listar motivos
router.get(
  '/',
  auth.authenticateToken,
  tenant.setTenantContext,
  rateLimiting.apiRateLimit,
  validate(schemas.listar),
  handleValidation,
  MotivoSalidaController.listar
);

// GET /api/v1/motivos-salida/estadisticas - Estadísticas de uso
router.get(
  '/estadisticas',
  auth.authenticateToken,
  tenant.setTenantContext,
  rateLimiting.apiRateLimit,
  MotivoSalidaController.estadisticas
);

// GET /api/v1/motivos-salida/codigo/:codigo - Obtener por código
router.get(
  '/codigo/:codigo',
  auth.authenticateToken,
  tenant.setTenantContext,
  rateLimiting.apiRateLimit,
  validate(schemas.obtenerPorCodigo),
  handleValidation,
  MotivoSalidaController.obtenerPorCodigo
);

// GET /api/v1/motivos-salida/:id - Obtener por ID
router.get(
  '/:id',
  auth.authenticateToken,
  tenant.setTenantContext,
  rateLimiting.apiRateLimit,
  validate(schemas.obtenerPorId),
  handleValidation,
  MotivoSalidaController.obtenerPorId
);

// POST /api/v1/motivos-salida - Crear motivo personalizado (admin/propietario)
router.post(
  '/',
  auth.authenticateToken,
  tenant.setTenantContext,
  auth.requireRole(['admin']),
  rateLimiting.apiRateLimit,
  validate(schemas.crear),
  handleValidation,
  MotivoSalidaController.crear
);

// PUT /api/v1/motivos-salida/:id - Actualizar motivo personalizado
router.put(
  '/:id',
  auth.authenticateToken,
  tenant.setTenantContext,
  auth.requireRole(['admin']),
  rateLimiting.apiRateLimit,
  validate(schemas.actualizar),
  handleValidation,
  MotivoSalidaController.actualizar
);

// DELETE /api/v1/motivos-salida/:id - Eliminar motivo personalizado
router.delete(
  '/:id',
  auth.authenticateToken,
  tenant.setTenantContext,
  auth.requireRole(['admin']),
  rateLimiting.apiRateLimit,
  validate(schemas.eliminar),
  handleValidation,
  MotivoSalidaController.eliminar
);

module.exports = router;
