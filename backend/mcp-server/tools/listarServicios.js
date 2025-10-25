/**
 * ====================================================================
 * TOOL: LISTAR SERVICIOS
 * ====================================================================
 *
 * Herramienta MCP para listar servicios activos disponibles
 * en la organización.
 *
 * Llamada al backend: GET /api/v1/servicios
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
    activo: {
      type: 'boolean',
      description: 'Filtrar solo servicios activos (default: true)',
      default: true,
    },
  },
};

/**
 * Schema Joi para validación estricta
 */
const joiSchema = Joi.object({
  activo: Joi.boolean().optional().default(true),
});

/**
 * Función principal de ejecución
 * @param {Object} args - Argumentos de la tool
 * @param {string} jwtToken - Token JWT del chatbot para autenticación
 */
async function execute(args = {}, jwtToken) {
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
      logger.warn('Validación fallida en listarServicios:', error.details);
      return {
        success: false,
        message: `Error de validación: ${error.details[0].message}`,
        data: null,
      };
    }

    // ========== 2. Preparar parámetros para backend ==========
    const params = {
      activo: value.activo,
    };

    logger.info('Listando servicios con filtros:', params);

    // ========== 3. Crear cliente API con token del chatbot ==========
    const apiClient = createApiClient(jwtToken);

    // ========== 4. Llamar al backend API ==========
    const response = await apiClient.get('/api/v1/servicios', { params });

    // DEBUG: Ver estructura de response
    logger.info('Response completa del backend:', JSON.stringify(response.data, null, 2));

    // Backend retorna: { success: true, data: { servicios: [...], paginacion: {...} }, message: "..." }
    // Axios response.data contiene el objeto completo del backend
    const { servicios, paginacion } = response.data.data || response.data;

    logger.info(`${servicios?.length || 0} servicios obtenidos de ${paginacion?.total_elementos || 0} totales`);

    // ========== 4. Formatear resultado ==========
    const serviciosFormateados = servicios.map(servicio => ({
      id: servicio.id,
      nombre: servicio.nombre,
      descripcion: servicio.descripcion,
      duracion_minutos: servicio.duracion_minutos,
      precio: servicio.precio,
      activo: servicio.activo,
      categoria: servicio.categoria,
      subcategoria: servicio.subcategoria,
      total_profesionales_asignados: parseInt(servicio.total_profesionales_asignados) || 0,
    }));

    return {
      success: true,
      message: `Se encontraron ${serviciosFormateados.length} servicios de ${paginacion.total_elementos} totales`,
      data: {
        servicios: serviciosFormateados,
        total: serviciosFormateados.length,
        paginacion: {
          pagina_actual: paginacion.pagina_actual,
          total_paginas: paginacion.total_paginas,
          total_elementos: paginacion.total_elementos,
        },
      },
    };

  } catch (error) {
    logger.error('Error al listar servicios:', {
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

      if (status === 403) {
        return {
          success: false,
          message: 'No tienes permisos para listar servicios',
          data: null,
        };
      }
    }

    // Error genérico
    return {
      success: false,
      message: `Error al listar servicios: ${error.message}`,
      data: null,
    };
  }
}

// ====================================================================
// EXPORTS
// ====================================================================

module.exports = {
  name: 'listarServicios',
  description: 'Lista todos los servicios activos disponibles en la organización con su duración, precio y profesionales que los ofrecen.',
  inputSchema,
  execute,
};
