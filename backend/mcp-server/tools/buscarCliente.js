/**
 * ====================================================================
 * TOOL: BUSCAR CLIENTE
 * ====================================================================
 *
 * Herramienta MCP para buscar un cliente existente por teléfono o nombre.
 * Útil para evitar duplicados antes de crear una cita.
 *
 * Llamada al backend: GET /api/v1/clientes/buscar
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
    busqueda: {
      type: 'string',
      description: 'Término de búsqueda (teléfono o nombre del cliente)',
    },
    tipo: {
      type: 'string',
      description: 'Tipo de búsqueda: telefono, nombre, telegram_chat_id, whatsapp_phone (opcional, auto-detect)',
      enum: ['telefono', 'nombre', 'telegram_chat_id', 'whatsapp_phone', 'auto'],
      default: 'auto',
    },
    sender: {
      type: 'string',
      description: 'ID del remitente del mensaje (telegram_chat_id o whatsapp_phone). Obtenido automáticamente del workflow n8n.',
    },
  },
  required: ['busqueda'],
};

/**
 * Schema Joi para validación estricta
 */
const joiSchema = Joi.object({
  busqueda: Joi.string().min(3).max(255).required()
    .messages({
      'string.min': 'busqueda debe tener al menos 3 caracteres',
    }),
  tipo: Joi.string().valid('telefono', 'nombre', 'telegram_chat_id', 'whatsapp_phone', 'auto').optional().default('auto'),
  sender: Joi.string().optional(),
});

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
 * Auto-detectar tipo de búsqueda
 */
function detectarTipoBusqueda(busqueda) {
  // Si contiene solo dígitos, espacios, guiones o paréntesis → teléfono
  const telefonoRegex = /^[\d\s\-()]+$/;
  if (telefonoRegex.test(busqueda)) {
    return 'telefono';
  }
  return 'nombre';
}

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
      logger.warn('Validación fallida en buscarCliente:', error.details);
      return {
        success: false,
        message: `Error de validación: ${error.details[0].message}`,
        data: null,
      };
    }

    // ========== 2. Detectar plataforma si tenemos sender ==========
    let tipoBusqueda = value.tipo;
    let busquedaValue = value.busqueda;

    if (value.sender && tipoBusqueda === 'auto') {
      const platform = detectPlatform(value.sender);

      if (platform === 'telegram') {
        tipoBusqueda = 'telegram_chat_id';
        busquedaValue = value.sender;
        logger.debug(`Plataforma detectada: Telegram (sender: ${value.sender})`);
      } else if (platform === 'whatsapp') {
        tipoBusqueda = 'whatsapp_phone';
        busquedaValue = value.sender;
        logger.debug(`Plataforma detectada: WhatsApp (sender: ${value.sender})`);
      } else {
        // Fallback: auto-detectar tipo tradicional
        tipoBusqueda = detectarTipoBusqueda(value.busqueda);
        logger.debug(`Tipo de búsqueda auto-detectado (tradicional): ${tipoBusqueda}`);
      }
    } else if (tipoBusqueda === 'auto') {
      // Sin sender: auto-detectar tipo tradicional
      tipoBusqueda = detectarTipoBusqueda(value.busqueda);
      logger.debug(`Tipo de búsqueda auto-detectado: ${tipoBusqueda}`);
    }

    // ========== 3. Preparar parámetros para backend ==========
    // ✅ FIX Bug #3: El endpoint /api/v1/clientes/buscar espera 'q', no 'busqueda'
    const params = {
      q: busquedaValue,
      tipo: tipoBusqueda, // Enviar tipo explícito al backend
      limit: 10,
    };

    logger.info('Buscando cliente:', { query: busquedaValue, tipo: tipoBusqueda, sender: value.sender || 'N/A' });

    // ========== 4. Crear cliente API con token del chatbot ==========
    const apiClient = createApiClient(jwtToken);

    // ========== 5. Llamar al backend API ==========
    const response = await apiClient.get('/api/v1/clientes/buscar', {
      params,
    });

    const clientes = response.data.data;

    // ========== 5. Formatear resultado ==========
    if (clientes.length === 0) {
      return {
        success: true,
        message: 'No se encontraron clientes con ese criterio',
        data: {
          encontrado: false,
          clientes: [],
          total: 0,
        },
      };
    }

    const clientesFormateados = clientes.map(cliente => ({
      id: cliente.id,
      nombre: cliente.nombre,
      telefono: cliente.telefono,
      telegram_chat_id: cliente.telegram_chat_id,
      whatsapp_phone: cliente.whatsapp_phone,
      email: cliente.email,
      ultima_cita: cliente.ultima_cita ? {
        fecha: cliente.ultima_cita.fecha_cita,
        servicio: cliente.ultima_cita.servicio_nombre,
      } : null,
      total_citas: cliente.total_citas || 0,
    }));

    return {
      success: true,
      message: `Se encontraron ${clientesFormateados.length} cliente(s)`,
      data: {
        encontrado: true,
        clientes: clientesFormateados,
        total: clientesFormateados.length,
      },
    };

  } catch (error) {
    logger.error('Error al buscar cliente:', {
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
        // En este caso, 404 no es error, simplemente no hay resultados
        return {
          success: true,
          message: 'No se encontraron clientes',
          data: {
            encontrado: false,
            clientes: [],
            total: 0,
          },
        };
      }
    }

    // Error genérico
    return {
      success: false,
      message: `Error al buscar cliente: ${error.message}`,
      data: null,
    };
  }
}

// ====================================================================
// EXPORTS
// ====================================================================

module.exports = {
  name: 'buscarCliente',
  description: 'Busca un cliente existente por teléfono o nombre. Retorna información del cliente y su historial de citas.',
  inputSchema,
  execute,
};
