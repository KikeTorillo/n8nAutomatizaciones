/**
 * ====================================================================
 * 🔧 N8N SETUP HELPER - FUNCIONES AUXILIARES PARA SETUP
 * ====================================================================
 * Helpers para crear owner de n8n y generar API Key programáticamente.
 *
 * 🎯 FUNCIONALIDADES:
 * • Crear owner de n8n vía API REST
 * • Generar API Key con autenticación automática
 * • Retry logic para manejar n8n iniciando
 *
 * @module utils/n8nSetupHelper
 */

const axios = require('axios');
const logger = require('./logger');
const { database } = require('../config/database');

const N8N_URL = process.env.N8N_API_URL || 'http://n8n-main:5678';

// ⚙️ CONFIGURACIÓN DE REINTENTOS (ajustable via .env)
const N8N_SETUP_MAX_RETRIES = parseInt(process.env.N8N_SETUP_MAX_RETRIES) || 3;
const N8N_SETUP_RETRY_DELAY = parseInt(process.env.N8N_SETUP_RETRY_DELAY) || 5000; // ms

/**
 * ================================================================
 * 🔍 VERIFICAR SI OWNER EXISTE CON EMAIL CONFIGURADO
 * ================================================================
 * Verifica si existe un owner en n8n con email configurado (no ghost owner).
 *
 * IMPORTANTE: N8n crea automáticamente un "ghost owner" (owner sin email)
 * durante su inicialización. Este método distingue entre:
 * - Ghost owner: roleSlug='global:owner' pero email IS NULL
 * - Owner real: roleSlug='global:owner' Y email IS NOT NULL
 *
 * @returns {Promise<boolean>} true si existe owner con email, false si es ghost o no existe
 */
async function verificarOwnerConEmail() {
    try {
        logger.info('Verificando si existe owner con email configurado en n8n...');

        const result = await database.queryDatabase(
            'n8n',
            `SELECT COUNT(*) as count
             FROM "user"
             WHERE "roleSlug" = 'global:owner'
             AND email IS NOT NULL
             AND email != ''`,
            []
        );

        const count = parseInt(result.rows[0]?.count || 0);

        if (count > 0) {
            logger.info('✅ Owner con email ya existe en n8n');
            return true;
        } else {
            logger.info('ℹ️  No existe owner con email (puede ser ghost owner)');
            return false;
        }

    } catch (error) {
        logger.error('Error verificando owner en n8n DB:', error.message);
        // En caso de error de conexión, asumir que no existe para intentar creación
        return false;
    }
}

/**
 * ================================================================
 * 🔎 OBTENER ID DEL OWNER (GHOST O REAL)
 * ================================================================
 * Obtiene el ID del owner existente, sea ghost o con email configurado.
 * Esto es útil porque n8n actualiza el ghost owner en lugar de crear uno nuevo.
 *
 * @returns {Promise<string|null>} ID del owner o null si no existe
 */
async function obtenerIdOwner() {
    try {
        const result = await database.queryDatabase(
            'n8n',
            `SELECT id, email, "firstName", "lastName"
             FROM "user"
             WHERE "roleSlug" = 'global:owner'
             LIMIT 1`,
            []
        );

        if (result.rows.length > 0) {
            const owner = result.rows[0];
            logger.debug('Owner encontrado en n8n DB:', {
                id: owner.id,
                hasEmail: !!owner.email,
                firstName: owner.firstName,
                lastName: owner.lastName
            });
            return owner.id;
        }

        return null;

    } catch (error) {
        logger.error('Error obteniendo ID de owner:', error.message);
        return null;
    }
}

/**
 * ================================================================
 * 👤 CREAR OWNER DE N8N
 * ================================================================
 * Crea el usuario owner en n8n via API REST.
 *
 * FLUJO MEJORADO (maneja ghost owner):
 * 1. Verifica si ya existe owner con email configurado → skip si existe
 * 2. Si NO existe o es ghost owner → llama API REST
 * 3. N8n puede responder 400 "Instance owner already setup" pero ACTUALIZA el ghost owner
 * 4. Verifica en DB que el owner tenga el email correcto después del intento
 * 5. Si DB muestra owner con email correcto → éxito (aunque API respondió 400)
 *
 * @param {object} params - Datos del owner
 * @param {string} params.email - Email del owner
 * @param {string} params.password - Password del owner
 * @param {string} params.firstName - Nombre
 * @param {string} params.lastName - Apellido
 * @param {number} maxRetries - Máximo número de reintentos
 * @param {number} attempt - Intento actual (interno)
 * @returns {Promise<object>} Datos del owner creado (con id)
 */
async function crearN8nOwner({ email, password, firstName, lastName }, maxRetries = N8N_SETUP_MAX_RETRIES, attempt = 1) {
    try {
        // ✅ PASO 1: Verificar si ya existe owner con email configurado
        const ownerConEmailExiste = await verificarOwnerConEmail();
        if (ownerConEmailExiste) {
            logger.info('✅ Owner ya configurado en n8n, obteniendo ID...');
            const ownerId = await obtenerIdOwner();
            return {
                id: ownerId,
                email,
                firstName,
                lastName,
                yaExistia: true
            };
        }

        // ✅ PASO 2: No existe owner con email (ghost owner o vacío) → intentar creación
        logger.info(`Creando/actualizando owner en n8n: ${email} (intento ${attempt}/${maxRetries})`);

        const response = await axios.post(
            `${N8N_URL}/rest/owner/setup`,
            {
                email,
                password,
                firstName,
                lastName,
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000,
            }
        );

        // ✅ CASO A: API respondió 200 OK con ID (creación exitosa)
        if (response.data && response.data.id) {
            logger.info(`✅ Owner n8n creado exitosamente: ID ${response.data.id}`);
            return response.data;
        }

        // ✅ CASO B: API respondió 200 OK pero sin ID → verificar en DB
        logger.warn('N8n respondió 200 pero sin ID, verificando en DB...', {
            statusCode: response.status,
            responseData: response.data
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        const verifyResult = await database.queryDatabase(
            'n8n',
            `SELECT id, email, "firstName", "lastName"
             FROM "user"
             WHERE "roleSlug" = 'global:owner'
             AND email = $1
             LIMIT 1`,
            [email]
        );

        if (verifyResult.rows.length > 0) {
            const owner = verifyResult.rows[0];
            logger.info('✅ Owner creado/actualizado correctamente (verificado en DB):', {
                id: owner.id,
                email: owner.email
            });
            return {
                id: owner.id,
                email: owner.email,
                firstName: owner.firstName,
                lastName: owner.lastName,
                verificadoEnDB: true
            };
        }

        throw new Error('Respuesta inesperada de n8n y owner no encontrado en DB');

    } catch (error) {
        logger.warn('Error en creación de owner, verificando estado en DB...', {
            statusCode: error.response?.status,
            message: error.response?.data?.message || error.message
        });

        // ✅ CASO B: API respondió 400 "Instance owner already setup"
        // → N8n actualiza ghost owner pero responde con error
        if (error.response?.status === 400 && error.response?.data?.message?.includes('Instance owner already setup')) {
            logger.info('ℹ️  N8n indica "owner already setup", verificando si actualizó el ghost owner...');

            // Esperar 1s para que n8n termine de escribir en DB
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Verificar en DB si el owner tiene ahora el email correcto
            const result = await database.queryDatabase(
                'n8n',
                `SELECT id, email, "firstName", "lastName"
                 FROM "user"
                 WHERE "roleSlug" = 'global:owner'
                 AND email = $1
                 LIMIT 1`,
                [email]
            );

            if (result.rows.length > 0) {
                const owner = result.rows[0];
                logger.info('✅ Owner actualizado correctamente en n8n (ghost owner convertido):', {
                    id: owner.id,
                    email: owner.email
                });
                return {
                    id: owner.id,
                    email: owner.email,
                    firstName: owner.firstName,
                    lastName: owner.lastName,
                    actualizado: true
                };
            } else {
                // Owner no tiene el email correcto → fallo real
                logger.error('❌ N8n indica owner setup pero email no coincide en DB');
                throw new Error('Owner setup falló: email no coincide en base de datos');
            }
        }

        // ✅ CASO C: API respondió "starting up" → reintentar
        if (error.response?.data?.message?.includes('starting up') && attempt < maxRetries) {
            logger.warn(`n8n aún iniciando, esperando ${N8N_SETUP_RETRY_DELAY}ms antes de reintento ${attempt + 1}/${maxRetries}...`);
            await new Promise(resolve => setTimeout(resolve, N8N_SETUP_RETRY_DELAY));
            return crearN8nOwner({ email, password, firstName, lastName }, maxRetries, attempt + 1);
        }

        // ✅ CASO D: Otro error → lanzar excepción
        logger.error('Error creando owner en n8n:', error.response?.data || error.message);
        throw new Error(
            `Error creando owner n8n: ${error.response?.data?.message || error.message}`
        );
    }
}

/**
 * ================================================================
 * 🔑 GENERAR API KEY DE N8N
 * ================================================================
 * Hace login en n8n y genera un API Key programáticamente.
 *
 * @param {string} email - Email del owner
 * @param {string} password - Password del owner
 * @returns {Promise<string>} API Key generado
 */
async function generarN8nApiKey(email, password) {
    const cookieJar = [];
    const API_KEY_LABEL = 'Sistema Backend - Auto-generated';

    try {
        // Paso 0: Verificar si ya existe API key en la base de datos
        logger.info('Verificando si ya existe API key en n8n DB...');

        const existingKeyResult = await database.queryDatabase(
            'n8n',
            `SELECT "apiKey" FROM user_api_keys
             WHERE label = $1
             ORDER BY "createdAt" DESC
             LIMIT 1`,
            [API_KEY_LABEL]
        );

        if (existingKeyResult.rows.length > 0) {
            const existingApiKey = existingKeyResult.rows[0].apiKey;
            logger.info(`✅ API Key existente reutilizado (${existingApiKey.substring(0, 20)}...)`);
            return existingApiKey;
        }

        logger.info('No existe API key, generando nueva...');

        // Paso 1: Login
        logger.info('Autenticando en n8n para generar API Key...');

        const loginResponse = await axios.post(
            `${N8N_URL}/rest/login`,
            {
                emailOrLdapLoginId: email, // N8n usa este campo en lugar de "email"
                password,
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000,
            }
        );

        // Extraer cookies de autenticación
        const setCookies = loginResponse.headers['set-cookie'];
        if (setCookies) {
            setCookies.forEach(cookie => {
                cookieJar.push(cookie.split(';')[0]);
            });
        }

        const cookieHeader = cookieJar.join('; ');

        // Paso 2: Obtener scopes disponibles
        const scopesResponse = await axios.get(
            `${N8N_URL}/rest/api-keys/scopes`,
            {
                headers: { 'Cookie': cookieHeader },
                timeout: 10000,
            }
        );

        const scopes = scopesResponse.data.data || [];

        // Paso 3: Crear API Key
        const apiKeyResponse = await axios.post(
            `${N8N_URL}/rest/api-keys`,
            {
                label: API_KEY_LABEL,
                expiresAt: null, // Sin expiración
                scopes: scopes,
            },
            {
                headers: {
                    'Cookie': cookieHeader,
                    'Content-Type': 'application/json',
                },
                timeout: 10000,
            }
        );

        const apiKey = apiKeyResponse.data.data.rawApiKey;

        if (!apiKey) {
            throw new Error('No se recibió API Key de n8n');
        }

        logger.info(`✅ API Key generado (${apiKey.substring(0, 20)}...)`);
        return apiKey;

    } catch (error) {
        logger.error('Error generando API Key:', error.response?.data || error.message);

        // Si el error es "already exists", intentar obtenerlo de la DB como fallback
        if (error.response?.data?.message?.includes('already an entry')) {
            logger.warn('API key ya existe según n8n, intentando obtenerlo de DB...');

            const fallbackResult = await database.queryDatabase(
                'n8n',
                `SELECT "apiKey" FROM user_api_keys
                 WHERE label = $1
                 ORDER BY "createdAt" DESC
                 LIMIT 1`,
                [API_KEY_LABEL]
            );

            if (fallbackResult.rows.length > 0) {
                const apiKey = fallbackResult.rows[0].apiKey;
                logger.info(`✅ API Key recuperado de DB como fallback (${apiKey.substring(0, 20)}...)`);
                return apiKey;
            }
        }

        throw new Error(
            `Error generando API Key: ${error.response?.data?.message || error.message}`
        );
    }
}

module.exports = {
    crearN8nOwner,
    generarN8nApiKey,
};
