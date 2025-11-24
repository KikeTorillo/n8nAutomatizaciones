/**
 * ====================================================================
 * DISPONIBILIDAD MODEL
 * ====================================================================
 *
 * Model para consultar disponibilidad de horarios de profesionales.
 * Reutilizable para: chatbot, frontend admin, portal cliente.
 *
 * OPTIMIZACIÓN CRÍTICA:
 * - Usa batch queries para evitar N+1 (2 queries totales vs miles)
 * - Verificación en memoria de slots (0 queries adicionales)
 *
 * @requires CitaHelpersModel.validarHorarioPermitido (reutilización)
 */

const RLSContextManager = require('../../../utils/rlsContextManager');
const { DateTime } = require('luxon');
const logger = require('../../../utils/logger');
const CitaValidacionUtil = require('../utils/cita-validacion.util');

const DEFAULTS = {
  ZONA_HORARIA: 'America/Mexico_City',
  INTERVALO_MINUTOS: 30,
  RANGO_DIAS_DEFAULT: 1,
  RANGO_DIAS_MAX_CLIENTE: 7,
  RANGO_DIAS_MAX_BOT: 7,
  RANGO_DIAS_MAX_EMPLEADO: 14,
  RANGO_DIAS_MAX_ADMIN: 30,
  RANGO_DIAS_MAX_SUPER_ADMIN: 90,
};

class DisponibilidadModel {
  /**
   * Consulta disponibilidad de slots horarios
   *
   * @param {Object} params
   * @param {number} params.organizacionId - ID de la organización
   * @param {string} params.fecha - Fecha inicial (YYYY-MM-DD, ISO, o "hoy")
   * @param {number} params.servicioId - ID del servicio
   * @param {number} [params.profesionalId] - ID del profesional (opcional)
   * @param {string} [params.hora] - Hora específica HH:MM (opcional)
   * @param {number} [params.duracion] - Duración en minutos (opcional)
   * @param {number} [params.rangoDias=1] - Cantidad de días a consultar
   * @param {number} [params.intervaloMinutos=30] - Intervalo entre slots
   * @param {boolean} [params.soloDisponibles=true] - Filtrar solo disponibles
   * @param {string} [params.nivelDetalle='completo'] - Nivel de detalle: basico|completo|admin
   * @param {number} [params.excluirCitaId] - ID de cita a excluir (para reagendamiento)
   * @returns {Promise<Object>}
   */
  static async consultarDisponibilidad({
    organizacionId,
    fecha,
    servicioId,
    profesionalId = null,
    hora = null,
    duracion = null,
    rangoDias = DEFAULTS.RANGO_DIAS_DEFAULT,
    intervaloMinutos = DEFAULTS.INTERVALO_MINUTOS,
    soloDisponibles = true,
    nivelDetalle = 'completo',
    excluirCitaId = null,
  }) {
    return await RLSContextManager.query(organizacionId, async (db) => {
      logger.info('[DisponibilidadModel.consultarDisponibilidad] Iniciando consulta', {
        fecha,
        servicioId,
        profesionalId,
        hora,
        rangoDias,
        excluirCitaId,
      });

      // ========== 1. Normalizar fecha (soportar "hoy", ISO, YYYY-MM-DD) ==========
      const fechaNormalizada = this._normalizarFecha(fecha);
      const fechaInicio = DateTime.fromISO(fechaNormalizada);
      const fechaFin = fechaInicio.plus({ days: rangoDias - 1 });

      // ========== 2. Obtener servicio ==========
      const servicio = await this._obtenerServicio(servicioId, organizacionId, db);
      if (!servicio) {
        throw new Error('Servicio no encontrado o inactivo');
      }

      const duracionFinal = duracion || servicio.duracion_minutos || DEFAULTS.INTERVALO_MINUTOS;

      // ========== 3. Obtener profesionales que ofrecen el servicio ==========
      const profesionales = await this._obtenerProfesionales(
        servicioId,
        profesionalId,
        organizacionId,
        db
      );

      if (profesionales.length === 0) {
        logger.warn('[DisponibilidadModel] No se encontraron profesionales', {
          servicioId,
          profesionalId,
        });
        return {
          servicio: {
            id: servicio.id,
            nombre: servicio.nombre,
            duracion_minutos: servicio.duracion_minutos,
            precio: servicio.precio,
          },
          disponibilidad_por_fecha: [],
          metadata: {
            total_profesionales: 0,
            rango_fechas: {
              desde: fechaNormalizada,
              hasta: fechaFin.toFormat('yyyy-MM-dd'),
            },
            generado_en: new Date().toISOString(),
          },
        };
      }

      // ========== 4. OPTIMIZACIÓN: Batch query de citas y bloqueos ==========
      const profesionalIds = profesionales.map((p) => p.id);

      // Query 1: Obtener TODAS las citas del rango de fechas de UNA VEZ
      const citasRango = await this._obtenerCitasRango(
        profesionalIds,
        fechaNormalizada,
        fechaFin.toFormat('yyyy-MM-dd'),
        organizacionId,
        db
      );

      // Query 2: Obtener TODOS los bloqueos del rango de fechas de UNA VEZ
      const bloqueosRango = await this._obtenerBloqueosRango(
        profesionalIds,
        fechaNormalizada,
        fechaFin.toFormat('yyyy-MM-dd'),
        organizacionId,
        db
      );

      // ========== 4.5. Filtrar cita excluida (para reagendamiento) ==========
      let citasRangoFiltradas = citasRango;
      if (excluirCitaId) {
        citasRangoFiltradas = citasRango.filter(cita => cita.id !== excluirCitaId);
        logger.debug('[DisponibilidadModel] Cita excluida del análisis', {
          excluir_cita_id: excluirCitaId,
          citas_antes: citasRango.length,
          citas_despues: citasRangoFiltradas.length,
        });
      }

      logger.debug('[DisponibilidadModel] Datos cargados en batch', {
        total_citas: citasRangoFiltradas.length,
        total_bloqueos: bloqueosRango.length,
        profesionales: profesionalIds.length,
        cita_excluida: excluirCitaId || 'ninguna',
      });

      // ========== 5. Por cada día en el rango ==========
      const disponibilidadPorFecha = [];

      for (let i = 0; i < rangoDias; i++) {
        const fechaActual = fechaInicio.plus({ days: i });
        const fechaStr = fechaActual.toFormat('yyyy-MM-dd');
        const diaSemana = fechaActual.weekday === 7 ? 0 : fechaActual.weekday;

        logger.debug('[DisponibilidadModel] Procesando fecha', {
          fecha: fechaStr,
          dia_semana: diaSemana,
        });

        // ========== 6. Por cada profesional ==========
        const profesionalesDisp = [];

        for (const prof of profesionales) {
          // 6.1 Obtener horarios laborales del día
          const horarios = await this._obtenerHorariosLaborales(
            prof.id,
            diaSemana,
            fechaStr,
            organizacionId,
            db
          );

          if (horarios.length === 0) {
            logger.debug('[DisponibilidadModel] Profesional no trabaja este día', {
              profesional_id: prof.id,
              fecha: fechaStr,
              dia_semana: diaSemana,
            });
            continue; // No trabaja este día
          }

          // 6.2 Generar slots cada intervaloMinutos
          const slots = this._generarSlots(horarios, intervaloMinutos, hora);

          if (slots.length === 0) {
            continue; // No hay slots para este horario específico
          }

          // 6.3 ✅ OPTIMIZACIÓN: Verificar disponibilidad EN MEMORIA (sin queries)
          const slotsConDisponibilidad = this._verificarDisponibilidadSlotsEnMemoria(
            slots,
            prof.id,
            fechaStr,
            duracionFinal,
            citasRangoFiltradas,
            bloqueosRango,
            nivelDetalle
          );

          // 6.4 Filtrar solo disponibles si se solicita
          const slotsFiltrados = soloDisponibles
            ? slotsConDisponibilidad.filter((s) => s.disponible)
            : slotsConDisponibilidad;

          if (slotsFiltrados.length > 0 || !soloDisponibles) {
            profesionalesDisp.push({
              profesional_id: prof.id,
              nombre: prof.nombre_completo,
              slots: slotsFiltrados,
              total_slots_disponibles: slotsFiltrados.filter((s) => s.disponible).length,
              horario_laboral: {
                inicio: horarios[0].hora_inicio,
                fin: horarios[horarios.length - 1].hora_fin,
              },
            });
          }
        }

        disponibilidadPorFecha.push({
          fecha: fechaStr,
          dia_semana: fechaActual.toFormat('cccc', { locale: 'es' }).toLowerCase(),
          profesionales: profesionalesDisp,
          total_slots_disponibles_dia: profesionalesDisp.reduce(
            (sum, p) => sum + p.total_slots_disponibles,
            0
          ),
        });
      }

      logger.info('[DisponibilidadModel] Consulta completada', {
        total_fechas: disponibilidadPorFecha.length,
        total_slots: disponibilidadPorFecha.reduce((sum, f) => sum + f.total_slots_disponibles_dia, 0),
      });

      return {
        servicio: {
          id: servicio.id,
          nombre: servicio.nombre,
          duracion_minutos: servicio.duracion_minutos,
          precio: servicio.precio,
        },
        disponibilidad_por_fecha: disponibilidadPorFecha,
        metadata: {
          total_profesionales: profesionales.length,
          rango_fechas: {
            desde: fechaNormalizada,
            hasta: fechaFin.toFormat('yyyy-MM-dd'),
          },
          generado_en: new Date().toISOString(),
        },
      };
    });
  }

  // ====================================================================
  // MÉTODOS PRIVADOS DE OPTIMIZACIÓN
  // ====================================================================

  /**
   * ✅ BATCH QUERY: Obtener todas las citas del rango de UNA VEZ
   * Evita N+1 queries (1 query vs miles)
   */
  static async _obtenerCitasRango(profesionalIds, fechaInicio, fechaFin, organizacionId, db) {
    const resultado = await db.query(
      `
      SELECT
        c.id,
        c.profesional_id,
        c.fecha_cita,
        c.hora_inicio,
        c.hora_fin,
        c.estado,
        c.codigo_cita,
        cl.nombre as cliente_nombre
      FROM citas c
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      WHERE c.profesional_id = ANY($1::int[])
        AND c.fecha_cita BETWEEN $2 AND $3
        AND c.estado NOT IN ('cancelada', 'no_asistio')
        AND c.organizacion_id = $4
      ORDER BY c.fecha_cita, c.hora_inicio
    `,
      [profesionalIds, fechaInicio, fechaFin, organizacionId]
    );

    return resultado.rows;
  }

  /**
   * ✅ BATCH QUERY: Obtener todos los bloqueos del rango de UNA VEZ
   * Evita N+1 queries (1 query vs miles)
   */
  static async _obtenerBloqueosRango(profesionalIds, fechaInicio, fechaFin, organizacionId, db) {
    const resultado = await db.query(
      `
      SELECT
        b.id,
        b.profesional_id,
        b.fecha_inicio,
        b.fecha_fin,
        b.hora_inicio,
        b.hora_fin,
        b.titulo,
        tb.codigo as tipo_bloqueo,
        tb.nombre as tipo_bloqueo_nombre
      FROM bloqueos_horarios b
      LEFT JOIN tipos_bloqueo tb ON b.tipo_bloqueo_id = tb.id
      WHERE b.organizacion_id = $1
        AND b.activo = true
        AND (
          -- Bloqueo organizacional (afecta a todos)
          b.profesional_id IS NULL OR
          -- Bloqueo específico del profesional
          b.profesional_id = ANY($2::int[])
        )
        AND (
          -- El rango de consulta se solapa con el bloqueo
          (b.fecha_inicio <= $4 AND b.fecha_fin >= $3)
        )
    `,
      [organizacionId, profesionalIds, fechaInicio, fechaFin]
    );

    return resultado.rows;
  }

  /**
   * ✅ VERIFICACIÓN EN MEMORIA: 0 queries adicionales
   *
   * Verifica disponibilidad de cada slot consultando arrays en memoria:
   * - citasRango (pre-cargado)
   * - bloqueosRango (pre-cargado)
   *
   * ⚠️ REFACTORIZADO: Usa CitaValidacionUtil para lógica compartida
   *
   * LÓGICA COMPARTIDA:
   * - CitaValidacionUtil.citaSolapaConSlot() - Verificación de conflictos con citas
   * - CitaValidacionUtil.bloqueoAfectaSlot() - Verificación de bloqueos
   * - CitaValidacionUtil.formatearMensajeCita() - Formato de mensajes de citas
   * - CitaValidacionUtil.formatearMensajeBloqueo() - Formato de mensajes de bloqueos
   *
   * Si se modifica la lógica de validación, actualizar también en:
   * - CitaValidacionUtil (funciones compartidas)
   * - CitaHelpersModel.validarHorarioPermitido() (operaciones de escritura)
   *
   * @see backend/app/utils/cita-validacion.util.js
   * @see backend/app/database/citas/cita.helpers.model.js:329
   */
  static _verificarDisponibilidadSlotsEnMemoria(
    slots,
    profesionalId,
    fecha,
    duracion,
    citasRango,
    bloqueosRango,
    nivelDetalle
  ) {
    const slotsConDisponibilidad = [];

    for (const slot of slots) {
      const horaFin = this._calcularHoraFin(slot.hora, duracion);

      const slotInfo = {
        hora: slot.hora,
        disponible: true,
        duracion_disponible: duracion,
        razon_no_disponible: null,
      };

      // ====================================================================
      // Verificación 1: Conflicto con citas existentes
      // ====================================================================
      // ✅ Usar CitaValidacionUtil.citaSolapaConSlot() para lógica compartida
      const citaConflicto = citasRango.find((cita) =>
        CitaValidacionUtil.citaSolapaConSlot(cita, profesionalId, fecha, slot.hora, horaFin)
      );

      if (citaConflicto) {
        slotInfo.disponible = false;

        // ✅ Usar CitaValidacionUtil.formatearMensajeCita() para mensaje consistente
        slotInfo.razon_no_disponible = CitaValidacionUtil.formatearMensajeCita(
          citaConflicto,
          nivelDetalle
        );
        slotInfo.duracion_disponible = 0;

        // Agregar detalles solo para admin
        if (nivelDetalle === 'admin') {
          slotInfo.cita_id = citaConflicto.id;
          slotInfo.cliente_nombre = citaConflicto.cliente_nombre;
        }

        logger.debug('[_verificarDisponibilidadSlotsEnMemoria] Slot bloqueado por cita', {
          slot_hora: slot.hora,
          slot_fin: horaFin,
          cita_hora_inicio: citaConflicto.hora_inicio,
          cita_hora_fin: citaConflicto.hora_fin,
          cita_codigo: citaConflicto.codigo_cita
        });

        slotsConDisponibilidad.push(slotInfo);
        continue;
      }

      // ====================================================================
      // Verificación 2: Bloqueos activos
      // ====================================================================
      // ✅ Usar CitaValidacionUtil.bloqueoAfectaSlot() para lógica compartida
      const bloqueoConflicto = bloqueosRango.find((bloqueo) =>
        CitaValidacionUtil.bloqueoAfectaSlot(bloqueo, profesionalId, fecha, slot.hora, horaFin)
      );

      if (bloqueoConflicto) {
        slotInfo.disponible = false;

        // ✅ Usar CitaValidacionUtil.formatearMensajeBloqueo() para mensaje consistente
        slotInfo.razon_no_disponible = CitaValidacionUtil.formatearMensajeBloqueo(
          bloqueoConflicto,
          nivelDetalle
        );
        slotInfo.duracion_disponible = 0;

        logger.debug('[_verificarDisponibilidadSlotsEnMemoria] Slot bloqueado por bloqueo', {
          slot_hora: slot.hora,
          slot_fin: horaFin,
          bloqueo_hora_inicio: bloqueoConflicto.hora_inicio,
          bloqueo_hora_fin: bloqueoConflicto.hora_fin,
          bloqueo_titulo: bloqueoConflicto.titulo
        });
      }

      slotsConDisponibilidad.push(slotInfo);
    }

    logger.debug('[_verificarDisponibilidadSlotsEnMemoria] Verificación completada', {
      slots_procesados: slots.length,
      slots_resultado: slotsConDisponibilidad.length,
      disponibles: slotsConDisponibilidad.filter(s => s.disponible).length,
      no_disponibles: slotsConDisponibilidad.filter(s => !s.disponible).length
    });

    return slotsConDisponibilidad;
  }

  // ====================================================================
  // MÉTODOS AUXILIARES PRIVADOS
  // ====================================================================

  /**
   * Normalizar fecha a formato YYYY-MM-DD
   * Soporta: "hoy", "mañana", ISO timestamp, YYYY-MM-DD
   */
  static _normalizarFecha(fecha) {
    if (fecha === 'hoy') {
      return DateTime.now().setZone(DEFAULTS.ZONA_HORARIA).toFormat('yyyy-MM-dd');
    }

    if (fecha === 'mañana') {
      return DateTime.now()
        .setZone(DEFAULTS.ZONA_HORARIA)
        .plus({ days: 1 })
        .toFormat('yyyy-MM-dd');
    }

    // Si es ISO con timestamp, extraer solo la fecha
    if (typeof fecha === 'string' && fecha.includes('T')) {
      return fecha.split('T')[0];
    }

    // Si es Date object, convertir a YYYY-MM-DD
    if (fecha instanceof Date) {
      return fecha.toISOString().split('T')[0];
    }

    // Asumir que ya está en formato YYYY-MM-DD
    return fecha;
  }

  /**
   * Obtener información completa del servicio
   */
  static async _obtenerServicio(servicioId, organizacionId, db) {
    const resultado = await db.query(
      `
      SELECT id, nombre, duracion_minutos, precio, activo
      FROM servicios
      WHERE id = $1 AND organizacion_id = $2 AND activo = true
    `,
      [servicioId, organizacionId]
    );

    return resultado.rows[0] || null;
  }

  /**
   * Obtener profesionales que ofrecen el servicio
   */
  static async _obtenerProfesionales(servicioId, profesionalId, organizacionId, db) {
    let query = `
      SELECT DISTINCT
        p.id,
        p.nombre_completo,
        p.activo
      FROM profesionales p
      JOIN servicios_profesionales sp ON sp.profesional_id = p.id
      WHERE sp.servicio_id = $1
        AND p.organizacion_id = $2
        AND p.activo = true
        AND sp.activo = true
    `;

    const params = [servicioId, organizacionId];

    if (profesionalId) {
      query += ' AND p.id = $3';
      params.push(profesionalId);
    }

    query += ' ORDER BY p.nombre_completo';

    const resultado = await db.query(query, params);

    return resultado.rows;
  }

  /**
   * Obtener horarios laborales del profesional para un día específico
   */
  static async _obtenerHorariosLaborales(profesionalId, diaSemana, fecha, organizacionId, db) {
    const resultado = await db.query(
      `
      SELECT
        hp.id,
        hp.dia_semana,
        hp.hora_inicio,
        hp.hora_fin,
        hp.tipo_horario,
        hp.permite_citas,
        hp.nombre_horario
      FROM horarios_profesionales hp
      WHERE hp.profesional_id = $1
        AND hp.organizacion_id = $2
        AND hp.dia_semana = $3
        AND hp.activo = true
        AND hp.permite_citas = true
        AND hp.fecha_inicio <= $4
        AND (hp.fecha_fin IS NULL OR hp.fecha_fin >= $4)
      ORDER BY hp.hora_inicio
    `,
      [profesionalId, organizacionId, diaSemana, fecha]
    );

    return resultado.rows;
  }

  /**
   * Generar slots horarios cada N minutos
   * Si horaEspecifica se proporciona, solo genera ese slot
   */
  static _generarSlots(horarios, intervaloMinutos, horaEspecifica = null) {
    const slots = [];

    for (const horario of horarios) {
      const inicio = DateTime.fromFormat(horario.hora_inicio, 'HH:mm:ss');
      const fin = DateTime.fromFormat(horario.hora_fin, 'HH:mm:ss');

      let actual = inicio;

      while (actual < fin) {
        const horaSlot = actual.toFormat('HH:mm:ss');

        // Si se especificó hora, solo generar ese slot
        if (horaEspecifica) {
          const horaEspecificaConSegundos = horaEspecifica.length === 5 ? `${horaEspecifica}:00` : horaEspecifica;
          if (horaSlot === horaEspecificaConSegundos) {
            slots.push({ hora: horaSlot });
            return slots; // Solo retornar este slot
          }
        } else {
          slots.push({ hora: horaSlot });
        }

        actual = actual.plus({ minutes: intervaloMinutos });
      }
    }

    return slots;
  }

  /**
   * Calcular hora de fin sumando duración
   */
  static _calcularHoraFin(horaInicio, duracionMinutos) {
    const inicio = DateTime.fromFormat(horaInicio, 'HH:mm:ss');
    const fin = inicio.plus({ minutes: duracionMinutos });
    return fin.toFormat('HH:mm:ss');
  }

  // ====================================================================
  // NOTA: Método _formatearRazon() ELIMINADO (código duplicado)
  // Ahora se usa:
  // - CitaValidacionUtil.formatearMensajeCita()
  // - CitaValidacionUtil.formatearMensajeBloqueo()
  // ====================================================================
}

module.exports = DisponibilidadModel;
