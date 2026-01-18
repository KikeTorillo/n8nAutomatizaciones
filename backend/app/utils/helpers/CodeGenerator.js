/**
 * Helper para generación de códigos únicos
 * @module utils/helpers/CodeGenerator
 */

const crypto = require('crypto');
const SecureRandom = require('./SecureRandom');

class CodeGenerator {
  /**
   * Genera código único para citas
   * Usa SecureRandom para seguridad criptográfica
   */
  static generateCitaCode() {
    return SecureRandom.alphanumericCode(8);
  }

  /**
   * Genera slug para organización
   */
  static generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .trim()
      .substring(0, 50);
  }

  /**
   * Genera código de tenant
   * Usa SecureRandom para el sufijo aleatorio
   */
  static generateTenantCode(name) {
    const slug = this.generateSlug(name);
    const randomSuffix = SecureRandom.slugSuffix(5);
    return `${slug}-${randomSuffix}`;
  }

  /**
   * Genera token seguro
   */
  static generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }
}

module.exports = CodeGenerator;
