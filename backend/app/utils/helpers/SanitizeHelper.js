/**
 * Helper para sanitización
 * @module utils/helpers/SanitizeHelper
 */

class SanitizeHelper {
  /**
   * Sanitiza texto eliminando caracteres peligrosos
   */
  static sanitizeText(text) {
    if (!text) return '';
    return text.toString().trim().replace(/[<>]/g, '');
  }

  /**
   * Sanitiza número de teléfono
   */
  static sanitizePhone(phone) {
    if (!phone) return '';
    return phone.toString().replace(/[^\d+]/g, '');
  }

  /**
   * Sanitiza email
   */
  static sanitizeEmail(email) {
    if (!email) return '';
    return email.toString().toLowerCase().trim();
  }

  /**
   * Sanitiza entrada SQL (básico)
   */
  static sanitizeSqlInput(input) {
    if (!input) return '';
    return input.toString().replace(/['";\\]/g, '');
  }

  /**
   * Escapa caracteres HTML para prevenir XSS
   * Convierte caracteres peligrosos en entidades HTML
   * @param {string} text - Texto a escapar
   * @returns {string} Texto con caracteres HTML escapados
   */
  static escapeHtml(text) {
    if (!text) return '';
    const htmlEntities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };
    return text.toString().replace(/[&<>"'/]/g, char => htmlEntities[char]);
  }
}

module.exports = SanitizeHelper;
