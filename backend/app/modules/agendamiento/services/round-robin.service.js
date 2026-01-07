/**
 * ====================================================================
 * ROUND-ROBIN SERVICE - AUTO-ASIGNACIÓN DE PROFESIONALES
 * ====================================================================
 *
 * Servicio para auto-asignación inteligente de profesionales en citas.
 * Implementa algoritmo round-robin con orden personalizable por servicio.
 *
 * CARACTERÍSTICAS:
 * - Round-robin con orden configurable (orden_rotacion)
 * - Verificación de disponibilidad antes de asignar
 * - Fallback a primer disponible si round-robin deshabilitado
 * - Estado de rotación calculado desde citas (sin tabla adicional)
 *
 * @module round-robin.service
 * @since Enero 2026
 */

const logger = require('../../../utils/logger');
const DisponibilidadModel = require('../models/disponibilidad.model');

class RoundRobinService {
  /**
   * Obtiene el siguiente profesional en rotación round-robin
   *
   * @param {Object} params - Parámetros de búsqueda
   * @param {number} params.servicioId - ID del servicio solicitado
   * @param {number} params.organizacionId - ID de la organización
   * @param {string} params.fecha - Fecha de la cita (YYYY-MM-DD)
   * @param {string} params.horaInicio - Hora inicio (HH:MM:SS o HH:MM)
   * @param {string} params.horaFin - Hora fin (HH:MM:SS o HH:MM)
   * @param {Object} db - Conexión de base de datos (dentro de transacción RLS)
   * @returns {Promise<{id: number, nombre: string}>} Profesional asignado
   * @throws {Error} Si no hay profesionales disponibles
   */
  static async obtenerSiguienteProfesional({ servicioId, organizacionId, fecha, horaInicio, horaFin, db }) {
    logger.info('[RoundRobinService.obtenerSiguienteProfesional] Iniciando auto-asignación', {
      servicio_id: servicioId,
      organizacion_id: organizacionId,
      fecha,
      horario: `${horaInicio}-${horaFin}`,
    });

    // 1. Verificar configuración de round-robin
    const config = await this._obtenerConfiguracion(organizacionId, db);

    // 2. Obtener profesionales que ofrecen el servicio (ordenados por orden_rotacion)
    const profesionales = await this._obtenerProfesionalesServicio(servicioId, organizacionId, db);

    if (profesionales.length === 0) {
      throw new Error('No hay profesionales asignados a este servicio');
    }

    logger.debug('[RoundRobinService] Profesionales encontrados', {
      cantidad: profesionales.length,
      profesionales: profesionales.map((p) => ({ id: p.id, nombre: p.nombre, orden: p.orden_rotacion })),
    });

    // 3. Si solo hay 1 profesional, asignarlo directamente (verificando disponibilidad)
    if (profesionales.length === 1) {
      const disponible = await this._verificarDisponibilidad({
        profesionalId: profesionales[0].id,
        servicioId,
        fecha,
        horaInicio,
        organizacionId,
      });

      if (!disponible) {
        throw new Error(
          `El profesional ${profesionales[0].nombre} no tiene disponibilidad en el horario solicitado`
        );
      }

      logger.info('[RoundRobinService] Único profesional asignado', {
        profesional_id: profesionales[0].id,
        nombre: profesionales[0].nombre,
      });

      return profesionales[0];
    }

    // 4. Calcular índice de inicio según modo
    let startIndex = 0;

    if (config.round_robin_habilitado) {
      // Obtener último profesional asignado para este servicio
      const ultimoAsignado = await this._obtenerUltimoAsignado(servicioId, organizacionId, db);
      startIndex = this._calcularSiguienteIndex(profesionales, ultimoAsignado);

      logger.debug('[RoundRobinService] Round-robin activo', {
        ultimo_asignado_id: ultimoAsignado,
        siguiente_index: startIndex,
      });
    }

    // 5. Iterar desde el índice calculado hasta encontrar disponible
    for (let i = 0; i < profesionales.length; i++) {
      const index = (startIndex + i) % profesionales.length;
      const profesional = profesionales[index];

      const disponible = await this._verificarDisponibilidad({
        profesionalId: profesional.id,
        servicioId,
        fecha,
        horaInicio,
        organizacionId,
      });

      if (disponible) {
        logger.info('[RoundRobinService] Profesional asignado', {
          profesional_id: profesional.id,
          nombre: profesional.nombre,
          es_siguiente_en_rotacion: i === 0,
          round_robin_habilitado: config.round_robin_habilitado,
        });

        return profesional;
      }

      logger.debug('[RoundRobinService] Profesional no disponible, probando siguiente', {
        profesional_id: profesional.id,
        nombre: profesional.nombre,
      });
    }

    // 6. Ninguno disponible
    const nombresProfesionales = profesionales.map((p) => p.nombre).join(', ');
    throw new Error(
      `No hay profesionales disponibles para el servicio en el horario solicitado. ` +
        `Profesionales del servicio: ${nombresProfesionales}`
    );
  }

  /**
   * Obtiene configuración de agendamiento de la organización
   * @private
   */
  static async _obtenerConfiguracion(organizacionId, db) {
    const result = await db.query(
      `SELECT COALESCE(metadata->'agendamiento', '{}'::jsonb) as config
       FROM organizaciones WHERE id = $1`,
      [organizacionId]
    );

    const config = result.rows[0]?.config || {};

    return {
      round_robin_habilitado: config.round_robin_habilitado ?? false,
      verificar_disponibilidad: config.verificar_disponibilidad ?? true,
    };
  }

  /**
   * Obtiene profesionales activos que ofrecen el servicio
   * Ordenados por: orden_rotacion ASC, profesional_id ASC
   * @private
   */
  static async _obtenerProfesionalesServicio(servicioId, organizacionId, db) {
    const result = await db.query(
      `
      SELECT
        p.id,
        p.nombre_completo as nombre,
        sp.orden_rotacion
      FROM profesionales p
      JOIN servicios_profesionales sp ON sp.profesional_id = p.id
      WHERE sp.servicio_id = $1
        AND p.organizacion_id = $2
        AND p.activo = true
        AND sp.activo = true
      ORDER BY sp.orden_rotacion ASC, p.id ASC
    `,
      [servicioId, organizacionId]
    );

    return result.rows;
  }

  /**
   * Obtiene el último profesional asignado para un servicio
   * Fuente de verdad: tabla citas (sin estado adicional)
   * @private
   */
  static async _obtenerUltimoAsignado(servicioId, organizacionId, db) {
    const result = await db.query(
      `
      SELECT c.profesional_id
      FROM citas c
      JOIN citas_servicios cs ON cs.cita_id = c.id AND cs.fecha_cita = c.fecha_cita
      WHERE c.organizacion_id = $1
        AND cs.servicio_id = $2
        AND c.estado NOT IN ('cancelada', 'no_asistio')
      ORDER BY c.creado_en DESC
      LIMIT 1
    `,
      [organizacionId, servicioId]
    );

    return result.rows[0]?.profesional_id || null;
  }

  /**
   * Calcula el índice del siguiente profesional en rotación
   * @private
   */
  static _calcularSiguienteIndex(profesionales, ultimoAsignadoId) {
    if (!ultimoAsignadoId) {
      return 0; // Si no hay historial, empezar desde el primero
    }

    const ultimoIndex = profesionales.findIndex((p) => p.id === ultimoAsignadoId);

    if (ultimoIndex === -1) {
      return 0; // Si el último ya no está activo, reiniciar
    }

    return (ultimoIndex + 1) % profesionales.length;
  }

  /**
   * Verifica disponibilidad de un profesional usando DisponibilidadModel
   * @private
   */
  static async _verificarDisponibilidad({ profesionalId, servicioId, fecha, horaInicio, organizacionId }) {
    try {
      // Normalizar hora a HH:MM
      const horaNormalizada = horaInicio.substring(0, 5);

      const disponibilidad = await DisponibilidadModel.consultarDisponibilidad({
        organizacionId,
        fecha,
        servicioId,
        profesionalId,
        hora: horaNormalizada,
        rangoDias: 1,
        soloDisponibles: true,
        nivelDetalle: 'basico',
      });

      // Verificar si hay al menos un slot disponible para el profesional
      const fechaDisponibilidad = disponibilidad.disponibilidad_por_fecha?.[0];
      if (!fechaDisponibilidad) return false;

      const profesionalDisp = fechaDisponibilidad.profesionales?.find((p) => p.profesional_id === profesionalId);

      return profesionalDisp?.total_slots_disponibles > 0;
    } catch (error) {
      logger.warn('[RoundRobinService._verificarDisponibilidad] Error al verificar', {
        profesional_id: profesionalId,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Actualiza el orden de rotación de profesionales para un servicio
   *
   * @param {number} servicioId - ID del servicio
   * @param {Array<{profesional_id: number, orden: number}>} ordenArray - Array con nuevo orden
   * @param {number} organizacionId - ID de la organización
   * @param {Object} db - Conexión de base de datos
   * @returns {Promise<boolean>} true si se actualizó correctamente
   */
  static async actualizarOrdenProfesionales(servicioId, ordenArray, organizacionId, db) {
    logger.info('[RoundRobinService.actualizarOrdenProfesionales] Actualizando orden', {
      servicio_id: servicioId,
      cantidad: ordenArray.length,
    });

    // Validar que todos los profesionales pertenecen al servicio
    const profesionalesValidos = await this._obtenerProfesionalesServicio(servicioId, organizacionId, db);
    const idsValidos = new Set(profesionalesValidos.map((p) => p.id));

    for (const item of ordenArray) {
      if (!idsValidos.has(item.profesional_id)) {
        throw new Error(`Profesional ID ${item.profesional_id} no está asignado a este servicio`);
      }
    }

    // Actualizar orden para cada profesional
    for (const item of ordenArray) {
      await db.query(
        `
        UPDATE servicios_profesionales
        SET orden_rotacion = $1, actualizado_en = NOW()
        WHERE servicio_id = $2 AND profesional_id = $3 AND organizacion_id = $4
      `,
        [item.orden, servicioId, item.profesional_id, organizacionId]
      );
    }

    logger.info('[RoundRobinService.actualizarOrdenProfesionales] Orden actualizado', {
      servicio_id: servicioId,
      cantidad: ordenArray.length,
    });

    return true;
  }
}

module.exports = RoundRobinService;
