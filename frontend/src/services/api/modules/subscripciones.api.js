import apiClient from '../client';
/**
 * API de Subscripciones
 */
export const subscripcionesApi = {
  /**
   * Crear suscripción en Mercado Pago
   * @param {Object} data - { plan_id, email, card_token_id }
   * @returns {Promise<Object>} { subscription_id, status, suscripcion_id }
   */
  crear: (data) => apiClient.post('/subscripciones/crear', data),

  /**
   * Obtener suscripción actual
   * @returns {Promise<Object>}
   */
  obtenerActual: () => apiClient.get('/subscripciones/actual'),

  /**
   * Obtener estado del trial
   * @returns {Promise<Object>} { tiene_trial, trial_activo, trial_vencido, dias_restantes, plan_codigo, ... }
   */
  obtenerEstadoTrial: () => apiClient.get('/subscripciones/estado-trial'),

  /**
   * Activar pago con Mercado Pago (después del trial) - Usando init_point
   * No requiere body - genera init_point para redirigir a Mercado Pago
   * @returns {Promise<Object>} { subscription_id, init_point, status }
   */
  activarPago: () => apiClient.post('/subscripciones/activar-pago'),

  /**
   * Obtener métricas de uso de la organización
   * @returns {Promise<Object>} { uso_profesionales, uso_clientes, ..., limites }
   */
  obtenerMetricasUso: () => apiClient.get('/subscripciones/metricas-uso'),
};

// ==================== MERCADO PAGO ====================
