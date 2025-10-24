/**
 * Controller de Chatbots - Gestión CRUD multi-tenant con integración n8n
 *
 * Orquesta la creación completa de chatbots:
 * 1. Validar credenciales con plataforma (Telegram API, etc)
 * 2. Crear credential en n8n
 * 3. Generar system prompt personalizado
 * 4. Crear workflow en n8n con template
 * 5. Activar workflow
 * 6. Guardar config en BD
 *
 * @module controllers/chatbot.controller
 */

const ChatbotConfigModel = require('../database/chatbot-config.model');
const N8nService = require('../services/n8nService');
const N8nCredentialService = require('../services/n8nCredentialService');
const N8nGlobalCredentialsService = require('../services/n8nGlobalCredentialsService');
const N8nMcpCredentialsService = require('../services/n8nMcpCredentialsService');
const TelegramValidator = require('../services/platformValidators/telegramValidator');
const { generarTokenMCP } = require('../utils/mcpTokenGenerator');
const { asyncHandler } = require('../middleware');
const { ResponseHelper } = require('../utils/helpers');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

class ChatbotController {

    /**
     * ====================================================================
     * CONFIGURAR NUEVO CHATBOT
     * ====================================================================
     * Endpoint principal que orquesta todo el flujo de creación
     *
     * @route POST /api/v1/chatbots/configurar
     */
    static configurar = asyncHandler(async (req, res) => {
        const { nombre, plataforma, config_plataforma, ai_model, ai_temperature, system_prompt } = req.body;
        const organizacionId = req.tenant.organizacionId;

        logger.info(`[ChatbotController] Iniciando configuración de chatbot ${plataforma} para org ${organizacionId}`);

        // ========== 1. Verificar que no exista chatbot para esta plataforma ==========
        const chatbotExistente = await ChatbotConfigModel.obtenerPorPlataforma(plataforma, organizacionId);
        if (chatbotExistente) {
            return ResponseHelper.error(
                res,
                `Ya existe un chatbot configurado para ${plataforma}. Elimínelo primero si desea crear uno nuevo.`,
                409
            );
        }

        // ========== 2. Validar credenciales con la plataforma ==========
        let validacionResult;
        let botInfo = null;

        try {
            switch (plataforma) {
                case 'telegram':
                    validacionResult = await TelegramValidator.validar(config_plataforma.bot_token);
                    if (!validacionResult.valido) {
                        return ResponseHelper.error(
                            res,
                            `Error validando bot de Telegram: ${validacionResult.error}`,
                            400
                        );
                    }
                    botInfo = validacionResult.bot_info;
                    logger.info(`[ChatbotController] Bot de Telegram validado: @${botInfo.username}`);
                    break;

            case 'whatsapp':
                // TODO: Implementar WhatsAppValidator en Fase futura
                logger.warn('[ChatbotController] Validación de WhatsApp no implementada aún');
                break;

            case 'instagram':
            case 'facebook_messenger':
            case 'slack':
            case 'discord':
            case 'otro':
                logger.warn(`[ChatbotController] Validación de ${plataforma} no implementada aún`);
                break;

                default:
                    return ResponseHelper.error(res, `Plataforma ${plataforma} no soportada`, 400);
            }
        } catch (validationError) {
            logger.error('[ChatbotController] Error en validación de plataforma:', validationError);
            return ResponseHelper.error(
                res,
                `Error al validar credenciales: ${validationError.message}`,
                500
            );
        }

        // ========== 3. Crear credential en n8n ==========
        let credentialCreada;
        try {
            credentialCreada = await N8nCredentialService.crearCredential({
                plataforma,
                nombre: `${nombre} - Credential`,
                config: config_plataforma,
                organizacion_id: organizacionId
            });

            logger.info(`[ChatbotController] Credential creada en n8n: ${credentialCreada.id}`);
        } catch (error) {
            logger.error('[ChatbotController] Error creando credential en n8n:', error.message);
            return ResponseHelper.error(
                res,
                `Error al crear credenciales en n8n: ${error.message}`,
                500
            );
        }

        // ========== 4. Crear/Obtener credential MCP para autenticación del AI Agent ==========
        let mcpCredential = null;
        try {
            // Estrategia: 1 credential por organización (compartida entre chatbots)
            // Esto reduce clutter en n8n y facilita rotación de tokens
            mcpCredential = await N8nMcpCredentialsService.obtenerOCrearPorOrganizacion(organizacionId);

            if (mcpCredential.reutilizada) {
                logger.info(`[ChatbotController] Credential MCP reutilizada para org ${organizacionId}: ${mcpCredential.id}`);
            } else {
                logger.info(`[ChatbotController] Credential MCP creada para org ${organizacionId}: ${mcpCredential.id}`);
            }
        } catch (mcpError) {
            logger.error('[ChatbotController] Error obteniendo/creando credential MCP:', mcpError);

            // Rollback: eliminar credential Telegram
            try {
                await N8nCredentialService.eliminarCredential(credentialCreada.id);
                logger.info(`[ChatbotController] Rollback: credential Telegram ${credentialCreada.id} eliminada`);
            } catch (rollbackError) {
                logger.error('[ChatbotController] Error en rollback de credential Telegram:', rollbackError.message);
            }

            return ResponseHelper.error(
                res,
                `Error al crear credential de autenticación MCP: ${mcpError.message}`,
                500
            );
        }

        // ========== 5. Generar system prompt personalizado (si no se proporcionó) ==========
        const systemPromptFinal = system_prompt || this._generarSystemPrompt(plataforma, botInfo, organizacionId);

        // ========== 6. Crear workflow en n8n con template ==========
        let workflowCreado;
        try {
            const workflowTemplate = await this._generarWorkflowTemplate({
                nombre,
                plataforma,
                credentialId: credentialCreada.id,
                systemPrompt: systemPromptFinal,
                aiModel: ai_model || 'deepseek-chat',
                aiTemperature: ai_temperature || 0.7,
                organizacionId,
                mcpCredential // Pasar credential MCP completa (id, name, type)
            });

            workflowCreado = await N8nService.crearWorkflow(workflowTemplate);
            logger.info(`[ChatbotController] Workflow creado en n8n: ${workflowCreado.id}`);
        } catch (error) {
            logger.error('[ChatbotController] Error creando workflow en n8n:', error.message);

            // Rollback: eliminar credentials creadas
            try {
                await N8nCredentialService.eliminarCredential(credentialCreada.id);
                logger.info(`[ChatbotController] Rollback: credential Telegram ${credentialCreada.id} eliminada`);

                // NOTA: No eliminamos mcpCredential aquí porque puede estar siendo usada
                // por otros chatbots de la misma organización (1 credential por org)
                logger.info(`[ChatbotController] Credential MCP ${mcpCredential.id} se mantiene (compartida por org)`);
            } catch (rollbackError) {
                logger.error('[ChatbotController] Error en rollback de credentials:', rollbackError.message);
            }

            return ResponseHelper.error(
                res,
                `Error al crear workflow en n8n: ${error.message}`,
                500
            );
        }

        // ========== 6. Activar workflow ==========
        let workflowActivado = false;
        try {
            await N8nService.activarWorkflow(workflowCreado.id);
            workflowActivado = true;
            logger.info(`[ChatbotController] Workflow ${workflowCreado.id} activado exitosamente`);
        } catch (error) {
            logger.warn(`[ChatbotController] No se pudo activar el workflow: ${error.message}`);
            // No hacer rollback, solo registrar el error
            // El chatbot quedará en estado 'configurando' o 'error'
        }

        // ========== 7. Guardar configuración en BD ==========
        try {
            const chatbotConfig = await ChatbotConfigModel.crear({
                organizacion_id: organizacionId,
                nombre,
                plataforma,
                config_plataforma,
                n8n_workflow_id: workflowCreado.id,
                n8n_credential_id: credentialCreada.id,
                mcp_credential_id: mcpCredential?.id || null, // Credential MCP compartida por org
                workflow_activo: workflowActivado,
                ai_model: ai_model || 'deepseek-chat',
                ai_temperature: ai_temperature || 0.7,
                system_prompt: systemPromptFinal,
                mcp_jwt_token: mcpCredential?.token || null, // Token JWT para auditoría
                estado: workflowActivado ? 'activo' : 'error',
                activo: true
            });

            logger.info(`[ChatbotController] Chatbot configurado exitosamente: ${chatbotConfig.id}`);

            return ResponseHelper.success(
                res,
                {
                    ...chatbotConfig,
                    bot_info: botInfo // Incluir info del bot validado (solo para Telegram)
                },
                'Chatbot configurado y activado exitosamente',
                201
            );
        } catch (error) {
            logger.error('[ChatbotController] Error guardando chatbot en BD:', {
                message: error.message,
                detail: error.detail,
                code: error.code,
                constraint: error.constraint,
                stack: error.stack
            });

            // Rollback: eliminar workflow y credential Telegram
            try {
                await N8nService.eliminarWorkflow(workflowCreado.id);
                await N8nCredentialService.eliminarCredential(credentialCreada.id);
                logger.info(`[ChatbotController] Rollback: workflow y credential Telegram eliminados`);

                // NOTA: No eliminamos mcpCredential porque puede estar siendo usada
                // por otros chatbots de la misma organización (1 credential por org)
                logger.info(`[ChatbotController] Credential MCP ${mcpCredential?.id} se mantiene (compartida por org)`);
            } catch (rollbackError) {
                logger.error('[ChatbotController] Error en rollback completo:', rollbackError.message);
            }

            return ResponseHelper.error(
                res,
                `Error al guardar configuración del chatbot: ${error.message || error.detail || 'Error desconocido'}`,
                500
            );
        }
    });

    /**
     * ====================================================================
     * LISTAR CHATBOTS
     * ====================================================================
     * @route GET /api/v1/chatbots
     */
    static listar = asyncHandler(async (req, res) => {
        const filtros = {};

        if (req.query.plataforma) {
            filtros.plataforma = req.query.plataforma;
        }

        if (req.query.estado) {
            filtros.estado = req.query.estado;
        }

        if (req.query.activo !== undefined) {
            filtros.activo = req.query.activo === 'true';
        }

        if (req.query.workflow_activo !== undefined) {
            filtros.workflow_activo = req.query.workflow_activo === 'true';
        }

        const paginacion = {
            pagina: parseInt(req.query.pagina) || 1,
            limite: parseInt(req.query.limite) || 20
        };

        const resultado = await ChatbotConfigModel.listarPorOrganizacion(
            req.tenant.organizacionId,
            filtros,
            paginacion
        );

        return ResponseHelper.success(res, resultado, 'Chatbots listados exitosamente');
    });

    /**
     * ====================================================================
     * OBTENER CHATBOT POR ID
     * ====================================================================
     * @route GET /api/v1/chatbots/:id
     */
    static obtener = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const chatbot = await ChatbotConfigModel.obtenerPorId(parseInt(id), req.tenant.organizacionId);

        if (!chatbot) {
            return ResponseHelper.error(res, 'Chatbot no encontrado', 404);
        }

        return ResponseHelper.success(res, chatbot, 'Chatbot obtenido exitosamente');
    });

    /**
     * ====================================================================
     * ACTUALIZAR CHATBOT
     * ====================================================================
     * @route PUT /api/v1/chatbots/:id
     */
    static actualizar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const chatbotData = { ...req.body };

        const chatbotActualizado = await ChatbotConfigModel.actualizar(
            parseInt(id),
            chatbotData,
            req.tenant.organizacionId
        );

        if (!chatbotActualizado) {
            return ResponseHelper.error(res, 'Chatbot no encontrado', 404);
        }

        return ResponseHelper.success(res, chatbotActualizado, 'Chatbot actualizado exitosamente');
    });

    /**
     * ====================================================================
     * ELIMINAR CHATBOT
     * ====================================================================
     * Elimina el chatbot, el workflow y la credential de n8n
     *
     * @route DELETE /api/v1/chatbots/:id
     */
    static eliminar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        // 1. Obtener chatbot para tener IDs de n8n
        const chatbot = await ChatbotConfigModel.obtenerPorId(parseInt(id), organizacionId);

        if (!chatbot) {
            return ResponseHelper.error(res, 'Chatbot no encontrado', 404);
        }

        // 2. Eliminar workflow de n8n (si existe)
        if (chatbot.n8n_workflow_id) {
            try {
                await N8nService.eliminarWorkflow(chatbot.n8n_workflow_id);
                logger.info(`[ChatbotController] Workflow ${chatbot.n8n_workflow_id} eliminado de n8n`);
            } catch (error) {
                logger.warn(`[ChatbotController] Error eliminando workflow: ${error.message}`);
                // Continuar con la eliminación aunque falle
            }
        }

        // 3. Eliminar credential de n8n (si existe)
        if (chatbot.n8n_credential_id) {
            try {
                await N8nCredentialService.eliminarCredential(chatbot.n8n_credential_id);
                logger.info(`[ChatbotController] Credential ${chatbot.n8n_credential_id} eliminada de n8n`);
            } catch (error) {
                logger.warn(`[ChatbotController] Error eliminando credential: ${error.message}`);
                // Continuar con la eliminación aunque falle
            }
        }

        // 4. Eliminar de BD (soft delete)
        const eliminado = await ChatbotConfigModel.eliminar(parseInt(id), organizacionId);

        if (!eliminado) {
            return ResponseHelper.error(res, 'Error al eliminar chatbot', 500);
        }

        return ResponseHelper.success(res, null, 'Chatbot eliminado exitosamente');
    });

    /**
     * ====================================================================
     * OBTENER ESTADÍSTICAS
     * ====================================================================
     * @route GET /api/v1/chatbots/estadisticas
     */
    static obtenerEstadisticas = asyncHandler(async (req, res) => {
        const estadisticas = await ChatbotConfigModel.obtenerEstadisticas(req.tenant.organizacionId);

        return ResponseHelper.success(res, estadisticas, 'Estadísticas de chatbots obtenidas exitosamente');
    });

    /**
     * ====================================================================
     * ACTUALIZAR ESTADO
     * ====================================================================
     * @route PATCH /api/v1/chatbots/:id/estado
     */
    static actualizarEstado = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { estado } = req.body;

        const chatbotActualizado = await ChatbotConfigModel.actualizarEstado(
            parseInt(id),
            estado,
            req.tenant.organizacionId
        );

        if (!chatbotActualizado) {
            return ResponseHelper.error(res, 'Chatbot no encontrado', 404);
        }

        return ResponseHelper.success(res, chatbotActualizado, 'Estado del chatbot actualizado exitosamente');
    });

    /**
     * ====================================================================
     * MÉTODOS PRIVADOS - TEMPLATES Y UTILITIES
     * ====================================================================
     */

    /**
     * Genera el system prompt personalizado para el AI Agent
     */
    static _generarSystemPrompt(plataforma, botInfo, organizacionId) {
        const botName = botInfo?.first_name || 'Asistente Virtual';
        const username = botInfo?.username ? `@${botInfo.username}` : '';

        return `Eres ${botName} ${username}, un asistente virtual inteligente de atención al cliente para una empresa de agendamiento de citas.

Tu misión es ayudar a los clientes a:
- Agendar nuevas citas
- Consultar sus citas existentes
- Modificar o cancelar citas
- Resolver dudas sobre servicios y precios
- Proporcionar información de contacto

IMPORTANTE:
- Sé amable, profesional y empático
- Si no tienes información, ofrece conectar con un humano
- Confirma siempre los datos antes de crear una cita
- Organización ID: ${organizacionId}
- Plataforma: ${plataforma}

Responde de forma concisa y clara. Usa emojis con moderación para mantener un tono amigable.`;
    }

    /**
     * Genera el template del workflow de n8n desde plantilla.json
     *
     * Lee flows/plantilla/plantilla.json y reemplaza dinámicamente:
     * - Nombre del workflow
     * - Credentials de Telegram
     * - Credentials globales (DeepSeek, PostgreSQL, Redis)
     * - System prompt personalizado
     * - Configuración de MCP tools (cuando estén disponibles)
     */
    static async _generarWorkflowTemplate({ nombre, plataforma, credentialId, systemPrompt, aiModel, aiTemperature, organizacionId, mcpCredential }) {
        try {
            // 1. Leer plantilla base desde archivo
            const plantillaPath = path.join(__dirname, '../flows/plantilla/plantilla.json');

            if (!fs.existsSync(plantillaPath)) {
                throw new Error(`Plantilla no encontrada en: ${plantillaPath}`);
            }

            const plantillaRaw = fs.readFileSync(plantillaPath, 'utf8');
            const plantilla = JSON.parse(plantillaRaw);

            logger.debug(`[ChatbotController] Plantilla cargada: ${plantilla.nodes.length} nodos`);

            // 2. Obtener credentials globales (DeepSeek, PostgreSQL, Redis)
            const globalCreds = await N8nGlobalCredentialsService.obtenerTodasLasCredentials();

            logger.debug(`[ChatbotController] Credentials globales obtenidas:`, {
                deepseek: globalCreds.deepseek?.id || 'N/A',
                postgres: globalCreds.postgres?.id || 'N/A',
                redis: globalCreds.redis?.id || 'N/A'
            });

            // 3. Actualizar nombre del workflow
            plantilla.name = `${nombre} - Telegram Bot`;

            // 4. Recorrer nodos y reemplazar credentials y configuraciones
            plantilla.nodes.forEach(node => {
                // 4.1 Reemplazar credentials de Telegram (Trigger + Send Message)
                if (node.type === 'n8n-nodes-base.telegramTrigger' ||
                    node.type === 'n8n-nodes-base.telegram') {
                    if (node.credentials && node.credentials.telegramApi) {
                        node.credentials.telegramApi.id = credentialId;
                        node.credentials.telegramApi.name = `${nombre} - Telegram`;
                    }
                }

                // 4.2 Reemplazar credential de DeepSeek
                if (node.type === '@n8n/n8n-nodes-langchain.lmChatDeepSeek') {
                    if (node.credentials && node.credentials.deepSeekApi) {
                        node.credentials.deepSeekApi.id = globalCreds.deepseek.id;
                        node.credentials.deepSeekApi.name = globalCreds.deepseek.name;
                    }
                }

                // 4.3 Reemplazar credential de PostgreSQL (Chat Memory)
                if (node.type === '@n8n/n8n-nodes-langchain.memoryPostgresChat') {
                    if (node.credentials && node.credentials.postgres) {
                        node.credentials.postgres.id = globalCreds.postgres.id;
                        node.credentials.postgres.name = globalCreds.postgres.name;
                    }
                }

                // 4.4 Reemplazar credentials de Redis
                if (node.type === 'n8n-nodes-base.redis') {
                    if (node.credentials && node.credentials.redis) {
                        node.credentials.redis.id = globalCreds.redis.id;
                        node.credentials.redis.name = globalCreds.redis.name;
                    }
                }

                // 4.5 Actualizar System Prompt en AI Agent
                if (node.type === '@n8n/n8n-nodes-langchain.agent') {
                    if (node.parameters && node.parameters.options) {
                        node.parameters.options.systemMessage = systemPrompt;
                    }
                }

                // 4.6 Configurar MCP Client Tools con credential httpHeaderAuth
                if (node.type === '@n8n/n8n-nodes-langchain.mcpClientTool') {
                    // Migrar serverUrl (v1.1) a endpointUrl (v1.2+)
                    if (node.parameters.serverUrl && !node.parameters.endpointUrl) {
                        node.parameters.endpointUrl = node.parameters.serverUrl;
                        delete node.parameters.serverUrl;
                        logger.debug(`[ChatbotController] Migrado serverUrl → endpointUrl: ${node.parameters.endpointUrl}`);
                    }

                    // Actualizar typeVersion si es necesario
                    if (node.typeVersion && node.typeVersion < 1.2) {
                        node.typeVersion = 1.2;
                    }

                    if (mcpCredential) {
                        // ✅ Usar autenticación oficial de n8n con credential httpHeaderAuth
                        // La propiedad 'authentication' va en parameters, NO al nivel del nodo
                        node.parameters.authentication = 'headerAuth';

                        // La propiedad 'credentials' SÍ va al nivel del nodo
                        node.credentials = {
                            httpHeaderAuth: {
                                id: mcpCredential.id,
                                name: mcpCredential.name
                            }
                        };

                        // Limpiar el campo options si existe (ya no es necesario)
                        if (node.parameters && node.parameters.options) {
                            delete node.parameters.options;
                        }

                        logger.debug(`[ChatbotController] Nodo MCP Client configurado: ${node.name} (credential: ${mcpCredential.id})`);
                    } else {
                        logger.warn(`[ChatbotController] Nodo MCP Client sin credential: ${node.name} (MCP tools no funcionarán)`);
                    }
                }
            });

            // 5. Limpiar IDs y campos read-only (n8n los regenerará)
            delete plantilla.id;
            delete plantilla.versionId;
            delete plantilla.pinData;  // Eliminar pinData (datos de prueba)
            delete plantilla.tags;     // Eliminar tags (aunque esté vacío)
            delete plantilla.meta;     // Eliminar meta completo (no solo instanceId)
            delete plantilla.active;   // Campo read-only, n8n lo gestiona

            // 6. Limpiar IDs y campos auto-generados de nodos (n8n los regenerará)
            plantilla.nodes.forEach(node => {
                delete node.id;  // n8n genera IDs automáticamente al crear
                if (node.webhookId) {
                    delete node.webhookId;
                }

                // 6.1 Limpiar IDs dentro de assignments (Edit Fields node)
                if (node.parameters?.assignments?.assignments) {
                    node.parameters.assignments.assignments.forEach(assignment => {
                        delete assignment.id;
                    });
                }

                // 6.2 Limpiar IDs dentro de conditions (If node)
                if (node.parameters?.conditions?.conditions) {
                    node.parameters.conditions.conditions.forEach(condition => {
                        delete condition.id;
                    });
                }
            });

            logger.info(`[ChatbotController] Workflow template generado exitosamente`);

            return plantilla;

        } catch (error) {
            logger.error('[ChatbotController] Error generando workflow template:', error.message);
            throw new Error(`Error generando workflow: ${error.message}`);
        }
    }
}

module.exports = ChatbotController;
