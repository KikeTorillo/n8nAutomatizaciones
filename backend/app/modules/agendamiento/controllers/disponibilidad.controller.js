/**
 * ====================================================================
 * CONTROLLER - DISPONIBILIDAD
 * ====================================================================
 *
 * Controlador para consultar disponibilidad de horarios.
 * Reutilizable para: chatbot, frontend admin, portal cliente.
 */

const DisponibilidadModel = require('../models/disponibilidad.model');
const { asyncHandler } = require('../../../middleware');
const { ResponseHelper } = require('../../../utils/helpers');
const logger = require('../../../utils/logger');

class DisponibilidadController {
  /**
   * Consultar disponibilidad de slots horarios
   * GET /api/v1/disponibilidad
   */
  static consultar = asyncHandler(async (req, res) => {
    const {
      fecha,
      servicio_id,
      servicios_ids,
      profesional_id,
      hora,
      duracion,
      rango_dias,
      intervalo_minutos,
      solo_disponibles,
      excluir_cita_id,
    } = req.query;

    // Determinar si es request público o autenticado
    const esPublico = !req.user;
    const rol = esPublico ? 'cliente' : req.user.rol_codigo; // Requests públicos se tratan como cliente

    logger.info('[DisponibilidadController.consultar] Request recibido', {
      usuario_id: req.user?.id,
      rol,
      es_publico: esPublico,
      organizacion_id: req.tenant.organizacionId,
      fecha,
      servicio_id,
      servicios_ids,
      profesional_id,
      hora,
      excluir_cita_id,
    });

    // ========== 1. Validar límites de rango_dias por rol ==========
    const rangoDiasMax = this._obtenerRangoDiasMax(rol);
    const rangoDiasFinal = Math.min(parseInt(rango_dias) || 1, rangoDiasMax);

    if (parseInt(rango_dias) > rangoDiasMax) {
      logger.warn('[DisponibilidadController] Rango de días excedido para rol', {
        rol,
        rango_solicitado: rango_dias,
        rango_max: rangoDiasMax,
        rango_aplicado: rangoDiasFinal,
      });
    }

    // ========== 2. Determinar nivel de detalle según rol ==========
    const nivelDetalle = this._determinarNivelDetalle(rol);

    // ========== 3. Procesar servicios_ids (soporta array o número único) ==========
    let servicioIdFinal = null;
    if (servicios_ids) {
      // Si es array, tomar el primer elemento; si es número, usarlo directamente
      servicioIdFinal = Array.isArray(servicios_ids)
        ? parseInt(servicios_ids[0])
        : parseInt(servicios_ids);
    } else if (servicio_id) {
      servicioIdFinal = parseInt(servicio_id);
    }

    // ========== 4. Consultar disponibilidad ==========
    const disponibilidad = await DisponibilidadModel.consultarDisponibilidad({
      organizacionId: req.tenant.organizacionId,
      fecha,
      servicioId: servicioIdFinal,
      profesionalId: profesional_id ? parseInt(profesional_id) : null,
      hora,
      duracion: duracion ? parseInt(duracion) : null,
      rangoDias: rangoDiasFinal,
      intervaloMinutos: parseInt(intervalo_minutos) || 30,
      soloDisponibles: solo_disponibles !== 'false',
      nivelDetalle,
      excluirCitaId: excluir_cita_id ? parseInt(excluir_cita_id) : null,
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
