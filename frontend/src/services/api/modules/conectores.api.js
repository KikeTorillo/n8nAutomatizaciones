import apiClient from '../client';

/**
 * ====================================================================
 * API CONECTORES DE PAGO
 * ====================================================================
 * Gestión de conectores de pago multi-tenant (Stripe, MercadoPago, etc.)
 *
 * Base URL: /api/v1/suscripciones-negocio/conectores
 */

const BASE_URL = '/suscripciones-negocio/conectores';

export const conectoresApi = {
  /**
   * Listar gateways soportados
   * @returns {Promise<Object>} { gateways: [{ id, nombre, campos_requeridos }] }
   */
  listarGateways: () =>
    apiClient.get(`${BASE_URL}/gateways`),

  /**
   * Listar conectores de la organización con paginación y filtros
   * @param {Object} params - { page, limit, gateway, entorno, activo, orden, direccion }
   * @returns {Promise<Object>} { conectores, total, paginacion }
   */
  listar: (params = {}) =>
    apiClient.get(BASE_URL, { params }),

  /**
   * Obtener conector por ID
   * @param {number} id - ID del conector
   * @returns {Promise<Object>}
   */
  obtener: (id) =>
    apiClient.get(`${BASE_URL}/${id}`),

  /**
   * Crear nuevo conector
   * @param {Object} data - { gateway, entorno, nombre_display, credenciales, webhook_url, webhook_secret, es_principal }
   * @returns {Promise<Object>}
   */
  crear: (data) =>
    apiClient.post(BASE_URL, data),

  /**
   * Actualizar conector existente
   * @param {number} id - ID del conector
   * @param {Object} data - Campos a actualizar
   * @returns {Promise<Object>}
   */
  actualizar: (id, data) =>
    apiClient.put(`${BASE_URL}/${id}`, data),

  /**
   * Eliminar conector
   * @param {number} id - ID del conector
   * @returns {Promise<Object>}
   */
  eliminar: (id) =>
    apiClient.delete(`${BASE_URL}/${id}`),

  /**
   * Verificar conectividad del conector
   * @param {number} id - ID del conector
   * @returns {Promise<Object>} { verificado, mensaje, ultimo_test }
   */
  verificarConectividad: (id) =>
    apiClient.post(`${BASE_URL}/${id}/verificar`),
};
