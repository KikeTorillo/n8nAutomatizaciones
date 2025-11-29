/**
 * ====================================================================
 * TOKEN MANAGER - Gestión de Tokens Criptográficos
 * ====================================================================
 *
 * Utilidad compartida para generación y validación de tokens seguros.
 * Usado por:
 * - Sistema de invitaciones (profesionales)
 * - Sistema de activación de cuentas
 * - Recuperación de contraseña
 *
 * Nov 2025 - Extraído de invitacion.model.js para reutilización
 *
 * @module utils/tokenManager
 */

const crypto = require('crypto');

class TokenManager {

    /**
     * Genera token criptográfico seguro
     * @param {number} bytes - Tamaño en bytes (default 32 = 64 chars hex)
     * @returns {string} Token hexadecimal
     *
     * @example
     * TokenManager.generate()     // 64 caracteres hex
     * TokenManager.generate(16)   // 32 caracteres hex
     */
    static generate(bytes = 32) {
        return crypto.randomBytes(bytes).toString('hex');
    }

    /**
     * Valida formato de token hexadecimal
     * @param {string} token - Token a validar
     * @param {number} expectedLength - Longitud esperada (default 64)
     * @returns {boolean} True si el formato es válido
     *
     * @example
     * TokenManager.isValidFormat('abc123...')  // true/false
     */
    static isValidFormat(token, expectedLength = 64) {
        if (typeof token !== 'string') return false;
        const regex = new RegExp(`^[a-f0-9]{${expectedLength}}$`, 'i');
        return regex.test(token);
    }

    /**
     * Calcula tiempo restante hasta expiración
     * @param {Date|string} expiraEn - Fecha de expiración
     * @returns {Object} Objeto con información de tiempo restante
     *
     * @example
     * const tiempo = TokenManager.getTimeRemaining(expiraEn);
     * // { expired: false, milliseconds: 86400000, seconds: 86400, minutes: 1440, hours: 24, days: 1 }
     */
    static getTimeRemaining(expiraEn) {
        const ahora = new Date();
        const expira = new Date(expiraEn);
        const diffMs = expira - ahora;

        return {
            expired: diffMs <= 0,
            milliseconds: Math.max(0, diffMs),
            seconds: Math.max(0, Math.floor(diffMs / 1000)),
            minutes: Math.max(0, Math.floor(diffMs / (1000 * 60))),
            hours: Math.max(0, Math.floor(diffMs / (1000 * 60 * 60))),
            days: Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
        };
    }

    /**
     * Formatea tiempo restante para mostrar al usuario
     * @param {Date|string} expiraEn - Fecha de expiración
     * @returns {string} Texto formateado (ej: "2 horas", "45 minutos")
     *
     * @example
     * TokenManager.formatTimeRemaining(expiraEn)  // "2 horas"
     */
    static formatTimeRemaining(expiraEn) {
        const tiempo = this.getTimeRemaining(expiraEn);

        if (tiempo.expired) return 'Expirado';
        if (tiempo.days > 0) return `${tiempo.days} día${tiempo.days > 1 ? 's' : ''}`;
        if (tiempo.hours > 0) return `${tiempo.hours} hora${tiempo.hours > 1 ? 's' : ''}`;
        if (tiempo.minutes > 0) return `${tiempo.minutes} minuto${tiempo.minutes > 1 ? 's' : ''}`;
        return 'Menos de 1 minuto';
    }

    /**
     * Genera fecha de expiración
     * @param {number} cantidad - Cantidad de unidades
     * @param {string} unidad - Unidad: 'hours', 'days', 'minutes'
     * @returns {Date} Fecha de expiración
     *
     * @example
     * TokenManager.generateExpiration(24, 'hours')  // 24 horas desde ahora
     * TokenManager.generateExpiration(7, 'days')    // 7 días desde ahora
     */
    static generateExpiration(cantidad, unidad = 'hours') {
        const ahora = new Date();
        const multiplicadores = {
            minutes: 60 * 1000,
            hours: 60 * 60 * 1000,
            days: 24 * 60 * 60 * 1000
        };

        const ms = multiplicadores[unidad] || multiplicadores.hours;
        return new Date(ahora.getTime() + (cantidad * ms));
    }

    /**
     * Compara dos tokens de forma segura (timing-safe)
     * Previene ataques de timing
     * @param {string} token1 - Primer token
     * @param {string} token2 - Segundo token
     * @returns {boolean} True si son iguales
     */
    static secureCompare(token1, token2) {
        if (typeof token1 !== 'string' || typeof token2 !== 'string') {
            return false;
        }

        // Convertir a buffers del mismo tamaño
        const buf1 = Buffer.from(token1);
        const buf2 = Buffer.from(token2);

        if (buf1.length !== buf2.length) {
            return false;
        }

        return crypto.timingSafeEqual(buf1, buf2);
    }
}

module.exports = TokenManager;
