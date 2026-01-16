import apiClient from '../client';
/**
 * API de MercadoPago
 */
export const mercadopagoApi = {
  /**
   * Crear token de tarjeta
   * @param {Object} data - { card_number, cardholder_name, expiration_month, expiration_year, security_code, identification_number }
   * @returns {Promise<Object>} { token_id, first_six_digits, last_four_digits }
   */
  createCardToken: (data) => apiClient.post('/mercadopago/create-card-token', data),
};

// ==================== COMISIONES ====================
