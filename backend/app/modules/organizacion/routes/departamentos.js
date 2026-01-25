const express = require('express');
const router = express.Router();

const DepartamentoController = require('../controllers/departamento.controller');
const { auth, tenant, validation } = require('../../../middleware');
const schemas = require('../schemas/organizacion.schemas');
const asyncHandler = require('../../../middleware/asyncHandler');

const validate = validation.validate;

// POST /departamentos
router.post(
    '/',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    validate(schemas.departamentoCrear),
    asyncHandler(DepartamentoController.crear)
);

// GET /departamentos
router.get(
    '/',
    auth.authenticateToken,
    tenant.setTenantContext,
    validate(schemas.departamentoListar),
    asyncHandler(DepartamentoController.listar)
);

// GET /departamentos/arbol
router.get(
    '/arbol',
    auth.authenticateToken,
    tenant.setTenantContext,
    asyncHandler(DepartamentoController.obtenerArbol)
);

// POST /departamentos/seed-catalogos
router.post(
    '/seed-catalogos',
    auth.authenticateToken,
    tenant.setTenantContext,
    auth.requireAdminRole,
    asyncHandler(DepartamentoController.seedCatalogos)
);

// GET /departamentos/:id
router.get(
    '/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    validate(schemas.obtenerPorId),
    asyncHandler(DepartamentoController.obtenerPorId)
);

// PUT /departamentos/:id
router.put(
    '/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    validate(schemas.departamentoActualizar),
    asyncHandler(DepartamentoController.actualizar)
);

// DELETE /departamentos/:id
router.delete(
    '/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    validate(schemas.obtenerPorId),
    asyncHandler(DepartamentoController.eliminar)
);

module.exports = router;
