/**
 * ====================================================================
 * TOOL: BUSCAR CITAS DEL CLIENTE
 * ====================================================================
 *
 * Herramienta MCP para buscar citas de un cliente por su teléfono.
 * Útil para reagendar citas cuando el cliente no conoce el ID o código.
 *
 * Llamadas al backend:
 * 1. GET /api/v1/clientes/buscar-telefono (buscar cliente por teléfono)
 * 2. GET /api/v1/citas?cliente_id=X (listar citas del cliente)
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
    telefono: {
      type: 'string',
      description: 'Teléfono del cliente (10 dígitos) - OPCIONAL si se proporciona sender',
    },
    sender: {
      type: 'string',
      description: 'ID del remitente (telegram_chat_id o whatsapp_phone). Obtenido automáticamente del workflow n8n.',
    },
    estado: {
      type: 'string',
      description: 'Filtrar por estado: pendiente, confirmada, completada, cancelada, en_curso, no_asistio',
      enum: ['pendiente', 'confirmada', 'en_curso', 'completada', 'cancelada', 'no_asistio'],
    },
    incluir_pasadas: {
      type: 'boolean',
      description: 'Si es false, solo muestra citas futuras. Default: false',
    },
  },
  required: [], // Ya no es requerido telefono, puede ser sender
};

/**
 * Schema Joi para validación estricta
 */
const joiSchema = Joi.object({
  telefono: Joi.string().min(10).max(15).optional()
    .messages({
      'string.min': 'El teléfono debe tener al menos 10 dígitos',
      'string.max': 'El teléfono no puede tener más de 15 dígitos',
    }),
  sender: Joi.string().optional(),
  estado: Joi.string()
    .valid('pendiente', 'confirmada', 'en_curso', 'completada', 'cancelada', 'no_asistio')
    .optional(),
  incluir_pasadas: Joi.boolean().default(false),
}).or('telefono', 'sender'); // Al menos uno debe estar presente

/**
 * Detectar plataforma basándose en el formato del sender
 * @param {string} sender - ID del remitente
 * @returns {string|null} - 'telegram', 'whatsapp' o null
 */
function detectPlatform(sender) {
  if (!sender || typeof sender !== 'string') return null;

  // Solo dígitos
  if (!/^\d+$/.test(sender)) return null;

  // Telegram: 9-10 dígitos típicamente
  if (sender.length <= 10) return 'telegram';

  // WhatsApp: 11-15 dígitos (código país + número)
  if (sender.length >= 11 && sender.length <= 15) return 'whatsapp';

  return null;
}

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
      logger.warn('Validación fallida en buscarCitasCliente:', error.details);
      return {
        success: false,
        message: `Error de validación: ${error.details[0].message}`,
        data: null,
      };
    }

    // ========== 2. Crear cliente API con token del chatbot ==========
    const apiClient = createApiClient(jwtToken);

    // ========== 3. BUSCAR CLIENTE (por sender o teléfono) ==========
    let cliente;
    let tipoBusqueda = 'telefono';
    let valorBusqueda = value.telefono;

    // Priorizar sender si está disponible
    if (value.sender) {
      const platform = detectPlatform(value.sender);

      if (platform === 'telegram') {
        tipoBusqueda = 'telegram_chat_id';
        valorBusqueda = value.sender;
        logger.debug(`🔍 Buscando cliente por Telegram chat_id: ${value.sender}`);
      } else if (platform === 'whatsapp') {
        tipoBusqueda = 'whatsapp_phone';
        valorBusqueda = value.sender;
        logger.debug(`🔍 Buscando cliente por WhatsApp phone: ${value.sender}`);
      }
    } else if (value.telefono) {
      valorBusqueda = value.telefono.replace(/[\s\-\(\)]/g, '');
      logger.debug(`🔍 Buscando cliente por teléfono tradicional: ${valorBusqueda}`);
    }

    try {
      const response = await apiClient.get('/api/v1/clientes/buscar', {
        params: {
          q: valorBusqueda,
          tipo: tipoBusqueda,
          limit: 1,
        },
      });

      const clientes = response.data.data;

      if (!clientes || clientes.length === 0) {
        return {
          success: false,
          message: `No se encontró ningún cliente con el identificador proporcionado`,
          data: null,
        };
      }

      cliente = clientes[0];

      logger.info(`✅ Cliente encontrado: ${cliente.nombre} (ID: ${cliente.id})`);
    } catch (error) {
      logger.error('[buscarCitasCliente] Error buscando cliente:', error.response?.data || error.message);

      if (error.response?.status === 404) {
        return {
          success: false,
          message: `No se encontró ningún cliente con el identificador proporcionado`,
          data: null,
        };
      }

      return {
        success: false,
        message: `Error al buscar cliente: ${error.response?.data?.error || error.message}`,
        data: null,
      };
    }

    // ========== 4. BUSCAR CITAS DEL CLIENTE ==========
    try {
      const params = {
        cliente_id: cliente.id,
        limit: 50, // Máximo 50 citas
        orden: 'fecha_cita',
        direccion: 'DESC', // Más recientes primero
      };

      // Filtrar por estado si se especificó
      if (value.estado) {
        params.estado = value.estado;
      }

      // Si NO incluir pasadas, filtrar por fecha desde hoy
      if (!value.incluir_pasadas) {
        const hoy = new Date().toISOString().split('T')[0];
        params.fecha_desde = hoy;
      }

      const response = await apiClient.get('/api/v1/citas', { params });

      const citas = response.data.data?.citas || response.data.data || [];

      logger.info(`✅ Se encontraron ${citas.length} citas para el cliente ${cliente.nombre}`);

      // ========== 5. Formatear respuesta para el bot ==========
      if (citas.length === 0) {
        const mensajeEstado = value.estado ? ` en estado "${value.estado}"` : '';
        const mensajeTiempo = value.incluir_pasadas ? '' : ' futuras';

        return {
          success: true,
          message: `El cliente ${cliente.nombre} no tiene citas${mensajeTiempo}${mensajeEstado}`,
          data: {
            cliente_id: cliente.id,
            cliente_nombre: cliente.nombre,
            cliente_telefono: cliente.telefono,
            citas: [],
            total_citas: 0,
          },
        };
      }

      // Formatear citas para mostrar información relevante
      const citasFormateadas = citas.map((cita) => {
        // Convertir fecha ISO a DD/MM/YYYY
        const fecha = new Date(cita.fecha_cita);
        const fechaFormateada = `${String(fecha.getDate()).padStart(2, '0')}/${String(fecha.getMonth() + 1).padStart(2, '0')}/${fecha.getFullYear()}`;

        // Extraer hora (HH:MM)
        const horaFormateada = cita.hora_inicio.substring(0, 5);

        return {
          cita_id: cita.id,
          codigo_cita: cita.codigo_cita,
          fecha: fechaFormateada,
          hora: horaFormateada,
          profesional: cita.profesional_nombre || 'No asignado',
          profesional_id: cita.profesional_id,
          servicio: cita.servicio_nombre || 'No especificado',
          estado: cita.estado,
          puede_reagendar: ['pendiente', 'confirmada'].includes(cita.estado),
        };
      });

      // Contar citas reagendables
      const citasReagendables = citasFormateadas.filter((c) => c.puede_reagendar);

      const nombreCliente = cliente.nombre || 'Cliente';

      return {
        success: true,
        message: `Se encontraron ${citas.length} cita(s) para ${nombreCliente}. ${citasReagendables.length} pueden reagendarse.`,
        data: {
          cliente_id: cliente.id,
          cliente_nombre: cliente.nombre,
          cliente_telefono: cliente.telefono,
          citas: citasFormateadas,
          total_citas: citas.length,
          total_reagendables: citasReagendables.length,
        },
      };

    } catch (error) {
      logger.error('[buscarCitasCliente] Error obteniendo citas:', {
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
            message: 'No se encontraron citas',
            data: null,
          };
        }
      }

      // Error genérico
      return {
        success: false,
        message: `Error al buscar citas: ${error.message}`,
        data: null,
      };
    }

  } catch (error) {
    logger.error('[buscarCitasCliente] Error general:', {
      message: error.message,
      stack: error.stack,
    });

    return {
      success: false,
      message: `Error inesperado al buscar citas: ${error.message}`,
      data: null,
    };
  }
}

// ====================================================================
// EXPORTS
// ====================================================================

module.exports = {
  name: 'buscarCitasCliente',
  description: 'Busca todas las citas de un cliente automáticamente usando su identificador de plataforma (Telegram/WhatsApp). NO requiere teléfono si el cliente está escribiendo desde el bot. Retorna lista de citas con ID, código, fecha, hora, profesional y estado. Útil para reagendar cuando el cliente no conoce el código de su cita. Puede filtrar por estado (pendiente, confirmada, etc.) y excluir citas pasadas.',
  inputSchema,
  execute,
};
