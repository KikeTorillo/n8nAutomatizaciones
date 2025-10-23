/**
 * ====================================================================
 * MCP TOKEN GENERATOR - Generador de Tokens JWT para MCP Server
 * ====================================================================
 *
 * Genera tokens JWT únicos por chatbot para autenticación multi-tenant
 * del MCP Server con el backend API.
 *
 * ARQUITECTURA MULTI-TENANT:
 * - Cada chatbot tiene su propio token JWT
 * - El token contiene el organizacion_id del chatbot
 * - El MCP Server recibe el token en cada request
 * - El backend valida el token y aplica RLS según organizacion_id
 *
 * @module utils/mcpTokenGenerator
 */

const jwt = require('jsonwebtoken');
const logger = require('./logger');
const RLSContextManager = require('./rlsContextManager');

/**
 * ====================================================================
 * OBTENER O CREAR USUARIO BOT
 * ====================================================================
 *
 * Obtiene el usuario bot de una organización. Si no existe, lo crea.
 * Cada organización debe tener un usuario con rol 'bot' para que
 * el MCP Server pueda autenticarse.
 *
 * @param {number} organizacionId - ID de la organización
 * @returns {Promise<Object>} Usuario bot { id, email, rol }
 */
async function obtenerOCrearUsuarioBot(organizacionId) {
    try {
        // Usar RLSContextManager para ejecutar queries con RLS
        const result = await RLSContextManager.query(organizacionId, async (db) => {
            // Intentar obtener usuario bot existente
            const querySelect = `
                SELECT id, email, rol
                FROM usuarios
                WHERE organizacion_id = $1 AND rol = 'bot'
                LIMIT 1
            `;

            let result = await db.query(querySelect, [organizacionId]);

            // Si existe, retornarlo
            if (result.rows.length > 0) {
                logger.debug(`Usuario bot encontrado para org ${organizacionId}: ${result.rows[0].id}`);
                return result.rows[0];
            }

            // Si no existe, crearlo
            logger.info(`Creando usuario bot para organización ${organizacionId}...`);

            const queryInsert = `
                INSERT INTO usuarios (
                    organizacion_id,
                    nombre,
                    apellidos,
                    email,
                    password_hash,
                    rol,
                    activo
                ) VALUES (
                    $1,
                    'MCP Bot',
                    'Service Account',
                    $2,
                    'bot-service-account-no-password',
                    'bot',
                    true
                )
                RETURNING id, email, rol
            `;

            const email = `mcp-bot@org${organizacionId}.internal`;

            result = await db.query(queryInsert, [organizacionId, email]);

            logger.info(`Usuario bot creado exitosamente: ${result.rows[0].id}`);

            return result.rows[0];
        });

        return result;

    } catch (error) {
        logger.error('Error obteniendo/creando usuario bot:', error);
        throw new Error(`Error al gestionar usuario bot: ${error.message}`);
    }
}

/**
 * ====================================================================
 * GENERAR TOKEN MCP
 * ====================================================================
 *
 * Genera un token JWT de larga duración (180 días) para que un chatbot
 * específico pueda autenticarse con el backend vía MCP Server.
 *
 * El token contiene:
 * - userId: ID del usuario bot
 * - organizacionId: ID de la organización (para RLS)
 * - rol: 'bot'
 * - type: 'mcp_service'
 * - chatbotId: ID del chatbot (opcional, para auditoría)
 *
 * @param {number} organizacionId - ID de la organización
 * @param {number} chatbotId - ID del chatbot (opcional)
 * @returns {Promise<string>} Token JWT
 */
async function generarTokenMCP(organizacionId, chatbotId = null) {
    try {
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET no está configurado en .env');
        }

        // Obtener o crear usuario bot
        const usuarioBot = await obtenerOCrearUsuarioBot(organizacionId);

        // Preparar payload del token
        const payload = {
            userId: usuarioBot.id,
            organizacionId: organizacionId,
            rol: usuarioBot.rol, // 'bot'
            type: 'mcp_service',
            email: usuarioBot.email,
        };

        // Agregar chatbotId si se proporciona (para auditoría)
        if (chatbotId) {
            payload.chatbotId = chatbotId;
        }

        // Configurar opciones del token
        const options = {
            expiresIn: '180d', // 180 días (6 meses)
            issuer: 'saas-backend',
            audience: 'mcp-server',
        };

        // Generar token
        const token = jwt.sign(payload, process.env.JWT_SECRET, options);

        logger.info(`Token MCP generado para org ${organizacionId}`, {
            chatbotId,
            userId: usuarioBot.id,
            expiresIn: '180d',
        });

        return token;

    } catch (error) {
        logger.error('Error generando token MCP:', error);
        throw new Error(`Error al generar token MCP: ${error.message}`);
    }
}

/**
 * ====================================================================
 * VALIDAR TOKEN MCP
 * ====================================================================
 *
 * Valida un token MCP y extrae su payload.
 * Útil para debugging y verificación.
 *
 * @param {string} token - Token JWT a validar
 * @returns {Object} Payload del token decodificado
 * @throws {Error} Si el token es inválido o expiró
 */
function validarTokenMCP(token) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            issuer: 'saas-backend',
            audience: 'mcp-server',
        });

        return decoded;

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Token MCP expirado. Regenerar desde el backend.');
        }

        if (error.name === 'JsonWebTokenError') {
            throw new Error('Token MCP inválido. Verificar firma.');
        }

        throw new Error(`Error validando token MCP: ${error.message}`);
    }
}

/**
 * ====================================================================
 * DECODIFICAR TOKEN SIN VALIDAR
 * ====================================================================
 *
 * Decodifica un token sin validar la firma.
 * Útil para debugging y obtener información del token.
 *
 * @param {string} token - Token JWT
 * @returns {Object|null} Payload decodificado o null si falla
 */
function decodificarTokenMCP(token) {
    try {
        return jwt.decode(token);
    } catch (error) {
        logger.error('Error decodificando token MCP:', error);
        return null;
    }
}

// ====================================================================
// EXPORTS
// ====================================================================

module.exports = {
    generarTokenMCP,
    validarTokenMCP,
    decodificarTokenMCP,
    obtenerOCrearUsuarioBot,
};
