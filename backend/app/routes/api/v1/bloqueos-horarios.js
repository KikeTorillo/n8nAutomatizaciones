const express = require('express');
const router = express.Router();
const { auth, tenant, rateLimiting, validation } = require('../../../middleware');
const BloqueosHorariosController = require('../../../controllers/bloqueos-horarios.controller');
const schemas = require('../../../schemas/bloqueos-horarios.schemas');

const { validate, handleValidation } = validation;

// CRUD bloqueos de horarios
router.post('/', auth.authenticateToken, tenant.setTenantContext, rateLimiting.apiRateLimit, validate(schemas.crear), handleValidation, BloqueosHorariosController.crear);
router.get('/', auth.authenticateToken, tenant.setTenantContext, rateLimiting.apiRateLimit, validate(schemas.obtener), handleValidation, BloqueosHorariosController.obtener);
router.get('/:id', auth.authenticateToken, tenant.setTenantContext, rateLimiting.apiRateLimit, validate(schemas.obtener), handleValidation, BloqueosHorariosController.obtener);
router.put('/:id', auth.authenticateToken, tenant.setTenantContext, rateLimiting.apiRateLimit, validate(schemas.actualizar), handleValidation, BloqueosHorariosController.actualizar);
router.delete('/:id', auth.authenticateToken, tenant.setTenantContext, rateLimiting.apiRateLimit, validate(schemas.eliminar), handleValidation, BloqueosHorariosController.eliminar);

module.exports = router;
