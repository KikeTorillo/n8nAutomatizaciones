/**
 * ====================================================================
 * TOOL: VERIFICAR DISPONIBILIDAD
 * ====================================================================
 *
 * Herramienta MCP para verificar horarios disponibles de un profesional
 * en una fecha específica.
 *
 * Llamada al backend: GET /api/v1/citas/disponibilidad
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
    profesional_id: {
      type: 'number',
      description: 'ID del profesional a consultar',
    },
    fecha: {
      type: 'string',
      description: 'Fecha a consultar en formato DD/MM/YYYY',
      pattern: '^\\d{2}/\\d{2}/\\d{4}$',
    },
    duracion: {
      type: 'number',
      description: 'Duración en minutos del servicio (opcional, default: 30)',
      default: 30,
    },
  },
  required: ['profesional_id', 'fecha'],
};

/**
 * Schema Joi para validación estricta
 */
const joiSchema = Joi.object({
  profesional_id: Joi.number().integer().positive().required(),
  fecha: Joi.string().pattern(/^\d{2}\/\d{2}\/\d{4}$/).required()
    .messages({
      'string.pattern.base': 'fecha debe tener formato DD/MM/YYYY',
    }),
  duracion: Joi.number().integer().min(10).max(480).optional().default(30),
});

/**
 * Función principal de ejecución
 * @param {Object} args - Argumentos de la tool
 * @param {string} jwtToken - Token JWT del chatbot para autenticación
 */
async function execute(args, jwtToken) {
  try {
    if (!jwtToken) {
      return {
        success: false,
        message: 'Token JWT no proporcionado',
        data: null,
      };
    }
    // ========== 1. Validar inputs ==========
    const { error, value } = joiSchema.validate(args);

    if (error) {
      logger.warn('Validación fallida en verificarDisponibilidad:', error.details);
      return {
        success: false,
        message: `Error de validación: ${error.details[0].message}`,
        data: null,
      };
    }

    // ========== 2. Convertir fecha DD/MM/YYYY a YYYY-MM-DD ==========
    const [dia, mes, anio] = value.fecha.split('/');
    const fechaISO = `${anio}-${mes}-${dia}`;

    // ========== 3. Preparar parámetros para backend ==========
    const params = {
      profesional_id: value.profesional_id,
      fecha: fechaISO,
      duracion: value.duracion,
    };

    logger.info('Consultando disponibilidad:', params);

    // ========== 4. Crear cliente API con token del chatbot ==========
    const apiClient = createApiClient(jwtToken);

    // ========== 5. Llamar al backend API ==========
    const response = await apiClient.get('/api/v1/citas/disponibilidad', {
      params,
    });

    const data = response.data.data;

    logger.info(`Disponibilidad obtenida para profesional ${value.profesional_id}`);

    // ========== 5. Formatear resultado ==========
    const horariosDisponibles = data.horarios_disponibles
      .filter(slot => slot.disponible)
      .map(slot => slot.hora);

    const horariosOcupados = data.horarios_disponibles
      .filter(slot => !slot.disponible)
      .map(slot => slot.hora);

    return {
      success: true,
      message: `Se encontraron ${horariosDisponibles.length} horarios disponibles para ${value.fecha}`,
      data: {
        fecha: value.fecha,
        profesional: {
          id: data.profesional.id,
          nombre: data.profesional.nombre,
        },
        horarios_disponibles: horariosDisponibles,
        horarios_ocupados: horariosOcupados,
        total_disponibles: horariosDisponibles.length,
        total_ocupados: horariosOcupados.length,
      },
    };

  } catch (error) {
    logger.error('Error al verificar disponibilidad:', {
      message: error.message,
      response: error.response?.data,
    });

    // Manejar errores del backend
    if (error.response) {
      const { status, data } = error.response;

      if (status === 404) {
        return {
          success: false,
          message: `Profesional con ID ${args.profesional_id} no encontrado`,
          data: null,
        };
      }

      if (status === 400) {
        return {
          success: false,
          message: `Error de validación: ${data.error || data.message}`,
          data: null,
        };
      }
    }

    // Error genérico
    return {
      success: false,
      message: `Error al verificar disponibilidad: ${error.message}`,
      data: null,
    };
  }
}

// ====================================================================
// EXPORTS
// ====================================================================

module.exports = {
  name: 'verificarDisponibilidad',
  description: 'Verifica los horarios disponibles de un profesional en una fecha específica. Retorna lista de horarios libres y ocupados.',
  inputSchema,
  execute,
};
