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
      description: 'Tipo de búsqueda: telefono o nombre (opcional, auto-detect)',
      enum: ['telefono', 'nombre', 'auto'],
      default: 'auto',
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
  tipo: Joi.string().valid('telefono', 'nombre', 'auto').optional().default('auto'),
});

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

    // ========== 2. Auto-detectar tipo si es necesario ==========
    let tipoBusqueda = value.tipo;
    if (tipoBusqueda === 'auto') {
      tipoBusqueda = detectarTipoBusqueda(value.busqueda);
      logger.debug(`Tipo de búsqueda auto-detectado: ${tipoBusqueda}`);
    }

    // ========== 3. Preparar parámetros para backend ==========
    // ✅ FIX Bug #3: El endpoint /api/v1/clientes/buscar espera 'q', no 'busqueda'
    const params = {
      q: value.busqueda,
      limit: 10,
    };

    logger.info('Buscando cliente:', { query: value.busqueda, tipo: tipoBusqueda });

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
