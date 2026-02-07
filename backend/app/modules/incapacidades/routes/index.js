/**
 * Rutas del Módulo de Incapacidades
 * Enero 2026
 */
const express = require('express');
const IncapacidadesController = require('../controllers/incapacidades.controller');
const auth = require('../../../middleware/auth');
const tenant = require('../../../middleware/tenant');
const rateLimiting = require('../../../middleware/rateLimiting');
const validation = require('../../../middleware/validation');
const schemas = require('../schemas/incapacidades.schemas');

const router = express.Router();

// Middleware de autenticación estándar
const authMiddleware = [
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
];

// Middleware adicional para admin
const adminMiddleware = [
    ...authMiddleware,
    auth.requireAdminRole,
];

// ==================== RUTAS EMPLEADO ====================

// Mis incapacidades (empleado autenticado)
router.get(
    '/mis-incapacidades',
    ...authMiddleware,
    validation.validate(schemas.listarMis),
    IncapacidadesController.listarMisIncapacidades
);

// ==================== RUTAS ADMIN ====================

// Estadísticas (antes que :id para evitar conflicto)
router.get(
    '/estadisticas',
    ...adminMiddleware,
    validation.validate(schemas.estadisticas),
    IncapacidadesController.obtenerEstadisticas
);

// Incapacidades activas de un profesional
router.get(
    '/profesional/:profesionalId/activas',
    ...authMiddleware,
    IncapacidadesController.obtenerActivasPorProfesional
);

// Crear nueva incapacidad
router.post(
    '/',
    ...adminMiddleware,
    validation.validate(schemas.crear),
    IncapacidadesController.crear
);

// Listar todas las incapacidades
router.get(
    '/',
    ...adminMiddleware,
    validation.validate(schemas.listar),
    IncapacidadesController.listar
);

// Obtener incapacidad por ID
router.get(
    '/:id',
    ...authMiddleware,
    validation.validate(schemas.obtener),
    IncapacidadesController.obtenerPorId
);

// Actualizar incapacidad
router.put(
    '/:id',
    ...adminMiddleware,
    validation.validate(schemas.actualizar),
    IncapacidadesController.actualizar
);

// Finalizar incapacidad anticipadamente
router.post(
    '/:id/finalizar',
    ...adminMiddleware,
    validation.validate(schemas.finalizar),
    IncapacidadesController.finalizar
);

// Crear prórroga
router.post(
    '/:id/prorroga',
    ...adminMiddleware,
    validation.validate(schemas.crearProrroga),
    IncapacidadesController.crearProrroga
);

// Cancelar incapacidad
router.delete(
    '/:id',
    ...adminMiddleware,
    validation.validate(schemas.cancelar),
    IncapacidadesController.cancelar
);

module.exports = { incapacidades: router };
