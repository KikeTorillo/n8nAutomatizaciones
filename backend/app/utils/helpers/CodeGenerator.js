/**
 * Helper para generación de códigos únicos
 * @module utils/helpers/CodeGenerator
 */

const crypto = require('crypto');

class CodeGenerator {
  /**
   * Genera código único para citas
   */
  static generateCitaCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
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
   */
  static generateTenantCode(name) {
    const slug = this.generateSlug(name);
    const randomSuffix = Math.random().toString(36).substring(2, 5);
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
