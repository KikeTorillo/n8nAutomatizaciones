/**
 * ====================================================================
 * CONTROLLER - DISPONIBILIDAD
 * ====================================================================
 *
 * Controlador para consultar disponibilidad de horarios.
 * Reutilizable para: chatbot, frontend admin, portal cliente.
 */

const DisponibilidadModel = require('../database/disponibilidad.model');
const { asyncHandler } = require('../middleware');
const { ResponseHelper } = require('../utils/helpers');
const logger = require('../utils/logger');

class DisponibilidadController {
  /**
   * Consultar disponibilidad de slots horarios
   * GET /api/v1/disponibilidad
   */
  static consultar = asyncHandler(async (req, res) => {
    const {
      fecha,
      servicio_id,
      profesional_id,
      hora,
      duracion,
      rango_dias,
      intervalo_minutos,
      solo_disponibles,
    } = req.query;

    logger.info('[DisponibilidadController.consultar] Request recibido', {
      usuario_id: req.user.id,
      rol: req.user.rol,
      organizacion_id: req.tenant.organizacionId,
      fecha,
      servicio_id,
      profesional_id,
      hora,
    });

    // ========== 1. Validar límites de rango_dias por rol ==========
    const rangoDiasMax = this._obtenerRangoDiasMax(req.user.rol);
    const rangoDiasFinal = Math.min(parseInt(rango_dias) || 1, rangoDiasMax);

    if (parseInt(rango_dias) > rangoDiasMax) {
      logger.warn('[DisponibilidadController] Rango de días excedido para rol', {
        rol: req.user.rol,
        rango_solicitado: rango_dias,
        rango_max: rangoDiasMax,
        rango_aplicado: rangoDiasFinal,
      });
    }

    // ========== 2. Determinar nivel de detalle según rol ==========
    const nivelDetalle = this._determinarNivelDetalle(req.user.rol);

    // ========== 3. Consultar disponibilidad ==========
    const disponibilidad = await DisponibilidadModel.consultarDisponibilidad({
      organizacionId: req.tenant.organizacionId,
      fecha,
      servicioId: parseInt(servicio_id),
      profesionalId: profesional_id ? parseInt(profesional_id) : null,
      hora,
      duracion: duracion ? parseInt(duracion) : null,
      rangoDias: rangoDiasFinal,
      intervaloMinutos: parseInt(intervalo_minutos) || 30,
      soloDisponibles: solo_disponibles !== 'false',
      nivelDetalle,
    });

    logger.info('[DisponibilidadController.consultar] Consulta exitosa', {
      total_fechas: disponibilidad.disponibilidad_por_fecha.length,
      total_profesionales: disponibilidad.metadata.total_profesionales,
      total_slots: disponibilidad.disponibilidad_por_fecha.reduce(
        (sum, f) => sum + f.total_slots_disponibles_dia,
        0
      ),
    });

    return ResponseHelper.success(res, disponibilidad, 'Disponibilidad consultada exitosamente');
  });

  // ====================================================================
  // MÉTODOS PRIVADOS
  // ====================================================================

  /**
   * Determinar nivel de detalle según rol del usuario
   *
   * @param {string} rol - Rol del usuario
   * @returns {string} - 'basico' | 'completo' | 'admin'
   */
  static _determinarNivelDetalle(rol) {
    // Cliente: solo ve disponible/ocupado (sin razones ni datos de otras citas)
    if (['cliente'].includes(rol)) {
      return 'basico';
    }

    // Bot: ve razones genéricas pero sin datos sensibles de clientes
    if (['bot'].includes(rol)) {
      return 'completo';
    }

    // Admin/Empleado: ve todos los detalles incluyendo cita_id y cliente_nombre
    return 'admin';
  }

  /**
   * Obtener rango máximo de días permitido por rol
   *
   * @param {string} rol - Rol del usuario
   * @returns {number} - Días máximos permitidos
   */
  static _obtenerRangoDiasMax(rol) {
    const limites = {
      cliente: 7, // 1 semana
      bot: 7, // 1 semana
      empleado: 14, // 2 semanas
      admin: 30, // 1 mes
      propietario: 30, // 1 mes
      super_admin: 90, // 3 meses
    };

    return limites[rol] || 7; // Default: 1 semana
  }
}

module.exports = DisponibilidadController;
