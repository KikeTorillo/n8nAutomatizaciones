const express = require('express');
const router = express.Router();
const HorarioController = require('../../../controllers/horario.controller');
const { auth, tenant, rateLimiting, validation } = require('../../../middleware');
const horarioSchemas = require('../../../schemas/horario.schemas');

// Endpoints públicos para IA
router.get('/disponibles',
    rateLimiting.apiRateLimit,
    validation.validate(horarioSchemas.consultarDisponibilidad),
    HorarioController.obtenerDisponibilidad
);

router.get('/disponibles/inteligente',
    rateLimiting.apiRateLimit,
    validation.validate(horarioSchemas.consultarDisponibilidadInteligente),
    HorarioController.obtenerDisponibilidadInteligente
);

router.post('/reservar-temporal',
    rateLimiting.apiRateLimit,
    validation.validate(horarioSchemas.reservarTemporal),
    HorarioController.reservarTemporalmente
);

// CRUD autenticado
router.post('/',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(horarioSchemas.crear),
    auth.requireRole(['admin', 'propietario', 'empleado']),
    HorarioController.crear
);

router.get('/',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(horarioSchemas.obtener),
    HorarioController.obtener
);

router.get('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(horarioSchemas.obtener),
    HorarioController.obtener
);

router.put('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(horarioSchemas.actualizar),
    auth.requireRole(['admin', 'propietario']),
    HorarioController.actualizar
);

router.delete('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(horarioSchemas.eliminar),
    auth.requireRole(['admin', 'propietario']),
    HorarioController.eliminar
);

// Gestión de reservas
router.post('/liberar-reserva',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(horarioSchemas.liberarReservaTemporal),
    HorarioController.liberarReservaTemporal
);

router.post('/limpiar-reservas-expiradas',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(horarioSchemas.limpiarReservasExpiradas),
    auth.requireRole(['admin', 'super_admin']),
    HorarioController.limpiarReservasExpiradas
);

module.exports = router;