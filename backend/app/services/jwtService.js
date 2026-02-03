/**
 * @fileoverview Servicio centralizado de JWT
 * @description Maneja generación, verificación y decodificación de tokens JWT
 * @version 1.0.0
 *
 * Responsabilidades:
 * - Generar access tokens con payload estándar
 * - Generar refresh tokens
 * - Verificar validez de tokens
 * - Decodificar tokens sin verificación (para logout/blacklist)
 *
 * Este servicio es STATELESS y reutilizable en otros proyectos.
 * No tiene dependencias de negocio (organizaciones, roles, etc.)
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const logger = require('../utils/logger');

const JWT_CONFIG = {
    ACCESS_TOKEN_EXPIRATION: process.env.JWT_EXPIRES_IN || '1h',
    ACCESS_TOKEN_EXPIRATION_SECONDS: 3600,
    REFRESH_TOKEN_EXPIRATION: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    ISSUER: process.env.JWT_ISSUER || 'nexo-app'
};

class JwtService {
    /**
     * Genera un access token para el usuario
     *
     * @param {Object} usuario - Datos del usuario
     * @param {number} usuario.id - ID del usuario
     * @param {string} usuario.email - Email del usuario
     * @param {number} usuario.rol_id - ID del rol
     * @param {number|null} usuario.organizacion_id - ID de la organización
     * @param {number|null} usuario.sucursal_id - ID de la sucursal
     * @returns {string} Access token JWT
     */
    static generateAccessToken(usuario) {
        const jti = crypto.randomBytes(16).toString('hex');

        const payload = {
            userId: usuario.id,
            email: usuario.email,
            rolId: usuario.rol_id,
            organizacionId: usuario.organizacion_id || null,
            sucursalId: usuario.sucursal_id || null,
            jti
        };

        return jwt.sign(
            payload,
            process.env.JWT_SECRET,
            {
                expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRATION,
                issuer: JWT_CONFIG.ISSUER
            }
        );
    }

    /**
     * Genera un refresh token para el usuario
     *
     * @param {number} userId - ID del usuario
     * @returns {string} Refresh token JWT
     */
    static generateRefreshToken(userId) {
        const jti = crypto.randomBytes(16).toString('hex');

        return jwt.sign(
            { userId, type: 'refresh', jti },
            process.env.JWT_REFRESH_SECRET,
            {
                expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRATION,
                issuer: JWT_CONFIG.ISSUER
            }
        );
    }

    /**
     * Genera par de tokens (access + refresh)
     *
     * @param {Object} usuario - Datos del usuario
     * @returns {Object} { accessToken, refreshToken, expiresIn }
     */
    static generateTokenPair(usuario) {
        const accessToken = this.generateAccessToken(usuario);
        const refreshToken = this.generateRefreshToken(usuario.id);

        return {
            accessToken,
            refreshToken,
            expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRATION_SECONDS
        };
    }

    /**
     * Verifica un access token
     *
     * @param {string} token - Token a verificar
     * @returns {Object} Payload decodificado
     * @throws {Error} Si el token es inválido o expirado
     */
    static verifyAccessToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET, {
                issuer: JWT_CONFIG.ISSUER
            });
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                const err = new Error('Token expirado');
                err.statusCode = 401;
                err.code = 'TOKEN_EXPIRED';
                throw err;
            }
            if (error.name === 'JsonWebTokenError') {
                const err = new Error('Token inválido');
                err.statusCode = 401;
                err.code = 'TOKEN_INVALID';
                throw err;
            }
            throw error;
        }
    }

    /**
     * Verifica un refresh token
     *
     * @param {string} token - Token a verificar
     * @returns {Object} Payload decodificado
     * @throws {Error} Si el token es inválido o expirado
     */
    static verifyRefreshToken(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
                issuer: JWT_CONFIG.ISSUER
            });

            if (decoded.type !== 'refresh') {
                const err = new Error('Token de tipo incorrecto');
                err.statusCode = 401;
                err.code = 'TOKEN_TYPE_INVALID';
                throw err;
            }

            return decoded;
        } catch (error) {
            if (error.code) throw error; // Re-throw errores propios

            if (error.name === 'TokenExpiredError') {
                const err = new Error('Refresh token expirado');
                err.statusCode = 401;
                err.code = 'REFRESH_TOKEN_EXPIRED';
                throw err;
            }
            if (error.name === 'JsonWebTokenError') {
                const err = new Error('Refresh token inválido');
                err.statusCode = 401;
                err.code = 'REFRESH_TOKEN_INVALID';
                throw err;
            }
            throw error;
        }
    }

    /**
     * Decodifica un token sin verificar (útil para logout/blacklist)
     *
     * @param {string} token - Token a decodificar
     * @returns {Object|null} Payload decodificado o null si es inválido
     */
    static decodeToken(token) {
        try {
            return jwt.decode(token);
        } catch {
            return null;
        }
    }

    /**
     * Calcula segundos hasta expiración de un token
     *
     * @param {string} token - Token a evaluar
     * @returns {number} Segundos hasta expiración (0 si ya expiró)
     */
    static getSecondsUntilExpiry(token) {
        const decoded = this.decodeToken(token);
        if (!decoded?.exp) return 0;

        const secondsUntilExpiry = decoded.exp - Math.floor(Date.now() / 1000);
        return Math.max(0, secondsUntilExpiry);
    }

    /**
     * Extrae el token del header Authorization
     *
     * @param {string} authHeader - Header Authorization completo
     * @returns {string|null} Token extraído o null
     */
    static extractFromHeader(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        return authHeader.substring(7);
    }

    /**
     * Obtiene la configuración de JWT (útil para testing)
     *
     * @returns {Object} Configuración actual
     */
    static getConfig() {
        return { ...JWT_CONFIG };
    }
}

module.exports = JwtService;
