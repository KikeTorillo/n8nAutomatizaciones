const express = require('express');
const router = express.Router();
const TiposProfesionalController = require('../controllers/tipos-profesional.controller');
const { auth, tenant, rateLimiting, validation } = require('../../../middleware');
const tiposProfesionalSchemas = require('../schemas/tipos-profesional.schemas');

router.get(
    '/',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(tiposProfesionalSchemas.listar),
    TiposProfesionalController.listar
);

router.get(
    '/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(tiposProfesionalSchemas.obtener),
    TiposProfesionalController.obtener
);

router.post(
    '/',
    auth.authenticateToken,
    tenant.setTenantContext,
    auth.requireRole(['propietario', 'admin', 'super_admin']),
    rateLimiting.apiRateLimit,
    validation.validate(tiposProfesionalSchemas.crear),
    TiposProfesionalController.crear
);

router.put(
    '/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    auth.requireRole(['propietario', 'admin', 'super_admin']),
    rateLimiting.apiRateLimit,
    validation.validate(tiposProfesionalSchemas.actualizar),
    TiposProfesionalController.actualizar
);

router.delete(
    '/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    auth.requireRole(['propietario', 'admin', 'super_admin']),
    rateLimiting.apiRateLimit,
    validation.validate(tiposProfesionalSchemas.eliminar),
    TiposProfesionalController.eliminar
);

module.exports = router;
