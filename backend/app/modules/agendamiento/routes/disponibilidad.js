/**
 * ====================================================================
 * ROUTES - DISPONIBILIDAD
 * ====================================================================
 *
 * Rutas para consultar disponibilidad de horarios.
 */

const express = require('express');
const DisponibilidadController = require('../controllers/disponibilidad.controller');
const { auth, tenant, rateLimiting, validation } = require('../../../middleware');
const disponibilidadSchemas = require('../schemas/disponibilidad.schemas');

const router = express.Router();

/**
 * GET /api/v1/disponibilidad
 * Consultar disponibilidad de slots horarios
 *
 * Query params:
 * - organizacion_id (requerido si no autenticado): ID de la organización
 * - fecha (requerido): YYYY-MM-DD, ISO, "hoy", "mañana"
 * - servicio_id o servicios_ids[] (requerido): ID(s) del servicio
 * - profesional_id (opcional): ID del profesional específico
 * - hora (opcional): HH:MM - Consulta slot específico
 * - duracion (opcional): Minutos (default: duración del servicio)
 * - rango_dias (opcional): 1-90 días (default: 1, limitado por rol)
 * - intervalo_minutos (opcional): 15, 30, 60 (default: 30)
 * - solo_disponibles (opcional): true/false (default: true)
 * - excluir_cita_id (opcional): ID de cita a excluir (para reagendamiento)
 *
 * ✅ FEATURE: Agendamiento público de marketplace
 * - Con auth: Usa organizacion_id del usuario
 * - Sin auth: Usa organizacion_id del query parameter
 */
router.get(
  '/',
  auth.optionalAuth,  // ✅ Permite requests con y sin token
  // Middleware condicional para tenant context
  (req, res, next) => {
    if (req.user) {
      // Usuario autenticado: usar tenant context normal
      return tenant.setTenantContext(req, res, next);
    } else {
      // Request público: usar tenant context desde query
      return tenant.setTenantContextFromQuery(req, res, next);
    }
  },
  rateLimiting.apiRateLimit,
  validation.validate(disponibilidadSchemas.consultar),
  DisponibilidadController.consultar
);

module.exports = router;
