import apiClient from '../client';
/**
 * API de Módulos
 */
export const modulosApi = {
  /**
   * Listar módulos disponibles en el sistema
   * @returns {Promise<Object>} { modulos: [...], total }
   */
  listarDisponibles: () => apiClient.get('/modulos/disponibles'),

  /**
   * Obtener módulos activos de la organización
   * @returns {Promise<Object>} { modulos_activos: {...}, modulos: {...}, organizacion_id }
   */
  obtenerActivos: () => apiClient.get('/modulos/activos'),

  /**
   * Verificar si un módulo específico está activo
   * @param {string} modulo - Nombre del módulo
   * @returns {Promise<Object>} { modulo, activo, metadata }
   */
  verificarModulo: (modulo) => apiClient.get(`/modulos/verificar/${modulo}`),

  /**
   * Activar módulo para la organización
   * @param {string} modulo - Nombre del módulo a activar
   * @returns {Promise<Object>} { modulo, activo: true, mensaje }
   */
  activarModulo: (modulo) => apiClient.put('/modulos/activar', { modulo }),

  /**
   * Desactivar módulo para la organización
   * @param {string} modulo - Nombre del módulo a desactivar
   * @returns {Promise<Object>} { modulo, activo: false, mensaje }
   */
  desactivarModulo: (modulo) => apiClient.put('/modulos/desactivar', { modulo }),
};

// ==================== UBICACIONES (Nov 2025) ====================
