/**
 * Configuración de autenticación JWT
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

class AuthConfig {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET;
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
    this.jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
    this.bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;

    if (!this.jwtSecret) {
      throw new Error('JWT_SECRET es requerido en variables de entorno');
    }

    logger.info('Configuración de autenticación inicializada', {
      jwtExpiresIn: this.jwtExpiresIn,
      bcryptRounds: this.bcryptRounds
    });
  }

  /**
   * Genera un hash de contraseña usando bcrypt
   * @param {string} password - Contraseña en texto plano
   * @returns {Promise<string>} Hash de la contraseña
   */
  async hashPassword(password) {
    try {
      const salt = await bcrypt.genSalt(this.bcryptRounds);
      const hash = await bcrypt.hash(password, salt);
      return hash;
    } catch (error) {
      logger.error('Error generando hash de contraseña', { error: error.message });
      throw new Error('Error procesando contraseña');
    }
  }

  /**
   * Verifica una contraseña contra su hash
   * @param {string} password - Contraseña en texto plano
   * @param {string} hash - Hash almacenado
   * @returns {Promise<boolean>} True si coincide
   */
  async verifyPassword(password, hash) {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      logger.error('Error verificando contraseña', { error: error.message });
      return false;
    }
  }

  /**
   * Genera un token JWT
   * @param {Object} payload - Datos a incluir en el token
   * @param {string} expiresIn - Tiempo de expiración (opcional)
   * @returns {string} Token JWT
   */
  generateToken(payload, expiresIn = null) {
    try {
      const tokenPayload = {
        ...payload,
        iat: Math.floor(Date.now() / 1000)
      };

      const options = {
        expiresIn: expiresIn || this.jwtExpiresIn,
        issuer: 'saas-agendamiento',
        audience: 'saas-clients'
      };

      return jwt.sign(tokenPayload, this.jwtSecret, options);
    } catch (error) {
      logger.error('Error generando token JWT', { error: error.message });
      throw new Error('Error generando token de autenticación');
    }
  }

  /**
   * Genera un token de acceso y uno de refresh
   * @param {Object} payload - Datos del usuario
   * @returns {Object} Tokens de acceso y refresh
   */
  generateTokenPair(payload) {
    const accessToken = this.generateToken(payload, this.jwtExpiresIn);
    const refreshToken = this.generateToken(
      { userId: payload.userId, type: 'refresh' },
      this.jwtRefreshExpiresIn
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: this.jwtExpiresIn
    };
  }

  /**
   * Verifica y decodifica un token JWT
   * @param {string} token - Token a verificar
   * @returns {Object} Payload decodificado
   */
  verifyToken(token) {
    try {
      const options = {
        issuer: 'saas-agendamiento',
        audience: 'saas-clients'
      };

      return jwt.verify(token, this.jwtSecret, options);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        logger.debug('Token expirado', { expiredAt: error.expiredAt });
        throw new Error('Token expirado');
      } else if (error.name === 'JsonWebTokenError') {
        logger.warn('Token JWT inválido', { error: error.message });
        throw new Error('Token inválido');
      } else {
        logger.error('Error verificando token', { error: error.message });
        throw new Error('Error procesando token');
      }
    }
  }

  /**
   * Extrae el token del header Authorization
   * @param {string} authHeader - Header de autorización
   * @returns {string|null} Token extraído
   */
  extractTokenFromHeader(authHeader) {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  /**
   * Genera un código de verificación aleatorio
   * @param {number} length - Longitud del código
   * @returns {string} Código de verificación
   */
  generateVerificationCode(length = 6) {
    const chars = '0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  /**
   * Genera un token seguro para reset de contraseña
   * @returns {string} Token seguro
   */
  generateResetToken() {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Valida la fortaleza de una contraseña
   * @param {string} password - Contraseña a validar
   * @returns {Object} Resultado de validación
   */
  validatePasswordStrength(password) {
    const result = {
      isValid: false,
      score: 0,
      issues: []
    };

    // Longitud mínima
    if (password.length < 8) {
      result.issues.push('Mínimo 8 caracteres');
    } else {
      result.score += 1;
    }

    // Al menos una mayúscula
    if (!/[A-Z]/.test(password)) {
      result.issues.push('Al menos una mayúscula');
    } else {
      result.score += 1;
    }

    // Al menos una minúscula
    if (!/[a-z]/.test(password)) {
      result.issues.push('Al menos una minúscula');
    } else {
      result.score += 1;
    }

    // Al menos un número
    if (!/\d/.test(password)) {
      result.issues.push('Al menos un número');
    } else {
      result.score += 1;
    }

    // Al menos un caracter especial
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      result.issues.push('Al menos un caracter especial');
    } else {
      result.score += 1;
    }

    result.isValid = result.score >= 4 && result.issues.length === 0;
    return result;
  }
}

// Singleton
const auth = new AuthConfig();

module.exports = auth;