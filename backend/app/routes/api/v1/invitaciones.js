/**
 * @fileoverview Rutas de Invitaciones para Profesionales
 * @description Endpoints para gestión de invitaciones de empleados
 * @version 1.0.0
 * Nov 2025 - Sistema de Invitaciones Profesional-Usuario
 */

const express = require('express');
const router = express.Router();

const InvitacionController = require('../../../modules/core/controllers/invitacion.controller');
const { authenticateToken, requireRole } = require('../../../middleware/auth');
const { setTenantContext } = require('../../../middleware/tenant');
const { validate } = require('../../../middleware/validation');
const { apiRateLimit, userRateLimit } = require('../../../middleware/rateLimiting');
const invitacionSchemas = require('../../../schemas/invitacion.schemas');

// ====================================================================
// RUTAS PÚBLICAS (sin autenticación)
// Para que el invitado pueda validar y aceptar
// ====================================================================

/**
 * GET /invitaciones/validar/:token
 * Validar token de invitación (público)
 */
router.get('/validar/:token',
    apiRateLimit,
    validate(invitacionSchemas.validarToken),
    InvitacionController.validarToken
);

/**
 * POST /invitaciones/aceptar/:token
 * Aceptar invitación y crear usuario (público)
 */
router.post('/aceptar/:token',
    apiRateLimit,
    validate(invitacionSchemas.aceptar),
    InvitacionController.aceptar
);

// ====================================================================
// RUTAS PROTEGIDAS (requieren autenticación)
// Para administradores de la organización
// ====================================================================

/**
 * POST /invitaciones
 * Crear y enviar nueva invitación
 * Solo admin/propietario
 */
router.post('/',
    authenticateToken,
    setTenantContext,
    requireRole(['admin']),
    userRateLimit,
    validate(invitacionSchemas.crear),
    InvitacionController.crear
);

/**
 * GET /invitaciones
 * Listar invitaciones de la organización
 * Solo admin/propietario
 */
router.get('/',
    authenticateToken,
    setTenantContext,
    requireRole(['admin']),
    userRateLimit,
    validate(invitacionSchemas.listar),
    InvitacionController.listar
);

/**
 * GET /invitaciones/profesional/:profesionalId
 * Obtener invitación de un profesional específico
 * Solo admin/propietario
 */
router.get('/profesional/:profesionalId',
    authenticateToken,
    setTenantContext,
    requireRole(['admin']),
    userRateLimit,
    validate(invitacionSchemas.obtenerPorProfesional),
    InvitacionController.obtenerPorProfesional
);

/**
 * POST /invitaciones/:id/reenviar
 * Reenviar invitación (genera nuevo token)
 * Solo admin/propietario
 */
router.post('/:id/reenviar',
    authenticateToken,
    setTenantContext,
    requireRole(['admin']),
    userRateLimit,
    validate(invitacionSchemas.reenviar),
    InvitacionController.reenviar
);

/**
 * DELETE /invitaciones/:id
 * Cancelar invitación
 * Solo admin/propietario
 */
router.delete('/:id',
    authenticateToken,
    setTenantContext,
    requireRole(['admin']),
    userRateLimit,
    validate(invitacionSchemas.cancelar),
    InvitacionController.cancelar
);

module.exports = router;
