const express = require('express');
const CitaController = require('../../../controllers/citas');
const { auth, tenant, rateLimiting, validation } = require('../../../middleware');
const citaSchemas = require('../../../schemas/cita.schemas');

const router = express.Router();
const validate = validation.validate;

// ===================================================================
// IA CONVERSACIONAL
// ===================================================================

router.post('/automatica',
    rateLimiting.heavyOperationRateLimit,
    validate(citaSchemas.crearAutomatica),
    CitaController.crearAutomatica
);

router.get('/buscar-por-telefono',
    rateLimiting.apiRateLimit,
    validate(citaSchemas.buscarPorTelefono),
    CitaController.buscarPorTelefono
);

router.put('/automatica/:codigo',
    rateLimiting.heavyOperationRateLimit,
    validate(citaSchemas.modificarAutomatica),
    CitaController.modificarAutomatica
);

router.delete('/automatica/:codigo',
    rateLimiting.heavyOperationRateLimit,
    validate(citaSchemas.cancelarAutomatica),
    CitaController.cancelarAutomatica
);

// ===================================================================
// DASHBOARD Y MÉTRICAS
// ===================================================================

router.get('/dashboard/today',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.dashboardToday),
    CitaController.dashboardToday
);

router.get('/cola-espera',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.colaEspera),
    CitaController.colaEspera
);

router.get('/metricas-tiempo-real',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.metricasTiempoReal),
    CitaController.metricasTiempoReal
);

// ===================================================================
// WALK-IN Y DISPONIBILIDAD
// ===================================================================

router.post('/walk-in',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.crearWalkIn),
    CitaController.crearWalkIn
);

router.get('/disponibilidad-inmediata',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.disponibilidadInmediata),
    CitaController.disponibilidadInmediata
);

// ===================================================================
// RECORDATORIOS
// ===================================================================

router.get('/recordatorios',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.obtenerRecordatorios),
    CitaController.obtenerRecordatorios
);

// ===================================================================
// CRUD
// ===================================================================

router.post('/',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.crear),
    CitaController.crear
);

router.get('/',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.listar),
    CitaController.listar
);

// ===================================================================
// PARÁMETROS DINÁMICOS
// ===================================================================

router.get('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.obtener),
    CitaController.obtener
);

router.put('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.actualizar),
    CitaController.actualizar
);

router.delete('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.eliminar),
    CitaController.eliminar
);

router.patch('/:id/confirmar-asistencia',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.confirmarAsistencia),
    CitaController.confirmarAsistencia
);

// ===================================================================
// OPERACIONALES
// ===================================================================

router.post('/:id/check-in',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.checkIn),
    CitaController.checkIn
);

router.post('/:id/start-service',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.startService),
    CitaController.startService
);

router.post('/:id/complete',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.complete),
    CitaController.complete
);

router.post('/:id/reagendar',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.reagendar),
    CitaController.reagendar
);

router.patch('/:codigo/recordatorio-enviado',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.marcarRecordatorioEnviado),
    CitaController.marcarRecordatorioEnviado
);

router.patch('/:codigo/calificar-cliente',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.calificarCliente),
    CitaController.calificarCliente
);

module.exports = router;
