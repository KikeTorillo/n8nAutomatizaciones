/**
 * ====================================================================
 * TOOL: VERIFICAR DISPONIBILIDAD
 * ====================================================================
 *
 * Herramienta MCP para verificar horarios disponibles en una fecha específica.
 *
 * Llamada al backend: GET /api/v1/disponibilidad
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
    servicio_id: {
      type: 'number',
      description: 'ID del servicio a consultar',
    },
    fecha: {
      type: 'string',
      description: 'Fecha a consultar en formato DD/MM/YYYY',
      pattern: '^\\d{2}/\\d{2}/\\d{4}$',
    },
    profesional_id: {
      type: 'number',
      description: 'ID del profesional a consultar (opcional, si no se especifica busca en todos)',
    },
    hora: {
      type: 'string',
      description: 'Hora específica a consultar en formato HH:MM (opcional)',
      pattern: '^\\d{2}:\\d{2}$',
    },
    duracion: {
      type: 'number',
      description: 'Duración en minutos del servicio (opcional)',
    },
  },
  required: ['servicio_id', 'fecha'],
};

/**
 * Schema Joi para validación estricta
 */
const joiSchema = Joi.object({
  servicio_id: Joi.number().integer().positive().required(),
  fecha: Joi.string().pattern(/^\d{2}\/\d{2}\/\d{4}$/).required()
    .messages({
      'string.pattern.base': 'fecha debe tener formato DD/MM/YYYY',
    }),
  profesional_id: Joi.number().integer().positive().optional(),
  hora: Joi.string().pattern(/^\d{2}:\d{2}$/).optional()
    .messages({
      'string.pattern.base': 'hora debe tener formato HH:MM',
    }),
  duracion: Joi.number().integer().min(10).max(480).optional(),
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
      fecha: fechaISO,
      servicio_id: value.servicio_id,
      solo_disponibles: true, // Solo mostrar slots disponibles
    };

    // Agregar parámetros opcionales si se proporcionan
    if (value.profesional_id) {
      params.profesional_id = value.profesional_id;
    }

    if (value.hora) {
      params.hora = value.hora;
    }

    if (value.duracion) {
      params.duracion = value.duracion;
    }

    logger.info('Consultando disponibilidad:', params);

    // ========== 4. Crear cliente API con token del chatbot ==========
    const apiClient = createApiClient(jwtToken);

    // ========== 5. Llamar al NUEVO endpoint de disponibilidad ==========
    const response = await apiClient.get('/api/v1/disponibilidad', {
      params,
    });

    const data = response.data.data;

    logger.info(`Disponibilidad obtenida para servicio ${value.servicio_id}`);

    // ========== 6. Si se especificó hora, buscar ese slot específico ==========
    if (value.hora) {
      const slotBuscado = this._buscarSlotEspecifico(
        data,
        value.hora,
        value.profesional_id
      );

      return {
        success: true,
        message: slotBuscado.disponible
          ? `Sí, hay disponibilidad el ${value.fecha} a las ${value.hora}${slotBuscado.profesional ? ` con ${slotBuscado.profesional}` : ''}`
          : `No disponible: ${slotBuscado.razon}`,
        data: {
          disponible: slotBuscado.disponible,
          fecha: value.fecha,
          hora: value.hora,
          profesional: slotBuscado.profesional,
          razon: slotBuscado.razon,
        },
      };
    }

    // ========== 7. Si NO se especificó hora, retornar primeros N slots disponibles ==========
    if (data.disponibilidad_por_fecha.length === 0) {
      return {
        success: true,
        message: `No hay disponibilidad para el ${value.fecha}`,
        data: {
          fecha: value.fecha,
          disponible: false,
          profesionales_disponibles: [],
        },
      };
    }

    const fecha = data.disponibilidad_por_fecha[0];
    const profesionalesConSlots = fecha.profesionales.map((prof) => ({
      profesional_id: prof.profesional_id,
      nombre: prof.nombre,
      horarios_disponibles: prof.slots.slice(0, 5).map((s) => s.hora.substring(0, 5)), // Primeros 5 slots, HH:MM
      total_disponibles: prof.total_slots_disponibles,
    }));

    return {
      success: true,
      message: `Disponibilidad consultada para ${value.fecha}. ${fecha.total_slots_disponibles_dia} slots disponibles.`,
      data: {
        fecha: value.fecha,
        disponible: fecha.total_slots_disponibles_dia > 0,
        profesionales_disponibles: profesionalesConSlots,
        total_slots: fecha.total_slots_disponibles_dia,
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
          message: `Servicio con ID ${args.servicio_id} no encontrado`,
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

/**
 * Buscar slot específico en la respuesta de disponibilidad
 */
function _buscarSlotEspecifico(disponibilidad, hora, profesionalId) {
  if (disponibilidad.disponibilidad_por_fecha.length === 0) {
    return {
      disponible: false,
      razon: 'No hay disponibilidad para esta fecha',
      profesional: null,
    };
  }

  const fecha = disponibilidad.disponibilidad_por_fecha[0];
  const horaConSegundos = hora.length === 5 ? `${hora}:00` : hora;

  if (profesionalId) {
    // Buscar en profesional específico
    const prof = fecha.profesionales.find((p) => p.profesional_id === profesionalId);

    if (!prof) {
      return {
        disponible: false,
        razon: 'Profesional no encontrado o no disponible',
        profesional: null,
      };
    }

    const slot = prof.slots.find((s) => s.hora === horaConSegundos);

    return {
      disponible: slot?.disponible || false,
      razon: slot?.razon_no_disponible || 'Horario no encontrado',
      profesional: prof.nombre,
    };
  }

  // Buscar en cualquier profesional disponible
  for (const prof of fecha.profesionales) {
    const slot = prof.slots.find((s) => s.hora === horaConSegundos && s.disponible);
    if (slot) {
      return {
        disponible: true,
        razon: null,
        profesional: prof.nombre,
      };
    }
  }

  return {
    disponible: false,
    razon: 'No hay profesionales disponibles en ese horario',
    profesional: null,
  };
}

// ====================================================================
// EXPORTS
// ====================================================================

module.exports = {
  name: 'verificarDisponibilidad',
  description: 'Verifica los horarios disponibles para un servicio en una fecha específica. Retorna lista de profesionales con horarios disponibles. Puedes consultar un horario específico o ver todos los disponibles.',
  inputSchema,
  execute,
  _buscarSlotEspecifico,
};
