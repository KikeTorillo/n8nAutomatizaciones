const express = require('express');
const router = express.Router();

const CategoriaController = require('../controllers/categoria.controller');
const { auth, tenant, validation } = require('../../../middleware');
const schemas = require('../schemas/organizacion.schemas');
const asyncHandler = require('../../../middleware/asyncHandler');

const validate = validation.validate;

// POST /categorias-profesional
router.post(
    '/',
    auth.authenticateToken,
    tenant.setTenantContext,
    validate(schemas.categoriaCrear),
    asyncHandler(CategoriaController.crear)
);

// GET /categorias-profesional
router.get(
    '/',
    auth.authenticateToken,
    tenant.setTenantContext,
    validate(schemas.categoriaListar),
    asyncHandler(CategoriaController.listar)
);

// GET /categorias-profesional/:id
router.get(
    '/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    validate(schemas.obtenerPorId),
    asyncHandler(CategoriaController.obtenerPorId)
);

// GET /categorias-profesional/:id/profesionales
router.get(
    '/:id/profesionales',
    auth.authenticateToken,
    tenant.setTenantContext,
    validate(schemas.obtenerPorId),
    asyncHandler(CategoriaController.obtenerProfesionales)
);

// PUT /categorias-profesional/:id
router.put(
    '/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    validate(schemas.categoriaActualizar),
    asyncHandler(CategoriaController.actualizar)
);

// DELETE /categorias-profesional/:id
router.delete(
    '/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    validate(schemas.obtenerPorId),
    asyncHandler(CategoriaController.eliminar)
);

module.exports = router;
