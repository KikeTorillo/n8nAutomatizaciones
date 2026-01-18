/**
 * SecureRandom - Helper para generación segura de valores aleatorios
 *
 * Reemplaza todos los usos de Math.random() en la aplicación con
 * alternativas criptográficamente seguras usando crypto.randomInt()
 *
 * @module utils/helpers/SecureRandom
 */

const crypto = require('crypto');

class SecureRandom {
  /**
   * Genera un entero aleatorio seguro en el rango [0, max)
   * @param {number} max - Límite superior exclusivo
   * @returns {number} Entero aleatorio
   */
  static int(max) {
    if (max <= 0) throw new Error('max debe ser mayor que 0');
    return crypto.randomInt(max);
  }

  /**
   * Selecciona un carácter aleatorio de un string
   * @param {string} chars - String de caracteres posibles
   * @returns {string} Un carácter aleatorio
   */
  static char(chars) {
    if (!chars || chars.length === 0) {
      throw new Error('chars no puede estar vacío');
    }
    return chars[this.int(chars.length)];
  }

  /**
   * Genera un string aleatorio de longitud especificada
   * @param {number} length - Longitud del string
   * @param {string} [charset='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'] - Caracteres a usar
   * @returns {string} String aleatorio
   */
  static string(length, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
    if (length <= 0) throw new Error('length debe ser mayor que 0');

    let result = '';
    for (let i = 0; i < length; i++) {
      result += this.char(charset);
    }
    return result;
  }

  /**
   * Genera un código numérico (para verificación por SMS/email)
   * @param {number} [length=6] - Longitud del código
   * @returns {string} Código numérico
   */
  static numericCode(length = 6) {
    const digits = '0123456789';
    return this.string(length, digits);
  }

  /**
   * Genera un código alfanumérico (para citas, referencias)
   * Solo mayúsculas y números para legibilidad
   * @param {number} [length=8] - Longitud del código
   * @returns {string} Código alfanumérico
   */
  static alphanumericCode(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return this.string(length, chars);
  }

  /**
   * Genera un sufijo para slugs y códigos de tenant
   * Base36 (a-z0-9) minúsculas
   * @param {number} [length=5] - Longitud del sufijo
   * @returns {string} Sufijo base36
   */
  static slugSuffix(length = 5) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    return this.string(length, chars);
  }

  /**
   * Genera un token hexadecimal seguro
   * @param {number} [bytes=32] - Número de bytes (resultado será 2x en hex)
   * @returns {string} Token hexadecimal
   */
  static hexToken(bytes = 32) {
    return crypto.randomBytes(bytes).toString('hex');
  }

  /**
   * Baraja un array usando Fisher-Yates con crypto
   * @param {Array} array - Array a barajar (se modifica in-place)
   * @returns {Array} El mismo array barajado
   */
  static shuffle(array) {
    if (!Array.isArray(array)) {
      throw new Error('Se requiere un array');
    }

    // Fisher-Yates shuffle con crypto.randomInt
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.int(i + 1);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * Genera una clave de idempotencia para pagos
   * Formato: timestamp-random
   * @returns {string} Clave de idempotencia
   */
  static idempotencyKey() {
    return `${Date.now()}-${this.hexToken(8)}`;
  }

  /**
   * Genera un token para URLs (URL-safe base64)
   * @param {number} [bytes=32] - Número de bytes
   * @returns {string} Token URL-safe
   */
  static urlSafeToken(bytes = 32) {
    return crypto.randomBytes(bytes)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
}

module.exports = SecureRandom;
