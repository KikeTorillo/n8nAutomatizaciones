/**
 * @fileoverview Rutas de Categorías de Pago
 * @description Endpoints REST para gestión de categorías de nómina
 * @version 1.0.0
 * @date Enero 2026
 *
 * GAP-004 vs Odoo 19: Clasificación de empleados para nómina
 *
 * Endpoints:
 * - GET    /categorias-pago              - Listar categorías
 * - GET    /categorias-pago/estadisticas - Estadísticas de uso
 * - GET    /categorias-pago/:id          - Obtener por ID
 * - POST   /categorias-pago              - Crear categoría
 * - PUT    /categorias-pago/:id          - Actualizar categoría
 * - DELETE /categorias-pago/:id          - Eliminar categoría (soft)
 */

const express = require('express');
const router = express.Router();
const { auth, tenant, rateLimiting, validation } = require('../../../middleware');
const CategoriaPagoController = require('../controllers/categorias-pago.controller');
const schemas = require('../schemas/categorias-pago.schemas');

const { validate, handleValidation } = validation;

// GET /api/v1/categorias-pago - Listar categorías
router.get(
  '/',
  auth.authenticateToken,
  tenant.setTenantContext,
  rateLimiting.apiRateLimit,
  validate(schemas.listar),
  handleValidation,
  CategoriaPagoController.listar
);

// GET /api/v1/categorias-pago/estadisticas - Estadísticas de uso
router.get(
  '/estadisticas',
  auth.authenticateToken,
  tenant.setTenantContext,
  rateLimiting.apiRateLimit,
  CategoriaPagoController.estadisticas
);

// GET /api/v1/categorias-pago/:id - Obtener por ID
router.get(
  '/:id',
  auth.authenticateToken,
  tenant.setTenantContext,
  rateLimiting.apiRateLimit,
  validate(schemas.obtenerPorId),
  handleValidation,
  CategoriaPagoController.obtenerPorId
);

// POST /api/v1/categorias-pago - Crear categoría (admin/propietario)
router.post(
  '/',
  auth.authenticateToken,
  tenant.setTenantContext,
  auth.requireRole(['admin', 'propietario']),
  rateLimiting.apiRateLimit,
  validate(schemas.crear),
  handleValidation,
  CategoriaPagoController.crear
);

// PUT /api/v1/categorias-pago/:id - Actualizar categoría
router.put(
  '/:id',
  auth.authenticateToken,
  tenant.setTenantContext,
  auth.requireRole(['admin', 'propietario']),
  rateLimiting.apiRateLimit,
  validate(schemas.actualizar),
  handleValidation,
  CategoriaPagoController.actualizar
);

// DELETE /api/v1/categorias-pago/:id - Eliminar categoría
router.delete(
  '/:id',
  auth.authenticateToken,
  tenant.setTenantContext,
  auth.requireRole(['admin', 'propietario']),
  rateLimiting.apiRateLimit,
  validate(schemas.eliminar),
  handleValidation,
  CategoriaPagoController.eliminar
);

module.exports = router;
