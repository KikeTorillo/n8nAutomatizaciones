/**
 * Rutas de Horarios
 * Endpoints para gestión de disponibilidad y reservas con aislamiento multi-tenant
 * Incluye endpoints públicos para IA y CRUD completo con autenticación
 */

const express = require('express');
const router = express.Router();
const HorarioController = require('../../../controllers/horario.controller');
const { auth, tenant, rateLimiting, validation } = require('../../../middleware');
const horarioSchemas = require('../../../schemas/horario.schemas');

// ===================================================================
// ENDPOINTS PÚBLICOS PARA IA - Con rate limiting y validación
// ===================================================================

// Consultar disponibilidad básica
router.get('/disponibles',
  rateLimiting.apiRateLimit, // Protección contra abuso
  validation.validate(horarioSchemas.consultarDisponibilidad),
  HorarioController.obtenerDisponibilidad
);

// Consultar disponibilidad inteligente (NLP)
router.get('/disponibles/inteligente',
  rateLimiting.apiRateLimit,
  validation.validate(horarioSchemas.consultarDisponibilidadInteligente),
  HorarioController.obtenerDisponibilidadInteligente
);

// Reservar temporalmente (carrito IA)
router.post('/reservar-temporal',
  rateLimiting.apiRateLimit,
  validation.validate(horarioSchemas.reservarTemporal),
  HorarioController.reservarTemporalmente
);

// ===================================================================
// ENDPOINTS AUTENTICADOS - CRUD COMPLETO
// ===================================================================

// Crear horario
router.post('/',
  auth.authenticateToken,
  tenant.setTenantContext,
  rateLimiting.apiRateLimit,
  auth.requireRole(['admin', 'propietario', 'empleado']),
  validation.validate(horarioSchemas.crear),
  HorarioController.crear
);

// Obtener horarios (lista y por ID)
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

// Actualizar horario
router.put('/:id',
  auth.authenticateToken,
  tenant.setTenantContext,
  rateLimiting.apiRateLimit,
  auth.requireRole(['admin', 'propietario']),
  validation.validate(horarioSchemas.actualizar),
  HorarioController.actualizar
);

// Eliminar horario (lógico)
router.delete('/:id',
  auth.authenticateToken,
  tenant.setTenantContext,
  rateLimiting.apiRateLimit,
  auth.requireRole(['admin', 'propietario']),
  validation.validate(horarioSchemas.eliminar),
  HorarioController.eliminar
);

// ===================================================================
// ENDPOINTS DE GESTIÓN DE RESERVAS
// ===================================================================

// Liberar reserva temporal
router.post('/liberar-reserva',
  auth.authenticateToken,
  tenant.setTenantContext,
  rateLimiting.apiRateLimit,
  validation.validate(horarioSchemas.liberarReservaTemporal),
  HorarioController.liberarReservaTemporal
);

// Limpiar reservas expiradas (mantenimiento)
router.post('/limpiar-reservas-expiradas',
  auth.authenticateToken,
  tenant.setTenantContext,
  rateLimiting.apiRateLimit,
  auth.requireRole(['admin', 'super_admin']),
  validation.validate(horarioSchemas.limpiarReservasExpiradas),
  HorarioController.limpiarReservasExpiradas
);

module.exports = router;