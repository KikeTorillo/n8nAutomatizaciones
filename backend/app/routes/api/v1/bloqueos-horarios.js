/**
 * Rutas API para Bloqueos de Horarios
 * Gestión de vacaciones, permisos, festivos y bloqueos organizacionales
 */

const express = require('express');
const router = express.Router();

// Middlewares
const { auth, tenant, rateLimiting, validation } = require('../../../middleware');
const { validate, handleValidation } = validation;

// Controller
const BloqueosHorariosController = require('../../../controllers/bloqueos-horarios.controller');

// Schemas
const schemas = require('../../../schemas/bloqueos-horarios.schemas');

// ====================================================================
// CREAR BLOQUEO
// ====================================================================
/**
 * @route   POST /api/v1/bloqueos-horarios
 * @desc    Crear nuevo bloqueo de horario (vacaciones, permisos, etc)
 * @access  Autenticado + Admin
 */
router.post('/',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(schemas.crear),
    handleValidation,
    BloqueosHorariosController.crear
);

// ====================================================================
// OBTENER BLOQUEOS
// ====================================================================
/**
 * @route   GET /api/v1/bloqueos-horarios
 * @desc    Obtener lista de bloqueos con filtros
 * @access  Autenticado
 */
router.get('/',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(schemas.obtener),
    handleValidation,
    BloqueosHorariosController.obtener
);

/**
 * @route   GET /api/v1/bloqueos-horarios/:id
 * @desc    Obtener bloqueo específico por ID
 * @access  Autenticado
 */
router.get('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(schemas.obtener),
    handleValidation,
    BloqueosHorariosController.obtener
);

// ====================================================================
// ACTUALIZAR BLOQUEO
// ====================================================================
/**
 * @route   PUT /api/v1/bloqueos-horarios/:id
 * @desc    Actualizar bloqueo existente
 * @access  Autenticado + Admin
 */
router.put('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(schemas.actualizar),
    handleValidation,
    BloqueosHorariosController.actualizar
);

// ====================================================================
// ELIMINAR BLOQUEO
// ====================================================================
/**
 * @route   DELETE /api/v1/bloqueos-horarios/:id
 * @desc    Eliminar bloqueo (lógico)
 * @access  Autenticado + Admin
 */
router.delete('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(schemas.eliminar),
    handleValidation,
    BloqueosHorariosController.eliminar
);

module.exports = router;
