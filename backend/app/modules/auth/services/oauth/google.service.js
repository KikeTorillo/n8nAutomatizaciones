/**
 * @fileoverview Servicio de OAuth Google
 * @description Verifica tokens de Google y extrae información del usuario
 * @version 1.0.0
 * Dic 2025 - OAuth y Magic Links
 *
 * Requiere: npm install google-auth-library
 */

const { OAuth2Client } = require('google-auth-library');
const logger = require('../../../../utils/logger');

// Cliente OAuth2 de Google
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class GoogleOAuthService {

    /**
     * Verifica un token ID de Google y extrae los datos del usuario
     *
     * @param {string} idToken - Token ID recibido del frontend (credential de Google)
     * @returns {Promise<Object>} Datos del usuario verificados
     * @throws {Error} Si el token es inválido
     *
     * @example
     * const userData = await GoogleOAuthService.verifyToken(idToken);
     * // { googleId, email, nombre, apellidos, avatar_url, email_verified }
     */
    static async verifyToken(idToken) {
        try {
            // Verificar el token con Google
            const ticket = await client.verifyIdToken({
                idToken,
                audience: process.env.GOOGLE_CLIENT_ID
            });

            const payload = ticket.getPayload();

            // Validaciones de seguridad
            if (!payload) {
                throw new Error('Token payload vacío');
            }

            // Verificar issuer (debe ser de Google)
            const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
            if (!validIssuers.includes(payload.iss)) {
                logger.warn('[GoogleOAuth] Issuer inválido', { iss: payload.iss });
                throw new Error('Token issuer inválido');
            }

            // Verificar audience (debe coincidir con nuestro CLIENT_ID)
            if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
                logger.warn('[GoogleOAuth] Audience no coincide', {
                    expected: process.env.GOOGLE_CLIENT_ID,
                    received: payload.aud
                });
                throw new Error('Token audience inválido');
            }

            // Verificar que el email esté verificado
            if (!payload.email_verified) {
                logger.warn('[GoogleOAuth] Email no verificado', { email: payload.email });
                throw new Error('El email de Google no está verificado');
            }

            // Extraer datos del usuario
            const userData = {
                googleId: payload.sub,           // ID único de Google
                email: payload.email.toLowerCase(),
                nombre: payload.given_name || payload.name?.split(' ')[0] || 'Usuario',
                apellidos: payload.family_name || payload.name?.split(' ').slice(1).join(' ') || null,
                avatar_url: payload.picture || null,
                email_verified: payload.email_verified
            };

            logger.info('[GoogleOAuth] Token verificado exitosamente', {
                googleId: userData.googleId,
                email: userData.email
            });

            return userData;

        } catch (error) {
            // Manejar errores específicos de Google
            if (error.message?.includes('Token used too late') ||
                error.message?.includes('Token used too early')) {
                logger.warn('[GoogleOAuth] Token expirado o usado antes de tiempo');
                throw new Error('El token de Google ha expirado. Intenta de nuevo.');
            }

            if (error.message?.includes('Invalid token signature')) {
                logger.warn('[GoogleOAuth] Firma de token inválida');
                throw new Error('Token de Google inválido');
            }

            if (error.message?.includes('Wrong number of segments')) {
                logger.warn('[GoogleOAuth] Formato de token inválido');
                throw new Error('Formato de token inválido');
            }

            logger.error('[GoogleOAuth] Error verificando token', {
                error: error.message,
                stack: error.stack
            });

            throw new Error('Error al verificar con Google. Intenta de nuevo.');
        }
    }

    /**
     * Verifica si las credenciales de Google están configuradas
     * @returns {boolean}
     */
    static isConfigured() {
        return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    }

    /**
     * Obtiene el Client ID para el frontend
     * @returns {string|null}
     */
    static getClientId() {
        return process.env.GOOGLE_CLIENT_ID || null;
    }
}

module.exports = GoogleOAuthService;
