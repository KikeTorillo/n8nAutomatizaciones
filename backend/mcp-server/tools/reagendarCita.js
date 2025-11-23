/**
 * ====================================================================
 * TOOL: REAGENDAR CITA
 * ====================================================================
 *
 * Herramienta MCP para reagendar una cita existente a una nueva fecha/hora.
 * Permite cambiar la fecha y horario de citas en estado 'pendiente' o 'confirmada'.
 *
 * Llamadas al backend:
 * 1. GET /api/v1/citas/:id (verificar que la cita existe y puede reagendarse)
 * 2. POST /api/v1/citas/:id/reagendar (ejecutar el reagendamiento)
 */

const Joi = require('joi');
const { createApiClient } = require('../utils/apiClient');
const logger = require('../utils/logger');
const { normalizarArgumentos } = require('../utils/normalizers');

/**
 * Schema de validación de inputs
 */
const inputSchema = {
  type: 'object',
  properties: {
    cita_id: {
      type: 'number',
      description: 'ID de la cita a reagendar',
    },
    nueva_fecha: {
      type: 'string',
      description: 'Nueva fecha de la cita en formato DD/MM/YYYY',
      pattern: '^\\d{2}/\\d{2}/\\d{4}$',
    },
    nueva_hora: {
      type: 'string',
      description: 'Nueva hora de inicio en formato HH:MM (24 horas)',
      pattern: '^\\d{2}:\\d{2}$',
    },
    motivo: {
      type: 'string',
      description: 'Motivo del reagendamiento (opcional)',
    },
  },
  required: ['cita_id', 'nueva_fecha', 'nueva_hora'],
};

/**
 * Schema Joi para validación estricta
 */
const joiSchema = Joi.object({
  cita_id: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'cita_id debe ser un número',
      'number.positive': 'cita_id debe ser un número positivo',
    }),
  nueva_fecha: Joi.string().pattern(/^\d{2}\/\d{2}\/\d{4}$/).required()
    .messages({
      'string.pattern.base': 'nueva_fecha debe tener formato DD/MM/YYYY',
    }),
  nueva_hora: Joi.string().pattern(/^\d{2}:\d{2}$/).required()
    .messages({
      'string.pattern.base': 'nueva_hora debe tener formato HH:MM',
    }),
  motivo: Joi.string().max(500).optional().allow(null, ''),
});

/**
 * Función principal de ejecución
 * @param {Object} args - Argumentos de la tool
 * @param {string} jwtToken - Token JWT del chatbot para autenticación
 */
async function execute(args, jwtToken) {
  try {
    // Validar que se proporcionó el token
    if (!jwtToken) {
      return {
        success: false,
        message: 'Token JWT no proporcionado. El MCP Server requiere autenticación.',
        data: null,
      };
    }

    // ========== 1. Normalizar inputs ==========
    // Los modelos de IA pueden enviar formatos variados (ej: "14:0" en lugar de "14:00")
    const argsNormalizados = normalizarArgumentos(args, ['nueva_hora'], ['nueva_fecha']);

    // ========== 2. Validar inputs ==========
    const { error, value } = joiSchema.validate(argsNormalizados);

    if (error) {
      logger.warn('Validación fallida en reagendarCita:', error.details);
      return {
        success: false,
        message: `Error de validación: ${error.details[0].message}`,
        data: null,
      };
    }

    // ========== 3. Crear cliente API con token del chatbot ==========
    const apiClient = createApiClient(jwtToken);

    // ========== 3. OBTENER CITA EXISTENTE ==========
    let citaExistente;
    try {
      const response = await apiClient.get(`/api/v1/citas/${value.cita_id}`);
      citaExistente = response.data.data || response.data;

      logger.info(`✅ Cita encontrada: ${citaExistente.codigo_cita} - Estado: ${citaExistente.estado}`);
    } catch (error) {
      logger.error('[reagendarCita] Error obteniendo cita:', error.response?.data || error.message);

      if (error.response?.status === 404) {
        return {
          success: false,
          message: `Cita con ID ${value.cita_id} no encontrada.`,
          data: null,
        };
      }

      return {
        success: false,
        message: `Error al buscar la cita: ${error.response?.data?.error || error.message}`,
        data: null,
      };
    }

    // ========== 4. VALIDAR QUE LA CITA PUEDE REAGENDARSE ==========
    const estadosNoReagendables = ['completada', 'cancelada', 'no_asistio', 'en_curso'];

    if (estadosNoReagendables.includes(citaExistente.estado)) {
      return {
        success: false,
        message: `No se puede reagendar esta cita. Estado actual: ${citaExistente.estado}. Solo se pueden reagendar citas en estado 'pendiente' o 'confirmada'.`,
        data: {
          cita_id: citaExistente.id,
          codigo_cita: citaExistente.codigo_cita,
          estado: citaExistente.estado,
        },
      };
    }

    // ========== 5. OBTENER DURACIÓN TOTAL DE LA CITA ==========
    // Las citas ahora soportan múltiples servicios (relación M:N con citas_servicios)
    // La duración total ya está calculada y guardada en la tabla citas
    let duracionServicio = citaExistente.duracion_total_minutos || 30; // Default: 30 minutos

    logger.info(`✅ Duración total de la cita: ${duracionServicio} minutos`);

    // ========== 6. Convertir fecha DD/MM/YYYY a YYYY-MM-DD para backend ==========
    const [dia, mes, anio] = value.nueva_fecha.split('/');
    const fechaISO = `${anio}-${mes}-${dia}`;

    // Calcular hora_fin sumando duración a hora_inicio
    const [horaNum, minNum] = value.nueva_hora.split(':').map(Number);
    const horaInicio = new Date(2000, 0, 1, horaNum, minNum);
    const horaFin = new Date(horaInicio.getTime() + duracionServicio * 60000);

    const horaInicioStr = `${String(horaInicio.getHours()).padStart(2, '0')}:${String(horaInicio.getMinutes()).padStart(2, '0')}:00`;
    const horaFinStr = `${String(horaFin.getHours()).padStart(2, '0')}:${String(horaFin.getMinutes()).padStart(2, '0')}:00`;

    logger.info(`Nuevo horario calculado: ${horaInicioStr} - ${horaFinStr} (${duracionServicio}min)`);

    // ========== 7. EJECUTAR REAGENDAMIENTO ==========
    try {
      const response = await apiClient.post(`/api/v1/citas/${value.cita_id}/reagendar`, {
        nueva_fecha: fechaISO,
        nueva_hora_inicio: horaInicioStr,
        nueva_hora_fin: horaFinStr,
        motivo_reagenda: value.motivo || 'Reagendado vía chatbot IA',
      });

      const citaReagendada = response.data.data || response.data;

      logger.info(`✅ Cita reagendada exitosamente: ${citaReagendada.codigo_cita}`);

      // ========== 8. Retornar resultado ==========
      return {
        success: true,
        message: `Cita reagendada exitosamente. Nueva fecha: ${value.nueva_fecha} a las ${value.nueva_hora}`,
        data: {
          cita_id: citaReagendada.id,
          codigo_cita: citaReagendada.codigo_cita,
          fecha_anterior: citaExistente.fecha_cita,
          hora_anterior: citaExistente.hora_inicio,
          fecha_nueva: fechaISO,
          hora_nueva: horaInicioStr,
          estado: citaReagendada.estado,
          profesional_id: citaReagendada.profesional_id,
          servicio_id: citaReagendada.servicio_id,
        },
      };

    } catch (error) {
      logger.error('[reagendarCita] Error reagendando cita:', {
        message: error.message,
        response: error.response?.data,
      });

      // Manejar errores del backend
      if (error.response) {
        const { status, data } = error.response;

        if (status === 400) {
          return {
            success: false,
            message: `Error de validación: ${data.error || data.message}`,
            data: null,
          };
        }

        if (status === 409) {
          return {
            success: false,
            message: `Conflicto de horario: ${data.error || 'El nuevo horario ya está ocupado por otra cita'}. Por favor elige otro horario.`,
            data: null,
          };
        }

        if (status === 403) {
          return {
            success: false,
            message: `No autorizado: ${data.error || 'No tienes permiso para reagendar esta cita'}`,
            data: null,
          };
        }

        if (status === 404) {
          return {
            success: false,
            message: `No encontrado: ${data.error || 'Cita no existe'}`,
            data: null,
          };
        }
      }

      // Error genérico
      return {
        success: false,
        message: `Error al reagendar cita: ${error.message}`,
        data: null,
      };
    }

  } catch (error) {
    logger.error('[reagendarCita] Error general:', {
      message: error.message,
      stack: error.stack,
    });

    return {
      success: false,
      message: `Error inesperado al reagendar cita: ${error.message}`,
      data: null,
    };
  }
}

// ====================================================================
// EXPORTS
// ====================================================================

module.exports = {
  name: 'reagendarCita',
  description: 'Reagenda una cita existente a una nueva fecha y hora. Valida que la cita esté en estado reagendable (pendiente o confirmada), verifica disponibilidad del profesional en el nuevo horario, y actualiza la cita. Solo puede reagendar citas que no estén completadas, canceladas o en curso.',
  inputSchema,
  execute,
};
