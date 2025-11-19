const express = require('express');
const router = express.Router();
const { auth, tenant, rateLimiting, validation } = require('../../../../../middleware');
const TipoBloqueoController = require('../../../../../controllers/tipos-bloqueo.controller');
const schemas = require('../../../schemas/tipos-bloqueo.schemas');

const { validate, handleValidation } = validation;

// GET /api/v1/tipos-bloqueo - Listar tipos
router.get(
  '/',
  auth.authenticateToken,
  tenant.setTenantContext,
  rateLimiting.apiRateLimit,
  validate(schemas.listar),
  handleValidation,
  TipoBloqueoController.listar
);

// GET /api/v1/tipos-bloqueo/:id - Obtener por ID
router.get(
  '/:id',
  auth.authenticateToken,
  tenant.setTenantContext,
  rateLimiting.apiRateLimit,
  validate(schemas.obtenerPorId),
  handleValidation,
  TipoBloqueoController.obtenerPorId
);

// POST /api/v1/tipos-bloqueo - Crear tipo personalizado (admin/propietario)
router.post(
  '/',
  auth.authenticateToken,
  tenant.setTenantContext,
  auth.requireRole(['admin', 'propietario']),
  rateLimiting.apiRateLimit,
  validate(schemas.crear),
  handleValidation,
  TipoBloqueoController.crear
);

// PUT /api/v1/tipos-bloqueo/:id - Actualizar tipo personalizado
router.put(
  '/:id',
  auth.authenticateToken,
  tenant.setTenantContext,
  auth.requireRole(['admin', 'propietario']),
  rateLimiting.apiRateLimit,
  validate(schemas.actualizar),
  handleValidation,
  TipoBloqueoController.actualizar
);

// DELETE /api/v1/tipos-bloqueo/:id - Eliminar tipo personalizado
router.delete(
  '/:id',
  auth.authenticateToken,
  tenant.setTenantContext,
  auth.requireRole(['admin', 'propietario']),
  rateLimiting.apiRateLimit,
  validate(schemas.eliminar),
  handleValidation,
  TipoBloqueoController.eliminar
);

module.exports = router;
