/**
 * Routes - Módulo de Vacaciones
 * Plan de Empleados Competitivo - Fase 3
 * Enero 2026
 */
const express = require('express');
const VacacionesController = require('../controllers/vacaciones.controller');
const { auth, tenant, rateLimiting, validation } = require('../../../middleware');
const schemas = require('../schemas/vacaciones.schemas');

const router = express.Router();

// ==================== MIDDLEWARE COMÚN ====================

const authMiddleware = [
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
];

const adminMiddleware = [
    ...authMiddleware,
    auth.requireAdminRole,
];

// ==================== RUTAS DE POLÍTICA ====================

// Obtener política de vacaciones
router.get('/politica',
    ...authMiddleware,
    validation.validate(schemas.obtenerPolitica),
    VacacionesController.obtenerPolitica
);

// Actualizar política de vacaciones (admin)
router.put('/politica',
    ...adminMiddleware,
    validation.validate(schemas.actualizarPolitica),
    VacacionesController.actualizarPolitica
);

// ==================== RUTAS DE NIVELES ====================

// Listar niveles de vacaciones
router.get('/niveles',
    ...authMiddleware,
    validation.validate(schemas.listarNiveles),
    VacacionesController.listarNiveles
);

// Crear nivel (admin)
router.post('/niveles',
    ...adminMiddleware,
    validation.validate(schemas.crearNivel),
    VacacionesController.crearNivel
);

// Crear niveles preset por país (admin)
router.post('/niveles/preset',
    ...adminMiddleware,
    validation.validate(schemas.crearNivelesPreset),
    VacacionesController.crearNivelesPreset
);

// Actualizar nivel (admin)
router.put('/niveles/:id',
    ...adminMiddleware,
    validation.validate(schemas.actualizarNivel),
    VacacionesController.actualizarNivel
);

// Eliminar nivel (admin)
router.delete('/niveles/:id',
    ...adminMiddleware,
    validation.validate(schemas.eliminarNivel),
    VacacionesController.eliminarNivel
);

// ==================== RUTAS DE SALDOS ====================

// Obtener mi saldo de vacaciones
router.get('/mi-saldo',
    ...authMiddleware,
    validation.validate(schemas.obtenerMiSaldo),
    VacacionesController.obtenerMiSaldo
);

// Listar saldos (admin)
router.get('/saldos',
    ...adminMiddleware,
    validation.validate(schemas.listarSaldos),
    VacacionesController.listarSaldos
);

// Ajustar saldo manualmente (admin)
router.put('/saldos/:id/ajustar',
    ...adminMiddleware,
    validation.validate(schemas.ajustarSaldo),
    VacacionesController.ajustarSaldo
);

// Generar saldos para un año (admin)
router.post('/saldos/generar-anio',
    ...adminMiddleware,
    validation.validate(schemas.generarSaldosAnio),
    VacacionesController.generarSaldosAnio
);

// ==================== RUTAS DE SOLICITUDES ====================

// Crear solicitud de vacaciones
router.post('/solicitudes',
    ...authMiddleware,
    validation.validate(schemas.crearSolicitud),
    VacacionesController.crearSolicitud
);

// Listar mis solicitudes
router.get('/mis-solicitudes',
    ...authMiddleware,
    validation.validate(schemas.listarMisSolicitudes),
    VacacionesController.listarMisSolicitudes
);

// Listar todas las solicitudes (admin)
router.get('/solicitudes',
    ...adminMiddleware,
    validation.validate(schemas.listarSolicitudes),
    VacacionesController.listarSolicitudes
);

// Listar solicitudes pendientes de aprobación (admin)
router.get('/solicitudes/pendientes',
    ...adminMiddleware,
    validation.validate(schemas.listarPendientes),
    VacacionesController.listarPendientes
);

// Obtener solicitud por ID
router.get('/solicitudes/:id',
    ...authMiddleware,
    validation.validate(schemas.obtenerSolicitud),
    VacacionesController.obtenerSolicitud
);

// Aprobar solicitud (admin)
router.post('/solicitudes/:id/aprobar',
    ...adminMiddleware,
    validation.validate(schemas.aprobarSolicitud),
    VacacionesController.aprobarSolicitud
);

// Rechazar solicitud (admin)
router.post('/solicitudes/:id/rechazar',
    ...adminMiddleware,
    validation.validate(schemas.rechazarSolicitud),
    VacacionesController.rechazarSolicitud
);

// Cancelar solicitud
router.delete('/solicitudes/:id',
    ...authMiddleware,
    validation.validate(schemas.cancelarSolicitud),
    VacacionesController.cancelarSolicitud
);

// ==================== RUTAS DE DASHBOARD ====================

// Obtener dashboard del usuario
router.get('/dashboard',
    ...authMiddleware,
    validation.validate(schemas.obtenerDashboard),
    VacacionesController.obtenerDashboard
);

// Obtener estadísticas generales (admin)
router.get('/estadisticas',
    ...adminMiddleware,
    validation.validate(schemas.obtenerEstadisticas),
    VacacionesController.obtenerEstadisticas
);

// Exportar como objeto para RouteLoader
module.exports = {
    vacaciones: router,
};
