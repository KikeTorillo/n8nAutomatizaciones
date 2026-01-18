/**
 * Helper para validaciones
 * @module utils/helpers/ValidationHelper
 */

class ValidationHelper {
  /**
   * Valida formato de email
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valida formato de teléfono mexicano
   */
  static isValidMexicanPhone(phone) {
    // Acepta formato: XXXXXXXXXX (exactamente 10 dígitos, primer dígito 1-9)
    const phoneRegex = /^[1-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\s|-/g, ''));
  }

  /**
   * Normaliza número de teléfono
   */
  static normalizePhone(phone) {
    // Remover espacios, guiones y paréntesis
    let normalized = phone.replace(/[\s\-\(\)]/g, '');

    // Si empieza con +52, quitarlo
    if (normalized.startsWith('+52')) {
      normalized = normalized.substring(3);
    }
    // Si empieza con 52, quitarlo
    else if (normalized.startsWith('52') && normalized.length === 12) {
      normalized = normalized.substring(2);
    }

    return normalized;
  }

  /**
   * Valida formato de fecha (YYYY-MM-DD)
   */
  static isValidDate(dateString) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  }

  /**
   * Valida formato de hora (HH:MM)
   */
  static isValidTime(timeString) {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeString);
  }

  /**
   * Valida que una fecha sea futura
   */
  static isFutureDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  }

  /**
   * Valida código de cita (8 caracteres alfanuméricos)
   */
  static isValidCitaCode(code) {
    const codeRegex = /^[A-Z0-9]{8}$/;
    return codeRegex.test(code);
  }
}

module.exports = ValidationHelper;
