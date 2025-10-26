/**
 * ====================================================================
 * TOOL: CREAR CITA
 * ====================================================================
 *
 * Herramienta MCP para crear una nueva cita en el sistema de agendamiento.
 * MEJORA CRÍTICA: Busca/crea cliente automáticamente antes de crear la cita.
 *
 * Llamada al backend:
 * 1. GET /api/v1/clientes/buscar-telefono (buscar cliente)
 * 2. POST /api/v1/clientes (crear cliente si no existe)
 * 3. POST /api/v1/citas (crear cita con cliente_id)
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

    // ========== 2. Crear cliente API con token del chatbot ==========
    const apiClient = createApiClient(jwtToken);

    // ========== 3. BUSCAR CLIENTE POR TELÉFONO ==========
    let clienteId = null;

    if (value.cliente.telefono) {
      logger.info('[crearCita] Buscando cliente por teléfono:', value.cliente.telefono);

      try {
        const busqueda = await apiClient.get('/api/v1/clientes/buscar-telefono', {
          params: { telefono: value.cliente.telefono },
        });

        // ✅ FIX: La respuesta es {data: {encontrado: true, cliente: {...}}}
        if (busqueda.data.data?.encontrado && busqueda.data.data.cliente) {
          clienteId = busqueda.data.data.cliente.id;
          logger.info(`✅ Cliente existente encontrado: ${clienteId} - ${busqueda.data.data.cliente.nombre}`);
        }
      } catch (error) {
        logger.warn('[crearCita] Error buscando cliente:', error.response?.data || error.message);
        // Continuar para crear nuevo cliente
      }
    }

    // ========== 4. VALIDAR SERVICIO PRIMERO (antes de crear cliente) ==========
    // ✅ FIX Bug #2: Evita crear clientes huérfanos si el servicio no existe
    let duracionServicio = 30; // Default: 30 minutos

    try {
      const servicio = await apiClient.get(`/api/v1/servicios/${value.servicio_id}`);
      duracionServicio = servicio.data.data.duracion_minutos || 30;
      logger.info(`✅ Servicio ${value.servicio_id} validado: ${servicio.data.data.nombre} (${duracionServicio}min)`);
    } catch (error) {
      logger.error('[crearCita] Servicio no encontrado:', error.response?.data || error.message);
      return {
        success: false,
        message: `Servicio no encontrado o inactivo. Por favor verifica el servicio_id: ${value.servicio_id}`,
        data: null,
      };
    }

    // ========== 5. SI NO EXISTE CLIENTE, CREAR AUTOMÁTICAMENTE ==========
    // Ahora es seguro crear el cliente porque el servicio existe
    if (!clienteId) {
      logger.info('[crearCita] Cliente no encontrado. Creando nuevo cliente...');

      try {
        const nuevoCliente = await apiClient.post('/api/v1/clientes', {
          nombre: value.cliente.nombre,
          telefono: value.cliente.telefono || null,
          email: value.cliente.email || null,
          notas_especiales: 'Cliente creado automáticamente vía chatbot IA',
        });

        clienteId = nuevoCliente.data.data.id;
        logger.info(`✅ Cliente creado automáticamente: ${clienteId} - ${value.cliente.nombre}`);
      } catch (error) {
        logger.error('[crearCita] Error creando cliente:', error.response?.data || error.message);
        return {
          success: false,
          message: `Error al crear el cliente: ${error.response?.data?.error || error.message}`,
          data: null,
        };
      }
    }

    // ========== 6. Convertir fecha DD/MM/YYYY a YYYY-MM-DD para backend ==========
    const [dia, mes, anio] = value.fecha.split('/');
    const fechaISO = `${anio}-${mes}-${dia}`;

    // Calcular hora_fin sumando duración a hora_inicio
    const [horaNum, minNum] = value.hora.split(':').map(Number);
    const horaInicio = new Date(2000, 0, 1, horaNum, minNum);
    const horaFin = new Date(horaInicio.getTime() + duracionServicio * 60000);

    const horaFinStr = `${String(horaFin.getHours()).padStart(2, '0')}:${String(horaFin.getMinutes()).padStart(2, '0')}`;

    logger.info(`Horario calculado: ${value.hora} - ${horaFinStr} (${duracionServicio}min)`);

    // ========== 7. CREAR CITA CON cliente_id OBTENIDO ==========
    try {
      const cita = await apiClient.post('/api/v1/citas', {
        cliente_id: clienteId,  // ✅ Ya tenemos el ID (existente o creado)
        profesional_id: value.profesional_id,
        servicio_id: value.servicio_id,
        fecha_cita: fechaISO,
        hora_inicio: value.hora,      // ✅ HH:MM format
        hora_fin: horaFinStr,          // ✅ Calculado con duración del servicio
        notas_cliente: value.notas || `Cita creada vía chatbot para ${value.cliente.nombre}`,
      });

      logger.info(`✅ Cita creada exitosamente: ${cita.data.data.codigo_cita}`);

      // ========== 8. Retornar resultado ==========
      return {
        success: true,
        message: `Cita agendada exitosamente. Código de confirmación: ${cita.data.data.codigo_cita}`,
        data: {
          cita_id: cita.data.data.id,
          codigo_cita: cita.data.data.codigo_cita,
          fecha: value.fecha,
          hora: value.hora,
          cliente: value.cliente.nombre,
          profesional_id: cita.data.data.profesional_id,
          servicio_id: cita.data.data.servicio_id,
          estado: cita.data.data.estado,
        },
      };

    } catch (error) {
      logger.error('[crearCita] Error creando cita:', {
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

  } catch (error) {
    logger.error('[crearCita] Error general:', {
      message: error.message,
      stack: error.stack,
    });

    return {
      success: false,
      message: `Error inesperado al crear cita: ${error.message}`,
      data: null,
    };
  }
}

// ====================================================================
// EXPORTS
// ====================================================================

module.exports = {
  name: 'crearCita',
  description: 'Crea una nueva cita en el sistema de agendamiento. Busca el cliente por teléfono automáticamente, y si no existe lo crea. Valida disponibilidad del profesional y crea el registro de cita.',
  inputSchema,
  execute,
};
