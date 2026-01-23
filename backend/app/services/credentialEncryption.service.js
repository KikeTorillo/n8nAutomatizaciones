/**
 * ====================================================================
 * SERVICIO DE ENCRIPTACIÓN DE CREDENCIALES
 * ====================================================================
 *
 * Encripta/desencripta credenciales de gateways de pago usando AES-256-GCM.
 * Diseñado para almacenar de forma segura API keys, tokens, y secrets.
 *
 * IMPORTANTE:
 * - Requiere variable de entorno CREDENTIAL_ENCRYPTION_KEY (32 bytes hex = 64 chars)
 * - Generar clave con: openssl rand -hex 32
 * - NUNCA loguear credenciales desencriptadas
 *
 * @module services/credentialEncryption
 * @version 1.0.0
 * @date Enero 2026
 */

const crypto = require('crypto');
const logger = require('../utils/logger');

// Configuración de encriptación
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;  // 96 bits para GCM (recomendado por NIST)
const TAG_LENGTH = 16; // 128 bits para autenticación

class CredentialEncryptionService {

    /**
     * Obtiene la clave de encriptación del entorno
     * @returns {Buffer} Clave de 32 bytes
     * @throws {Error} Si la clave no está configurada o es inválida
     */
    static getEncryptionKey() {
        const keyHex = process.env.CREDENTIAL_ENCRYPTION_KEY;

        if (!keyHex) {
            throw new Error(
                'CREDENTIAL_ENCRYPTION_KEY no está configurada. ' +
                'Generar con: openssl rand -hex 32'
            );
        }

        if (keyHex.length !== 64) {
            throw new Error(
                'CREDENTIAL_ENCRYPTION_KEY debe ser de 64 caracteres hex (32 bytes). ' +
                `Actual: ${keyHex.length} caracteres`
            );
        }

        return Buffer.from(keyHex, 'hex');
    }

    /**
     * Encripta un objeto JSON con credenciales
     *
     * @param {Object} credentials - Objeto con credenciales (ej: {access_token, public_key})
     * @returns {{encrypted: Buffer, iv: Buffer, tag: Buffer}} Datos encriptados
     *
     * @example
     * const { encrypted, iv, tag } = CredentialEncryptionService.encrypt({
     *     access_token: 'APP_USR-xxx',
     *     public_key: 'APP_USR-yyy'
     * });
     */
    static encrypt(credentials) {
        if (!credentials || typeof credentials !== 'object') {
            throw new Error('Las credenciales deben ser un objeto');
        }

        try {
            const key = this.getEncryptionKey();
            const iv = crypto.randomBytes(IV_LENGTH);
            const plaintext = JSON.stringify(credentials);

            const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
                authTagLength: TAG_LENGTH
            });

            const encrypted = Buffer.concat([
                cipher.update(plaintext, 'utf8'),
                cipher.final()
            ]);

            const tag = cipher.getAuthTag();

            logger.debug('[CredentialEncryption] Credenciales encriptadas', {
                plaintextLength: plaintext.length,
                encryptedLength: encrypted.length
            });

            return { encrypted, iv, tag };

        } catch (error) {
            logger.error('[CredentialEncryption] Error al encriptar', {
                error: error.message
            });
            throw new Error('Error al encriptar credenciales');
        }
    }

    /**
     * Desencripta credenciales
     *
     * @param {Buffer} encrypted - Datos encriptados
     * @param {Buffer} iv - Vector de inicialización
     * @param {Buffer} tag - Tag de autenticación
     * @returns {Object} Credenciales desencriptadas
     *
     * @example
     * const credentials = CredentialEncryptionService.decrypt(encrypted, iv, tag);
     * // { access_token: 'APP_USR-xxx', public_key: 'APP_USR-yyy' }
     */
    static decrypt(encrypted, iv, tag) {
        if (!encrypted || !iv || !tag) {
            throw new Error('Faltan datos para desencriptar (encrypted, iv, tag)');
        }

        try {
            const key = this.getEncryptionKey();

            // Convertir de formato DB si es necesario
            const encryptedBuffer = Buffer.isBuffer(encrypted) ? encrypted : Buffer.from(encrypted);
            const ivBuffer = Buffer.isBuffer(iv) ? iv : Buffer.from(iv);
            const tagBuffer = Buffer.isBuffer(tag) ? tag : Buffer.from(tag);

            const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer, {
                authTagLength: TAG_LENGTH
            });

            decipher.setAuthTag(tagBuffer);

            const decrypted = Buffer.concat([
                decipher.update(encryptedBuffer),
                decipher.final()
            ]);

            const credentials = JSON.parse(decrypted.toString('utf8'));

            logger.debug('[CredentialEncryption] Credenciales desencriptadas', {
                keysCount: Object.keys(credentials).length
            });

            return credentials;

        } catch (error) {
            // No loguear el error completo para evitar filtrar información
            logger.error('[CredentialEncryption] Error al desencriptar', {
                errorType: error.name,
                message: error.message.includes('Unsupported state')
                    ? 'Tag de autenticación inválido'
                    : 'Error de desencriptación'
            });
            throw new Error('Error al desencriptar credenciales. La clave puede haber cambiado.');
        }
    }

    /**
     * Genera un hint para mostrar en UI (últimos caracteres de la API key)
     *
     * @param {Object} credentials - Credenciales (busca access_token, api_key, secret_key)
     * @param {number} hintLength - Cantidad de caracteres a mostrar (default: 4)
     * @returns {string|null} Hint tipo "...abc123"
     */
    static generateHint(credentials, hintLength = 4) {
        // Buscar la clave principal en orden de prioridad
        const keysToCheck = ['access_token', 'api_key', 'secret_key', 'private_key'];

        for (const keyName of keysToCheck) {
            if (credentials[keyName] && typeof credentials[keyName] === 'string') {
                const value = credentials[keyName];
                if (value.length > hintLength) {
                    return `...${value.slice(-hintLength)}`;
                }
                return `...${value}`;
            }
        }

        return null;
    }

    /**
     * Valida que las credenciales tengan los campos requeridos para un gateway
     *
     * @param {string} gateway - Nombre del gateway ('mercadopago', 'stripe', etc.)
     * @param {Object} credentials - Credenciales a validar
     * @returns {{valid: boolean, missing: string[]}} Resultado de validación
     */
    static validateCredentials(gateway, credentials) {
        const requiredFields = {
            mercadopago: ['access_token'],
            stripe: ['secret_key'],
            paypal: ['client_id', 'client_secret'],
            conekta: ['private_key']
        };

        const required = requiredFields[gateway] || [];
        const missing = required.filter(field => !credentials[field]);

        return {
            valid: missing.length === 0,
            missing
        };
    }

    /**
     * Encripta un webhook secret
     *
     * @param {string} webhookSecret - Secret del webhook
     * @returns {{encrypted: Buffer, iv: Buffer, tag: Buffer}|null}
     */
    static encryptWebhookSecret(webhookSecret) {
        if (!webhookSecret) {
            return null;
        }

        return this.encrypt({ secret: webhookSecret });
    }

    /**
     * Desencripta un webhook secret
     *
     * @param {Buffer} encrypted - Secret encriptado
     * @param {Buffer} iv - IV
     * @param {Buffer} tag - Tag
     * @returns {string|null}
     */
    static decryptWebhookSecret(encrypted, iv, tag) {
        if (!encrypted || !iv || !tag) {
            return null;
        }

        const result = this.decrypt(encrypted, iv, tag);
        return result.secret || null;
    }

    /**
     * Verifica si la clave de encriptación está configurada
     *
     * @returns {boolean}
     */
    static isConfigured() {
        try {
            this.getEncryptionKey();
            return true;
        } catch {
            return false;
        }
    }
}

module.exports = CredentialEncryptionService;
