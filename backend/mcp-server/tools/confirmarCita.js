/**
 * ====================================================================
 * TOOL: CONFIRMAR CITA
 * ====================================================================
 *
 * Herramienta MCP para confirmar la asistencia de un cliente a una cita.
 * Cambia el estado de 'pendiente' a 'confirmada' cuando el cliente
 * responde afirmativamente a un recordatorio.
 *
 * USO TÍPICO:
 * 1. Sistema envía recordatorio: "Te recordamos tu cita mañana..."
 * 2. Cliente responde: "SI" o "Confirmo"
 * 3. AI Agent detecta intención de confirmar
 * 4. AI Agent llama a buscarCitasCliente para obtener citas pendientes
 * 5. AI Agent llama a confirmarCita con el ID de la cita
 *
 * Llamadas al backend:
 * 1. PATCH /api/v1/citas/:id/confirmar-asistencia
 */

const Joi = require('joi');
const { createApiClient } = require('../utils/apiClient');
const logger = require('../utils/logger');

/**
 * Schema de validación de inputs para JSON Schema (MCP)
 */
const inputSchema = {
  type: 'object',
  properties: {
    cita_id: {
      type: 'number',
      description: 'ID de la cita a confirmar. Obtener primero con buscarCitasCliente.',
    },
  },
  required: ['cita_id'],
};

/**
 * Schema Joi para validación estricta en servidor
 */
const joiSchema = Joi.object({
  cita_id: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'cita_id debe ser un número',
      'number.positive': 'cita_id debe ser un número positivo',
      'any.required': 'cita_id es requerido',
    }),
});

/**
 * Función principal de ejecución
 * @param {Object} args - Argumentos de la tool
 * @param {string} jwtToken - Token JWT del chatbot para autenticación
 */
async function execute(args, jwtToken) {
  try {
    // ========== 1. Validar token JWT ==========
    if (!jwtToken) {
      return {
        success: false,
        message: 'Token JWT no proporcionado. El MCP Server requiere autenticación.',
        data: null,
      };
    }

    // ========== 2. Validar inputs con Joi ==========
    const { error, value } = joiSchema.validate(args);

    if (error) {
      logger.warn('[confirmarCita] Validación fallida:', error.details);
      return {
        success: false,
        message: `Error de validación: ${error.details[0].message}`,
        data: null,
      };
    }

    // ========== 3. Crear cliente API con token del chatbot ==========
    const apiClient = createApiClient(jwtToken);

    // ========== 4. Llamar al endpoint de confirmación ==========
    try {
      const response = await apiClient.patch(
        `/api/v1/citas/${value.cita_id}/confirmar-asistencia`,
        {}
      );

      const citaConfirmada = response.data.data || response.data;

      logger.info(`✅ Cita ${value.cita_id} confirmada exitosamente: ${citaConfirmada.codigo_cita}`);

      // ========== 5. Retornar resultado exitoso ==========
      return {
        success: true,
        message: 'Cita confirmada exitosamente. El cliente ha confirmado su asistencia.',
        data: {
          cita_id: citaConfirmada.id || value.cita_id,
          codigo_cita: citaConfirmada.codigo_cita,
          estado: 'confirmada',
          fecha_cita: citaConfirmada.fecha_cita,
          hora_inicio: citaConfirmada.hora_inicio,
          cliente_nombre: citaConfirmada.cliente?.nombre || citaConfirmada.cliente_nombre,
          profesional_nombre: citaConfirmada.profesional?.nombre || citaConfirmada.profesional_nombre,
          confirmada_en: new Date().toISOString(),
        },
      };

    } catch (error) {
      logger.error('[confirmarCita] Error al confirmar:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      // Manejar errores específicos del backend
      if (error.response) {
        const { status, data } = error.response;

        if (status === 400) {
          // La cita no puede confirmarse (ya confirmada, completada, etc.)
          return {
            success: false,
            message: data.error || data.mensaje || 'No se puede confirmar esta cita. Verifica que esté en estado pendiente.',
            data: null,
          };
        }

        if (status === 404) {
          return {
            success: false,
            message: `Cita con ID ${value.cita_id} no encontrada. Verifica el ID e intenta de nuevo.`,
            data: null,
          };
        }

        if (status === 403) {
          return {
            success: false,
            message: 'No tienes permiso para confirmar esta cita.',
            data: null,
          };
        }

        if (status === 409) {
          return {
            success: false,
            message: data.error || 'La cita ya fue confirmada anteriormente.',
            data: null,
          };
        }
      }

      // Error genérico
      return {
        success: false,
        message: `Error al confirmar cita: ${error.message}`,
        data: null,
      };
    }

  } catch (error) {
    logger.error('[confirmarCita] Error general:', {
      message: error.message,
      stack: error.stack,
    });

    return {
      success: false,
      message: `Error inesperado al confirmar cita: ${error.message}`,
      data: null,
    };
  }
}

// ====================================================================
// EXPORTS
// ====================================================================

module.exports = {
  name: 'confirmarCita',
  description: 'Confirma la asistencia del cliente a una cita. Cambia el estado de "pendiente" a "confirmada". Usar cuando el cliente responde afirmativamente a un recordatorio (por ejemplo: "sí", "confirmo", "ahí estaré"). Primero usar buscarCitasCliente para obtener el ID de la cita pendiente del cliente, luego usar esta herramienta para confirmarla.',
  inputSchema,
  execute,
};
