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
const TelegramValidator = require('../services/platformValidators/telegramValidator');
const { asyncHandler } = require('../middleware');
const { ResponseHelper } = require('../utils/helpers');
const logger = require('../utils/logger');

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
            logger.error('[ChatbotController] Error creando credential en n8n:', error);
            return ResponseHelper.error(
                res,
                `Error al crear credenciales en n8n: ${error.message}`,
                500
            );
        }

        // ========== 4. Generar system prompt personalizado (si no se proporcionó) ==========
        const systemPromptFinal = system_prompt || this._generarSystemPrompt(plataforma, botInfo, organizacionId);

        // ========== 5. Crear workflow en n8n con template ==========
        let workflowCreado;
        try {
            const workflowTemplate = this._generarWorkflowTemplate({
                nombre,
                plataforma,
                credentialId: credentialCreada.id,
                systemPrompt: systemPromptFinal,
                aiModel: ai_model || 'deepseek-chat',
                aiTemperature: ai_temperature || 0.7,
                organizacionId
            });

            workflowCreado = await N8nService.crearWorkflow(workflowTemplate);
            logger.info(`[ChatbotController] Workflow creado en n8n: ${workflowCreado.id}`);
        } catch (error) {
            logger.error('[ChatbotController] Error creando workflow en n8n:', error);

            // Rollback: eliminar credential creada
            try {
                await N8nCredentialService.eliminarCredential(credentialCreada.id);
                logger.info(`[ChatbotController] Rollback: credential ${credentialCreada.id} eliminada`);
            } catch (rollbackError) {
                logger.error('[ChatbotController] Error en rollback de credential:', rollbackError);
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
                workflow_activo: workflowActivado,
                ai_model: ai_model || 'deepseek-chat',
                ai_temperature: ai_temperature || 0.7,
                system_prompt: systemPromptFinal,
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
            logger.error('[ChatbotController] Error guardando chatbot en BD:', error);

            // Rollback: eliminar workflow y credential
            try {
                await N8nService.eliminarWorkflow(workflowCreado.id);
                await N8nCredentialService.eliminarCredential(credentialCreada.id);
                logger.info(`[ChatbotController] Rollback completo ejecutado`);
            } catch (rollbackError) {
                logger.error('[ChatbotController] Error en rollback completo:', rollbackError);
            }

            return ResponseHelper.error(
                res,
                `Error al guardar configuración del chatbot: ${error.message}`,
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
     * Genera el template del workflow de n8n para la plataforma especificada
     *
     * IMPORTANTE: Este es un template básico. En Fase 5 se implementará
     * el WorkflowTemplateEngine completo con todos los nodos del AI Agent.
     */
    static _generarWorkflowTemplate({ nombre, plataforma, credentialId, systemPrompt, aiModel, aiTemperature, organizacionId }) {
        // Template básico con nodo Telegram Trigger + AI Agent (placeholder)
        // TODO: Expandir en Fase 5 con nodos de:
        // - AI Agent (con herramientas MCP)
        // - Chat Memory (PostgreSQL)
        // - Error Handling
        // - Logging

        const workflowTemplate = {
            name: `${nombre} - ${plataforma}`,
            nodes: [
                // Nodo 1: Trigger de Telegram
                {
                    parameters: {
                        updates: ['message']
                    },
                    id: 'telegram-trigger',
                    name: 'Telegram Trigger',
                    type: 'n8n-nodes-base.telegramTrigger',
                    typeVersion: 1.1,
                    position: [250, 300],
                    credentials: {
                        telegramApi: {
                            id: credentialId,
                            name: `${nombre} - Credential`
                        }
                    }
                },
                // Nodo 2: Placeholder para AI Agent (implementar en Fase 5)
                {
                    parameters: {
                        text: `Echo: {{ $json.message.text }}\n\n(AI Agent en desarrollo - Fase 5)`,
                        chatId: '={{ $json.message.chat.id }}',
                        additionalFields: {}
                    },
                    id: 'telegram-response',
                    name: 'Send Message',
                    type: 'n8n-nodes-base.telegram',
                    typeVersion: 1.1,
                    position: [450, 300],
                    credentials: {
                        telegramApi: {
                            id: credentialId,
                            name: `${nombre} - Credential`
                        }
                    }
                }
            ],
            connections: {
                'Telegram Trigger': {
                    main: [[{ node: 'Send Message', type: 'main', index: 0 }]]
                }
            },
            settings: {}
        };

        return workflowTemplate;
    }
}

module.exports = ChatbotController;
