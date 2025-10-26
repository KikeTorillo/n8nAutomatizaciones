/**
 * ====================================================================
 * ROUTES - DISPONIBILIDAD
 * ====================================================================
 *
 * Rutas para consultar disponibilidad de horarios.
 */

const express = require('express');
const DisponibilidadController = require('../../../controllers/disponibilidad.controller');
const { auth, tenant, rateLimiting, validation } = require('../../../middleware');
const disponibilidadSchemas = require('../../../schemas/disponibilidad.schemas');

const router = express.Router();

/**
 * GET /api/v1/disponibilidad
 * Consultar disponibilidad de slots horarios
 *
 * Query params:
 * - fecha (requerido): YYYY-MM-DD, ISO, "hoy", "mañana"
 * - servicio_id (requerido): ID del servicio
 * - profesional_id (opcional): ID del profesional específico
 * - hora (opcional): HH:MM - Consulta slot específico
 * - duracion (opcional): Minutos (default: duración del servicio)
 * - rango_dias (opcional): 1-90 días (default: 1, limitado por rol)
 * - intervalo_minutos (opcional): 15, 30, 60 (default: 30)
 * - solo_disponibles (opcional): true/false (default: true)
 */
router.get(
  '/',
  auth.authenticateToken,
  tenant.setTenantContext,
  rateLimiting.apiRateLimit,
  validation.validate(disponibilidadSchemas.consultar),
  DisponibilidadController.consultar
);

module.exports = router;
