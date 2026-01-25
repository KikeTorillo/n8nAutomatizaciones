const express = require('express');
const router = express.Router();

const PuestoController = require('../controllers/puesto.controller');
const { auth, tenant, validation } = require('../../../middleware');
const schemas = require('../schemas/organizacion.schemas');
const asyncHandler = require('../../../middleware/asyncHandler');

const validate = validation.validate;

// POST /puestos
router.post(
    '/',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    validate(schemas.puestoCrear),
    asyncHandler(PuestoController.crear)
);

// GET /puestos
router.get(
    '/',
    auth.authenticateToken,
    tenant.setTenantContext,
    validate(schemas.puestoListar),
    asyncHandler(PuestoController.listar)
);

// GET /puestos/:id
router.get(
    '/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    validate(schemas.obtenerPorId),
    asyncHandler(PuestoController.obtenerPorId)
);

// PUT /puestos/:id
router.put(
    '/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    validate(schemas.puestoActualizar),
    asyncHandler(PuestoController.actualizar)
);

// DELETE /puestos/:id
router.delete(
    '/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    validate(schemas.obtenerPorId),
    asyncHandler(PuestoController.eliminar)
);

module.exports = router;
