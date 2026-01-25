/**
 * @fileoverview Rutas de Ubicaciones de Trabajo
 * @description Endpoints REST para gestión de ubicaciones (trabajo híbrido)
 * @version 1.0.0
 * @date Enero 2026
 *
 * GAP-003 vs Odoo 19: Soporte para trabajo híbrido
 *
 * Endpoints:
 * - GET    /ubicaciones-trabajo              - Listar ubicaciones
 * - GET    /ubicaciones-trabajo/estadisticas - Estadísticas por día
 * - GET    /ubicaciones-trabajo/:id          - Obtener por ID
 * - POST   /ubicaciones-trabajo              - Crear ubicación
 * - PUT    /ubicaciones-trabajo/:id          - Actualizar ubicación
 * - DELETE /ubicaciones-trabajo/:id          - Eliminar ubicación (soft)
 */

const express = require('express');
const router = express.Router();
const { auth, tenant, rateLimiting, validation } = require('../../../middleware');
const UbicacionTrabajoController = require('../controllers/ubicaciones-trabajo.controller');
const schemas = require('../schemas/ubicaciones-trabajo.schemas');

const { validate, handleValidation } = validation;

// GET /api/v1/ubicaciones-trabajo - Listar ubicaciones
router.get(
  '/',
  auth.authenticateToken,
  tenant.setTenantContext,
  rateLimiting.apiRateLimit,
  validate(schemas.listar),
  handleValidation,
  UbicacionTrabajoController.listar
);

// GET /api/v1/ubicaciones-trabajo/estadisticas - Estadísticas por día
router.get(
  '/estadisticas',
  auth.authenticateToken,
  tenant.setTenantContext,
  rateLimiting.apiRateLimit,
  UbicacionTrabajoController.estadisticas
);

// GET /api/v1/ubicaciones-trabajo/:id - Obtener por ID
router.get(
  '/:id',
  auth.authenticateToken,
  tenant.setTenantContext,
  rateLimiting.apiRateLimit,
  validate(schemas.obtenerPorId),
  handleValidation,
  UbicacionTrabajoController.obtenerPorId
);

// POST /api/v1/ubicaciones-trabajo - Crear ubicación (admin/propietario)
router.post(
  '/',
  auth.authenticateToken,
  tenant.setTenantContext,
  auth.requireRole(['admin']),
  rateLimiting.apiRateLimit,
  validate(schemas.crear),
  handleValidation,
  UbicacionTrabajoController.crear
);

// PUT /api/v1/ubicaciones-trabajo/:id - Actualizar ubicación
router.put(
  '/:id',
  auth.authenticateToken,
  tenant.setTenantContext,
  auth.requireRole(['admin']),
  rateLimiting.apiRateLimit,
  validate(schemas.actualizar),
  handleValidation,
  UbicacionTrabajoController.actualizar
);

// DELETE /ubicaciones-trabajo/:id - Eliminar ubicación
router.delete(
  '/:id',
  auth.authenticateToken,
  tenant.setTenantContext,
  auth.requireRole(['admin']),
  rateLimiting.apiRateLimit,
  validate(schemas.eliminar),
  handleValidation,
  UbicacionTrabajoController.eliminar
);

module.exports = router;
