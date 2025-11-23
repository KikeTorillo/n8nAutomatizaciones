/**
 * ====================================================================
 * TOOL: MODIFICAR SERVICIOS DE CITA
 * ====================================================================
 *
 * Herramienta MCP para modificar los servicios de una cita existente.
 * Permite cambiar servicios en citas con estado 'pendiente' o 'confirmada'.
 *
 * Llamadas al backend:
 * 1. GET /api/v1/citas/:id (verificar que la cita existe y puede modificarse)
 * 2. PUT /api/v1/citas/:id (actualizar servicios)
 */

const Joi = require('joi');
const { createApiClient } = require('../utils/apiClient');
const logger = require('../utils/logger');

/**
 * Schema de validación de inputs
 */
const inputSchema = {
  type: 'object',
  properties: {
    cita_id: {
      type: 'number',
      description: 'ID de la cita a modificar',
    },
    servicios_ids: {
      type: 'array',
      description: 'IDs de los nuevos servicios (pueden ser uno o varios)',
      items: {
        type: 'number',
      },
      minItems: 1,
      maxItems: 10,
    },
    motivo: {
      type: 'string',
      description: 'Motivo del cambio de servicios (opcional)',
    },
  },
  required: ['cita_id', 'servicios_ids'],
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
  servicios_ids: Joi.array().items(Joi.number().integer().positive()).min(1).max(10).required()
    .messages({
      'array.base': 'servicios_ids debe ser un array',
      'array.min': 'Debe haber al menos 1 servicio',
      'array.max': 'No se pueden agregar más de 10 servicios',
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

    // ========== 1. Validar inputs ==========
    const { error, value } = joiSchema.validate(args);

    if (error) {
      logger.warn('Validación fallida en modificarServiciosCita:', error.details);
      return {
        success: false,
        message: `Error de validación: ${error.details[0].message}`,
        data: null,
      };
    }

    // ========== 2. Crear cliente API con token del chatbot ==========
    const apiClient = createApiClient(jwtToken);

    // ========== 3. OBTENER CITA EXISTENTE ==========
    let citaExistente;
    try {
      const response = await apiClient.get(`/api/v1/citas/${value.cita_id}`);
      citaExistente = response.data.data || response.data;

      logger.info(`✅ Cita encontrada: ${citaExistente.codigo_cita} - Estado: ${citaExistente.estado}`);
    } catch (error) {
      logger.error('[modificarServiciosCita] Error obteniendo cita:', error.response?.data || error.message);

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

    // ========== 4. VALIDAR QUE LA CITA PUEDE MODIFICARSE ==========
    const estadosNoModificables = ['completada', 'cancelada', 'no_asistio'];

    if (estadosNoModificables.includes(citaExistente.estado)) {
      return {
        success: false,
        message: `No se pueden modificar los servicios de esta cita. Estado actual: ${citaExistente.estado}. Solo se pueden modificar citas en estado 'pendiente', 'confirmada' o 'en_curso'.`,
        data: {
          cita_id: citaExistente.id,
          codigo_cita: citaExistente.codigo_cita,
          estado: citaExistente.estado,
        },
      };
    }

    // ========== 5. ACTUALIZAR SERVICIOS ==========
    try {
      // Preparar body para actualización
      const updateBody = {
        servicios_ids: value.servicios_ids,
      };

      // Agregar motivo a notas si se proporcionó
      if (value.motivo) {
        const notasActuales = citaExistente.notas_internas || '';
        updateBody.notas_internas = notasActuales
          ? `${notasActuales}\n[Modificación de servicios via chatbot]: ${value.motivo}`.trim()
          : `[Modificación de servicios via chatbot]: ${value.motivo}`;
      }

      const response = await apiClient.put(`/api/v1/citas/${value.cita_id}`, updateBody);

      const citaActualizada = response.data.data || response.data;

      logger.info(`✅ Servicios modificados exitosamente en cita: ${citaActualizada.codigo_cita}`);

      // ========== 6. Retornar resultado ==========
      return {
        success: true,
        message: `Servicios de la cita modificados exitosamente. Código: ${citaActualizada.codigo_cita}`,
        data: {
          cita_id: citaActualizada.id,
          codigo_cita: citaActualizada.codigo_cita,
          servicios_anteriores: citaExistente.servicios || [],
          servicios_nuevos: citaActualizada.servicios || [],
          precio_anterior: citaExistente.precio_total,
          precio_nuevo: citaActualizada.precio_total,
          duracion_anterior_minutos: citaExistente.duracion_total_minutos,
          duracion_nueva_minutos: citaActualizada.duracion_total_minutos,
          estado: citaActualizada.estado,
          fecha: citaActualizada.fecha_cita,
          hora_inicio: citaActualizada.hora_inicio,
          hora_fin: citaActualizada.hora_fin,
        },
      };

    } catch (error) {
      logger.error('[modificarServiciosCita] Error modificando servicios:', {
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

        if (status === 404) {
          return {
            success: false,
            message: `No encontrado: ${data.error || 'Cita o servicios no existen'}`,
            data: null,
          };
        }

        if (status === 403) {
          return {
            success: false,
            message: `No autorizado: ${data.error || 'No tienes permiso para modificar esta cita'}`,
            data: null,
          };
        }

        if (status === 409) {
          return {
            success: false,
            message: `Conflicto de horario: ${data.error || 'Los nuevos servicios exceden la duración del horario actual'}. Considera reagendar la cita primero con verificarDisponibilidad.`,
            data: null,
          };
        }
      }

      // Error genérico
      return {
        success: false,
        message: `Error al modificar servicios: ${error.message}`,
        data: null,
      };
    }

  } catch (error) {
    logger.error('[modificarServiciosCita] Error general:', {
      message: error.message,
      stack: error.stack,
    });

    return {
      success: false,
      message: `Error inesperado al modificar servicios: ${error.message}`,
      data: null,
    };
  }
}

// ====================================================================
// EXPORTS
// ====================================================================

module.exports = {
  name: 'modificarServiciosCita',
  description: 'Modifica los servicios de una cita existente. Permite cambiar a uno o varios servicios diferentes, recalculando automáticamente precio y duración total. Valida que la cita esté en estado modificable (pendiente, confirmada o en_curso). IMPORTANTE: Si los nuevos servicios tienen duración mayor que el horario actual, puede generar un error de conflicto - en ese caso verifica disponibilidad primero y reagenda la cita con el nuevo horario necesario.',
  inputSchema,
  execute,
};
