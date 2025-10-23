/**
 * ====================================================================
 * TOOL: CREAR CITA
 * ====================================================================
 *
 * Herramienta MCP para crear una nueva cita en el sistema de agendamiento.
 *
 * Llamada al backend: POST /api/v1/citas
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
    fecha: {
      type: 'string',
      description: 'Fecha de la cita en formato DD/MM/YYYY',
      pattern: '^\\d{2}/\\d{2}/\\d{4}$',
    },
    hora: {
      type: 'string',
      description: 'Hora de la cita en formato HH:MM (24 horas)',
      pattern: '^\\d{2}:\\d{2}$',
    },
    profesional_id: {
      type: 'number',
      description: 'ID del profesional que atenderá la cita',
    },
    servicio_id: {
      type: 'number',
      description: 'ID del servicio a realizar',
    },
    cliente: {
      type: 'object',
      properties: {
        nombre: {
          type: 'string',
          description: 'Nombre completo del cliente',
        },
        telefono: {
          type: 'string',
          description: 'Teléfono del cliente',
        },
        email: {
          type: 'string',
          description: 'Email del cliente (opcional)',
        },
      },
      required: ['nombre', 'telefono'],
    },
    notas: {
      type: 'string',
      description: 'Notas adicionales para la cita (opcional)',
    },
  },
  required: ['fecha', 'hora', 'profesional_id', 'servicio_id', 'cliente'],
};

/**
 * Schema Joi para validación estricta
 */
const joiSchema = Joi.object({
  fecha: Joi.string().pattern(/^\d{2}\/\d{2}\/\d{4}$/).required()
    .messages({
      'string.pattern.base': 'fecha debe tener formato DD/MM/YYYY',
    }),
  hora: Joi.string().pattern(/^\d{2}:\d{2}$/).required()
    .messages({
      'string.pattern.base': 'hora debe tener formato HH:MM',
    }),
  profesional_id: Joi.number().integer().positive().required(),
  servicio_id: Joi.number().integer().positive().required(),
  cliente: Joi.object({
    nombre: Joi.string().min(3).max(255).required(),
    telefono: Joi.string().min(7).max(20).required(),
    email: Joi.string().email().optional().allow(null, ''),
  }).required(),
  notas: Joi.string().max(1000).optional().allow(null, ''),
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
      logger.warn('Validación fallida en crearCita:', error.details);
      return {
        success: false,
        message: `Error de validación: ${error.details[0].message}`,
        data: null,
      };
    }

    // ========== 2. Convertir fecha DD/MM/YYYY a YYYY-MM-DD para backend ==========
    const [dia, mes, anio] = value.fecha.split('/');
    const fechaISO = `${anio}-${mes}-${dia}`;

    // ========== 3. Preparar payload para backend ==========
    const payload = {
      fecha_cita: fechaISO,
      hora_cita: value.hora,
      profesional_id: value.profesional_id,
      servicio_id: value.servicio_id,
      cliente: {
        nombre: value.cliente.nombre,
        telefono: value.cliente.telefono,
        email: value.cliente.email || undefined,
      },
      notas: value.notas || undefined,
    };

    logger.info('Creando cita en backend:', payload);

    // ========== 4. Crear cliente API con token del chatbot ==========
    const apiClient = createApiClient(jwtToken);

    // ========== 5. Llamar al backend API ==========
    const response = await apiClient.post('/api/v1/citas', payload);

    const cita = response.data.data;

    logger.info(`Cita creada exitosamente: ${cita.codigo_cita}`);

    // ========== 5. Retornar resultado ==========
    return {
      success: true,
      message: `Cita creada exitosamente con código ${cita.codigo_cita}`,
      data: {
        cita_id: cita.id,
        codigo_cita: cita.codigo_cita,
        fecha: value.fecha,
        hora: value.hora,
        profesional: cita.profesional_nombre,
        servicio: cita.servicio_nombre,
        cliente: value.cliente.nombre,
        estado: cita.estado,
      },
    };

  } catch (error) {
    logger.error('Error al crear cita:', {
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
          message: `Conflicto: ${data.error || 'El horario ya está ocupado'}`,
          data: null,
        };
      }

      if (status === 404) {
        return {
          success: false,
          message: `No encontrado: ${data.error || 'Profesional o servicio no existe'}`,
          data: null,
        };
      }
    }

    // Error genérico
    return {
      success: false,
      message: `Error al crear cita: ${error.message}`,
      data: null,
    };
  }
}

// ====================================================================
// EXPORTS
// ====================================================================

module.exports = {
  name: 'crearCita',
  description: 'Crea una nueva cita en el sistema de agendamiento. Valida disponibilidad del profesional y crea el registro.',
  inputSchema,
  execute,
};
