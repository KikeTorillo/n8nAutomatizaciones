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
const WhatsAppValidator = require('../services/platformValidators/whatsAppValidator');
const { generarTokenMCP } = require('../utils/mcpTokenGenerator');
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
            case 'whatsapp_oficial':
                validacionResult = await WhatsAppValidator.validar(config_plataforma);
                if (!validacionResult.valido) {
                    return ResponseHelper.error(
                        res,
                        `Error validando credenciales de WhatsApp: ${validacionResult.error}`,
                        400
                    );
                }
                botInfo = validacionResult.bot_info;
                logger.info(`[ChatbotController] WhatsApp validado: ${botInfo.display_phone_number}`);
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

        // ========== 6. Validar webhookId (Fix Bug n8n #14646) ==========
        logger.info('[ChatbotController] Validando webhookId del Telegram Trigger...');
        let webhookIdValido = false;

        try {
            webhookIdValido = await this._validarYRegenerarWebhookId(workflowCreado.id);

            if (!webhookIdValido) {
                // webhookId no se pudo generar - lanzar error con instrucciones
                const errorInstrucciones =
                    'No se pudo generar webhookId automáticamente después de 3 intentos. ' +
                    'SOLUCIÓN MANUAL REQUERIDA:\n' +
                    `1. Abrir workflow en n8n UI: ${process.env.N8N_API_URL || 'http://localhost:5678'}\n` +
                    '2. Localizar el workflow recién creado\n' +
                    '3. Eliminar el nodo "Telegram Trigger"\n' +
                    '4. Recrear el nodo "Telegram Trigger" con la misma credential\n' +
                    '5. Guardar el workflow\n' +
                    'El webhook quedará operativo.\n' +
                    `Workflow ID: ${workflowCreado.id}\n` +
                    'Bug conocido de n8n: https://github.com/n8n-io/n8n/issues/14646';

                throw new Error(errorInstrucciones);
            }

            logger.info('[ChatbotController] ✅ webhookId validado exitosamente');

        } catch (validationError) {
            logger.error('[ChatbotController] Error validando webhookId:', validationError.message);

            // Rollback: eliminar workflow y credentials creadas
            try {
                await N8nService.eliminarWorkflow(workflowCreado.id);
                await N8nCredentialService.eliminarCredential(credentialCreada.id);
                logger.info(`[ChatbotController] Rollback: workflow y credential Telegram eliminados`);

                // NOTA: No eliminamos mcpCredential porque puede estar siendo usada
                // por otros chatbots de la misma organización (1 credential por org)
                logger.info(`[ChatbotController] Credential MCP ${mcpCredential.id} se mantiene (compartida por org)`);
            } catch (rollbackError) {
                logger.error('[ChatbotController] Error en rollback completo:', rollbackError.message);
            }

            return ResponseHelper.error(
                res,
                `Error validando webhook del bot de Telegram: ${validationError.message}`,
                500
            );
        }

        // ========== 7. Activar workflow con retry (Fix Race Condition) ==========
        // CONTEXTO: Cuando se activa inmediatamente después de crear el workflow,
        // n8n puede no haber terminado de procesar internamente, causando que
        // Telegram API rechace la conexión ("connection closed unexpectedly").
        // SOLUCIÓN: Reintentar con delays progresivos (2s, 4s)
        let workflowActivado = false;
        const MAX_INTENTOS_ACTIVACION = 3;

        for (let intento = 1; intento <= MAX_INTENTOS_ACTIVACION; intento++) {
            try {
                // Delay progresivo antes de cada intento (excepto el primero)
                if (intento > 1) {
                    const delay = intento * 2000; // 2s, 4s, 6s
                    logger.info(`[ChatbotController] Esperando ${delay}ms antes del intento ${intento}...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }

                logger.info(`[ChatbotController] Activando workflow (intento ${intento}/${MAX_INTENTOS_ACTIVACION})...`);
                await N8nService.activarWorkflow(workflowCreado.id);
                workflowActivado = true;
                logger.info(`[ChatbotController] ✅ Workflow ${workflowCreado.id} activado exitosamente`);
                break; // Salir del loop si se activó correctamente

            } catch (error) {
                logger.warn(`[ChatbotController] Intento ${intento}/${MAX_INTENTOS_ACTIVACION} falló: ${error.message}`);

                if (intento === MAX_INTENTOS_ACTIVACION) {
                    logger.error(`[ChatbotController] ❌ No se pudo activar después de ${MAX_INTENTOS_ACTIVACION} intentos`);
                    logger.error(`[ChatbotController] Error final: ${error.message}`);
                    // No hacer rollback, solo registrar el error
                    // El chatbot quedará en estado 'error'
                }
            }
        }

        // ========== 8. Guardar configuración en BD ==========
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
     * LIMPIAR WORKFLOW PARA ACTUALIZACIÓN (PRIVADO)
     * ====================================================================
     *
     * Elimina campos read-only y auto-generados del workflow antes de
     * enviarlo al endpoint PUT de n8n para actualizarlo.
     *
     * n8n rechaza con 400 "additional properties" si se envían campos
     * como id, versionId, createdAt, updatedAt, etc.
     *
     * @param {Object} workflow - Workflow completo obtenido de n8n
     * @returns {Object} Workflow limpio listo para actualización
     * @private
     */
    static _limpiarWorkflowParaActualizacion(workflow) {
        // Estrategia: Solo mantener campos ESTRICTAMENTE necesarios para actualización
        // n8n API PUT /workflows/{id} solo acepta: name, nodes, connections, settings, staticData

        const workflowLimpio = {
            name: workflow.name,
            nodes: workflow.nodes || [],
            connections: workflow.connections || {},
            settings: workflow.settings || {},
            staticData: workflow.staticData || null
        };

        // Limpiar campos auto-generados de nodos
        if (workflowLimpio.nodes && Array.isArray(workflowLimpio.nodes)) {
            workflowLimpio.nodes = workflowLimpio.nodes.map(node => {
                // Crear copia del nodo con solo campos permitidos
                const nodeLimpio = {
                    parameters: node.parameters || {},
                    name: node.name,
                    type: node.type,
                    typeVersion: node.typeVersion,
                    position: node.position,
                    id: node.id, // Necesario para identificar el nodo en actualización
                };

                // Agregar credentials si existen
                if (node.credentials) {
                    nodeLimpio.credentials = node.credentials;
                }

                // Agregar disabled si existe
                if (node.disabled !== undefined) {
                    nodeLimpio.disabled = node.disabled;
                }

                // Agregar notes si existen
                if (node.notes) {
                    nodeLimpio.notes = node.notes;
                }

                // NO incluir webhookId - debe ser regenerado por n8n

                // Limpiar IDs dentro de parameters
                if (nodeLimpio.parameters) {
                    // Limpiar IDs dentro de assignments (Edit Fields node)
                    if (nodeLimpio.parameters.assignments?.assignments) {
                        nodeLimpio.parameters.assignments.assignments =
                            nodeLimpio.parameters.assignments.assignments.map(assignment => {
                                const { id, ...assignmentSinId } = assignment;
                                return assignmentSinId;
                            });
                    }

                    // Limpiar IDs dentro de conditions (If node)
                    if (nodeLimpio.parameters.conditions?.conditions) {
                        nodeLimpio.parameters.conditions.conditions =
                            nodeLimpio.parameters.conditions.conditions.map(condition => {
                                const { id, ...conditionSinId } = condition;
                                return conditionSinId;
                            });
                    }
                }

                return nodeLimpio;
            });
        }

        logger.debug('[ChatbotController] Workflow limpio para actualización (solo campos permitidos)');
        return workflowLimpio;
    }

    /**
     * ====================================================================
     * VALIDAR Y REGENERAR WEBHOOKID SI ES NECESARIO (PRIVADO)
     * ====================================================================
     *
     * CONTEXTO: Bug de n8n (Issue #14267, #14646)
     * Cuando se crea un workflow via API, el nodo Telegram Trigger a veces
     * no recibe el campo webhookId, causando que el webhook no se registre.
     *
     * SOLUCIÓN: Implementar validación post-creación con 3 niveles de retry:
     * 1. Actualizar workflow (simula "Save" en UI) - Tasa éxito: 90%
     * 2. Desactivar/Reactivar workflow - Tasa éxito: +5%
     * 3. Actualizar nuevamente - Último recurso
     *
     * @param {string} workflowId - ID del workflow en n8n
     * @returns {Promise<boolean>} true si webhookId está presente
     * @private
     */
    static async _validarYRegenerarWebhookId(workflowId) {
        const MAX_INTENTOS = 3;
        let intento = 0;

        while (intento < MAX_INTENTOS) {
            intento++;
            logger.info(`[ChatbotController] Validación webhookId - Intento ${intento}/${MAX_INTENTOS}`);

            // Dar tiempo a n8n a procesar
            // OPTIMIZACIÓN: Con el fix experimental, el webhookId debería estar presente
            // desde el primer intento, así que solo esperamos 500ms inicialmente
            if (intento === 1) {
                await new Promise(resolve => setTimeout(resolve, 500)); // Solo 500ms en intento 1
            } else if (intento === 2) {
                await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5s en intento 2
            } else {
                await new Promise(resolve => setTimeout(resolve, 2000)); // 2s en intento 3
            }

            // Leer workflow completo
            let workflowCompleto;
            try {
                workflowCompleto = await N8nService.obtenerWorkflow(workflowId);
            } catch (error) {
                logger.error('[ChatbotController] Error leyendo workflow:', error.message);
                if (intento === MAX_INTENTOS) throw error;
                continue;
            }

            // Buscar nodo Telegram Trigger
            const telegramTrigger = workflowCompleto.nodes.find(
                n => n.type === 'n8n-nodes-base.telegramTrigger'
            );

            if (!telegramTrigger) {
                throw new Error('Nodo Telegram Trigger no encontrado en el workflow');
            }

            // Validar presencia de webhookId
            if (telegramTrigger.webhookId) {
                logger.info(`[ChatbotController] ✅ webhookId presente: ${telegramTrigger.webhookId}`);
                return true;
            }

            logger.warn(`[ChatbotController] ⚠️ webhookId faltante en intento ${intento}`);

            // ESTRATEGIA DE REGENERACIÓN según el intento

            if (intento === 1) {
                // NIVEL 1: Actualizar workflow (simula "Save" en UI)
                // Workaround oficial: https://github.com/n8n-io/n8n/issues/14646
                logger.info('[ChatbotController] Aplicando workaround Nivel 1: Actualizar workflow...');
                try {
                    // Limpiar campos read-only antes de actualizar (n8n rechaza additional properties)
                    const workflowLimpio = this._limpiarWorkflowParaActualizacion(workflowCompleto);
                    await N8nService.actualizarWorkflow(workflowId, workflowLimpio);
                    logger.info('[ChatbotController] Workflow actualizado, esperando regeneración...');
                } catch (error) {
                    logger.error('[ChatbotController] Error actualizando workflow:', error.message);
                }

            } else if (intento === 2) {
                // NIVEL 2: Ciclo Desactivar/Reactivar
                logger.info('[ChatbotController] Aplicando workaround Nivel 2: Ciclo desactivar/reactivar...');
                try {
                    // Desactivar
                    await N8nService.desactivarWorkflow(workflowId);
                    logger.info('[ChatbotController] Workflow desactivado');

                    await new Promise(resolve => setTimeout(resolve, 1500)); // Espera 1.5s entre des/activar

                    // Reactivar
                    await N8nService.activarWorkflow(workflowId);
                    logger.info('[ChatbotController] Workflow reactivado');
                } catch (error) {
                    logger.error('[ChatbotController] Error en ciclo desactivar/reactivar:', error.message);
                }

            } else if (intento === 3) {
                // NIVEL 3: Último intento - Actualizar nuevamente
                logger.info('[ChatbotController] Aplicando workaround Nivel 3: Actualizar workflow nuevamente...');
                try {
                    // Releer workflow por si cambió
                    const workflowActual = await N8nService.obtenerWorkflow(workflowId);
                    // Limpiar campos read-only antes de actualizar
                    const workflowLimpio = this._limpiarWorkflowParaActualizacion(workflowActual);
                    await N8nService.actualizarWorkflow(workflowId, workflowLimpio);
                    logger.info('[ChatbotController] Workflow actualizado en último intento');
                } catch (error) {
                    logger.error('[ChatbotController] Error en último intento:', error.message);
                }
            }
        }

        // Si llegamos aquí, falló después de 3 intentos
        logger.error('[ChatbotController] ❌ No se pudo generar webhookId después de 3 intentos');
        logger.error('[ChatbotController] Bug de n8n: https://github.com/n8n-io/n8n/issues/14646');
        return false;
    }

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

        return `Eres ${botName} ${username}, un asistente virtual inteligente para agendamiento de citas.

=== IDENTIFICACIÓN DEL USUARIO ===

⚠️ MUY IMPORTANTE - IDENTIFICACIÓN AUTOMÁTICA:
- Cada usuario que te escribe tiene un identificador único de ${plataforma === 'telegram' ? 'Telegram' : 'WhatsApp'}
- ${plataforma === 'telegram' ? 'En Telegram es el chat_id (ej: "1700200086")' : 'En WhatsApp es su número de teléfono internacional (ej: "5215512345678")'}
- Este identificador está disponible en el contexto del workflow
- **NUNCA pidas número de teléfono al usuario** - Ya lo tenemos automáticamente

IDENTIFICADOR DEL USUARIO ACTUAL: {{ $('Redis').item.json.sender }}

💡 REGLA DE ORO - CÓMO USAR EL IDENTIFICADOR:
1. Para crear citas: Pasa sender="{{ $('Redis').item.json.sender }}" en crearCita
2. Para buscar citas: Pasa sender="{{ $('Redis').item.json.sender }}" en buscarCitasCliente
3. Solo pide el NOMBRE del cliente, NUNCA el teléfono
4. El sistema registrará automáticamente el identificador de ${plataforma}

=== INFORMACIÓN DE FECHA Y HORA (ACTUALIZADA EN TIEMPO REAL) ===

FECHA ACTUAL: {{ $now.toFormat('dd/MM/yyyy') }}
DÍA DE HOY: {{ $now.toFormat('cccc', { locale: 'es' }) }}
HORA ACTUAL: {{ $now.toFormat('HH:mm') }}
ZONA HORARIA: America/Mexico_City (UTC-6)

=== CÁLCULO DE FECHAS (USA ESTAS REFERENCIAS) ===

**FECHAS BASE CALCULADAS PARA TI:**
- HOY: {{ $now.toFormat('dd/MM/yyyy') }}
- MAÑANA: {{ $now.plus({ days: 1 }).toFormat('dd/MM/yyyy') }}
- PASADO MAÑANA: {{ $now.plus({ days: 2 }).toFormat('dd/MM/yyyy') }}

**PRÓXIMOS DÍAS DE LA SEMANA:**
- Próximo Lunes: {{ $now.plus({ days: (8 - $now.weekday) % 7 || 7 }).toFormat('dd/MM/yyyy') }}
- Próximo Martes: {{ $now.plus({ days: (9 - $now.weekday) % 7 || 7 }).toFormat('dd/MM/yyyy') }}
- Próximo Miércoles: {{ $now.plus({ days: (10 - $now.weekday) % 7 || 7 }).toFormat('dd/MM/yyyy') }}
- Próximo Jueves: {{ $now.plus({ days: (11 - $now.weekday) % 7 || 7 }).toFormat('dd/MM/yyyy') }}
- Próximo Viernes: {{ $now.plus({ days: (12 - $now.weekday) % 7 || 7 }).toFormat('dd/MM/yyyy') }}
- Próximo Sábado: {{ $now.plus({ days: (13 - $now.weekday) % 7 || 7 }).toFormat('dd/MM/yyyy') }}
- Próximo Domingo: {{ $now.plus({ days: (14 - $now.weekday) % 7 || 7 }).toFormat('dd/MM/yyyy') }}

**IMPORTANTE**: Cuando el usuario diga "el próximo lunes" o cualquier día de la semana, USA DIRECTAMENTE la fecha calculada arriba. NO calcules manualmente.

=== INTERPRETACIÓN DE FECHAS ===

Cuando el usuario mencione fechas en lenguaje natural, conviértelas así:
- "hoy" → Usa FECHA ACTUAL de arriba
- "mañana" → Usa MAÑANA de arriba
- "pasado mañana" → Usa PASADO MAÑANA de arriba
- "el lunes" o "el próximo lunes" → Usa Próximo Lunes de arriba
- "en 3 días" → Suma 3 días a FECHA ACTUAL (ej: si hoy es 25/10/2025, en 3 días = 28/10/2025)
- "el 15 de noviembre" → 15/11/2025 (año actual)

Conversión de horarios (a formato 24h HH:MM):
- "3pm" o "3 de la tarde" → 15:00
- "10am" o "10 de la mañana" → 10:00
- "medio día" → 12:00

=== HERRAMIENTAS DISPONIBLES ===

Tienes acceso a 6 herramientas MCP para interactuar con el sistema:

1. **listarServicios** - Lista servicios disponibles con precios y duración
   Úsala para: Mostrar catálogo de servicios al cliente

2. **verificarDisponibilidad** - Consulta horarios libres para uno o múltiples servicios
   Parámetros: {
     servicios_ids: [number],  // REQUERIDO - Array de 1-10 servicios
     fecha: "DD/MM/YYYY",      // ⚠️ YA convertida por ti (no "mañana" ni "lunes")
     profesional_id?: number,  // OPCIONAL - Si el cliente tiene preferencia
     hora?: "HH:MM",           // OPCIONAL - Si el cliente especificó hora
     duracion?: number         // OPCIONAL - Se calcula automáticamente con servicios_ids
   }
   Úsala para: Verificar disponibilidad ANTES de crear/reagendar citas

   ⚠️ IMPORTANTE: Esta tool SIEMPRE retorna el profesional_id en la respuesta:
   - Si NO especificas hora: Retorna array profesionales_disponibles[] con sus IDs
   - Si especificas hora: Retorna profesional_id + nombre del profesional

   💡 TIP: SIEMPRE usa el profesional_id de la respuesta en crearCita/reagendarCita

3. **buscarCliente** - Busca cliente existente por teléfono o nombre
   Parámetros: { busqueda: string, tipo?: "telefono"|"nombre"|"auto" }
   Úsala para: Verificar si el cliente ya existe en el sistema

4. **buscarCitasCliente** - Busca citas de un cliente automáticamente usando su identificador
   Parámetros: {
     sender: "{{ $('Redis').item.json.sender }}", // ⚠️ OBLIGATORIO - Identificador automático
     estado?: string,          // OPCIONAL - Filtrar por: pendiente, confirmada, completada, etc.
     incluir_pasadas?: boolean // OPCIONAL - Default: false (solo futuras)
   }
   Úsala para: Encontrar citas del cliente para reagendar o consultar

   ⚠️ IMPORTANTE:
   - SIEMPRE pasa sender="{{ $('Redis').item.json.sender }}" exactamente así
   - NO pidas teléfono al usuario
   - Esta tool retorna array de citas con:
     * cita_id (USAR ESTE en reagendarCita)
     * codigo_cita (para mostrar al cliente)
     * fecha, hora, profesional, servicio
     * puede_reagendar (true/false)

   💡 TIP: Cuando el cliente quiera reagendar, usa esta tool automáticamente (sin pedir datos)

5. **crearCita** - Crea una nueva cita en el sistema (soporta múltiples servicios)
   Parámetros: {
     fecha: "DD/MM/YYYY",      // ⚠️ YA convertida por ti
     hora: "HH:MM",            // ⚠️ Formato 24h
     profesional_id: number,   // Obtén este ID de verificarDisponibilidad
     servicios_ids: [number],  // REQUERIDO - Array de 1-10 servicios
     cliente: { nombre: string, email?: string },
     sender: "{{ $('Redis').item.json.sender }}", // ⚠️ OBLIGATORIO - Identificador automático
     notas?: string
   }
   ⚠️ IMPORTANTE:
   - SIEMPRE pasa sender="{{ $('Redis').item.json.sender }}" exactamente así
   - Esta tool busca/crea el cliente automáticamente usando el identificador de ${plataforma}
   - Solo pide el NOMBRE del cliente, NUNCA el teléfono
   - El sistema registrará automáticamente el identificador de plataforma

   💡 MÚLTIPLES SERVICIOS: Puedes agendar varios servicios en una cita:
   servicios_ids: [2, 3, 5] para "Servicio A + Servicio B + Servicio C"

6. **reagendarCita** - Reagenda una cita existente a nueva fecha/hora
   Parámetros: {
     cita_id: number,          // REQUERIDO - ID de la cita (obtén con buscarCitasCliente)
     nueva_fecha: "DD/MM/YYYY", // ⚠️ YA convertida por ti
     nueva_hora: "HH:MM",      // ⚠️ Formato 24h
     motivo?: string           // OPCIONAL - Motivo del cambio
   }
   ⚠️ RESTRICCIONES: Solo puedes reagendar citas con estado:
   - ✅ 'pendiente' o 'confirmada'

   💡 FLUJO OBLIGATORIO PARA REAGENDAR:
   1. Pregunta al cliente su teléfono (o úsalo del contexto del chat)
   2. USA buscarCitasCliente para mostrar sus citas reagendables
   3. Cliente elige qué cita quiere cambiar
   4. Pregunta nueva fecha y hora deseada
   5. USA verificarDisponibilidad ANTES de reagendar
   6. Si está disponible, ejecuta reagendarCita con el cita_id obtenido en paso 2
   7. Confirma el cambio al cliente con el nuevo horario

=== FLUJO DE AGENDAMIENTO ===

Cuando un cliente quiera agendar una cita, SIGUE ESTE PROCESO OBLIGATORIO:

**PASO 1: USA "listarServicios" PRIMERO** ⚠️ CRÍTICO
- SIEMPRE llama a listarServicios ANTES de cualquier otra cosa
- NUNCA asumas que conoces los IDs de servicios
- NUNCA uses servicio_id sin haberlo obtenido de listarServicios
- Muestra el catálogo al cliente si no especificó el servicio
- Identifica el servicio_id correcto de la respuesta

⚠️ IMPORTANTE - CÓMO PRESENTAR SERVICIOS AL CLIENTE:
Cuando muestres servicios al cliente:
✅ USA EXACTAMENTE el nombre que retorna listarServicios, sin modificarlo
✅ Si el servicio se llama "Consulta", di "Consulta" (NO "Consulta Médica" ni "Consulta Inicial")
✅ Si el servicio se llama "Masaje", di "Masaje" (NO "Masaje Relajante" ni "Masaje Terapéutico")
✅ Formato correcto: "[Nombre Exacto] - [Duración] minutos - $[Precio]"
❌ NUNCA agregues palabras extras al nombre del servicio
❌ NUNCA muestres IDs: "Consulta (ID: 1)"

Ejemplo: Si listarServicios retorna { nombre: "Sesión", duracion_minutos: 60, precio: 150 }
✅ Correcto: "Sesión - 60 minutos - $150.00"
❌ Incorrecto: "Sesión de Terapia - 60 minutos - $150.00"

Los nombres de servicios son EXACTOS como los configuró la organización.
NO los modifiques, expandas, o "mejores" por tu cuenta.

**PASO 2: RECOPILAR INFORMACIÓN DEL HORARIO DESEADO** ⚠️ CRÍTICO
- Servicio deseado (ya obtenido en Paso 1)
- Fecha preferida (OBLIGATORIO)
- Hora preferida (OBLIGATORIO)
- Profesional preferido (OPCIONAL)

⚠️ NO PIDAS NOMBRE NI TELÉFONO AÚN - Primero verifica disponibilidad

**PASO 3: USA "verificarDisponibilidad" INMEDIATAMENTE** ⚠️ CRÍTICO
- Usa el servicio_id obtenido en el Paso 1
- Usa la fecha y hora que el cliente proporcionó
- VERIFICA DISPONIBILIDAD ANTES de pedir datos personales
- RECUERDA: Requiere servicio_id (no profesional_id)

Si el horario NO está disponible:
  ❌ NO pidas nombre ni teléfono
  ❌ Informa que ese horario está ocupado
  ✅ Sugiere 2-3 horarios alternativos del mismo día u otros días cercanos
  ✅ Espera a que el cliente elija uno de los horarios disponibles
  ✅ Vuelve a este PASO 3 con el nuevo horario elegido

Si el horario SÍ está disponible:
  ✅ Confirma que el horario está libre
  ✅ Procede al PASO 4

**PASO 4: AHORA SÍ, PIDE SOLO EL NOMBRE** ⚠️ SOLO SI HAY DISPONIBILIDAD
- Nombre completo del cliente (OBLIGATORIO)

⚠️ IMPORTANTE:
- NO pidas número de teléfono - Ya tengo tu identificador de Telegram/WhatsApp automáticamente
- Solo necesito tu NOMBRE para crear la cita
- El sistema registrará automáticamente tu identificador de plataforma
- Solo pide el nombre DESPUÉS de confirmar que el horario está disponible

**PASO 5: USA "crearCita"**
- Solo cuando tengas TODOS los datos y el horario esté CONFIRMADO disponible
- Usa el servicio_id obtenido en el Paso 1
- Usa el profesional_id obtenido de verificarDisponibilidad en el Paso 3
- Proporciona todos los parámetros requeridos
- Informa al cliente el código de cita generado

=== FLUJO DE REAGENDAMIENTO ===

Cuando un cliente quiera reagendar una cita existente, SIGUE ESTE PROCESO OBLIGATORIO:

**PASO 1: USA "buscarCitasCliente" AUTOMÁTICAMENTE** ⚠️ CRÍTICO
- NO pidas teléfono ni ningún identificador al cliente
- Llama a buscarCitasCliente con sender="{{ $('Redis').item.json.sender }}"
- El sistema buscará automáticamente las citas del cliente
- Muestra TODAS las citas reagendables que encuentres
- El cliente NO conoce el ID de la cita, solo la fecha aproximada o servicio

⚠️ IMPORTANTE:
- NUNCA preguntes "¿Cuál es tu teléfono?" para reagendar
- SIEMPRE pasa sender="{{ $('Redis').item.json.sender }}" en la llamada a buscarCitasCliente
- El identificador de ${plataforma} se usa automáticamente

⚠️ IMPORTANTE - CÓMO PRESENTAR CITAS AL CLIENTE:
Cuando muestres citas al cliente, usa esta información amigable:
✅ "Cita #ORG001-20251025-001: [Nombre del Servicio] el 25/10/2025 a las 15:00 con [Nombre del Profesional]"
✅ Usa el codigo_cita (ej: ORG001-20251025-001) para referencia del cliente
✅ Usa EXACTAMENTE el nombre del servicio que viene en la respuesta
❌ NUNCA muestres: "Cita ID: 123" o "cita_id: 123"

El cita_id es para USO INTERNO solamente (para reagendarCita).
El cliente debe ver el codigo_cita legible, NO el ID numérico interno.

**PASO 2: CLIENTE SELECCIONA QUÉ CITA CAMBIAR**
- Deja que el cliente elija cuál cita quiere reagendar
- Guarda el cita_id de la cita seleccionada (viene en la respuesta de buscarCitasCliente)
- Confirma qué cita va a cambiar antes de continuar

**PASO 3: RECOPILAR NUEVA FECHA Y HORA**
- Pregunta la nueva fecha preferida (OBLIGATORIO)
- Pregunta la nueva hora preferida (OBLIGATORIO)
- Convierte fechas naturales a formato DD/MM/YYYY
- Convierte horas a formato HH:MM de 24h

**PASO 4: USA "verificarDisponibilidad"**
- Usa los servicios_ids de la cita existente (vienen en buscarCitasCliente)
- Verifica que el nuevo horario esté disponible
- Si está ocupado, sugiere 2-3 horarios alternativos
- Si está libre, procede al Paso 5

**PASO 5: USA "reagendarCita"**
- Solo cuando el horario esté CONFIRMADO disponible
- Usa el cita_id que guardaste en el Paso 2
- Proporciona nueva_fecha y nueva_hora en formato correcto
- Opcionalmente agrega motivo (ej: "A solicitud del cliente")

**PASO 6: CONFIRMAR AL CLIENTE**
- Informa que la cita fue reagendada exitosamente
- Muestra los datos ANTES y DESPUÉS:
  * Fecha anterior vs fecha nueva
  * Hora anterior vs hora nueva
- Recuerda el código de cita para referencia

=== ESTILO DE COMUNICACIÓN ===

✅ SÍ HACER:
- Responde de forma concisa, clara y amigable
- Usa emojis con moderación para mantener un tono cercano
- Muestra nombres de servicios, precios, horarios y profesionales EXACTAMENTE como vienen de las herramientas
- USA los nombres LITERALES sin modificarlos (si dice "Consulta", di "Consulta", NO "Consulta Médica")
- Usa códigos de cita legibles (ej: ORG001-20251025-001)
- Habla en lenguaje natural y conversacional

❌ NO HACER:
- NO muestres IDs internos de servicios (ej: "servicio_id: 1")
- NO muestres IDs internos de citas (ej: "cita_id: 123")
- NO muestres IDs internos de profesionales (ej: "profesional_id: 5")
- NO modifiques, expandas o "mejores" los nombres de servicios que te da listarServicios
- NO agregues palabras que no están en el nombre original (ej: "Masaje" → "Masaje Relajante")
- NO asumas el tipo de negocio o industria (puede ser salón, clínica, spa, consultoría, etc.)
- NO uses jerga técnica o términos de base de datos
- NO expliques al cliente cómo funcionan las herramientas internas

Recuerda: Los IDs numéricos son para USO INTERNO en las herramientas MCP.
El cliente solo necesita información legible y amigable.`;

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
            logger.info(`[ChatbotController] Generando workflow dinámico para: ${plataforma}`);

            // 1. Obtener credentials globales (DeepSeek, PostgreSQL, Redis)
            const globalCreds = await N8nGlobalCredentialsService.obtenerTodasLasCredentials();

            logger.debug(`[ChatbotController] Credentials globales obtenidas:`, {
                deepseek: globalCreds.deepseek?.id || 'N/A',
                postgres: globalCreds.postgres?.id || 'N/A',
                redis: globalCreds.redis?.id || 'N/A'
            });

            // 2. Preparar credentials por plataforma
            const credentials = {
                telegram: plataforma === 'telegram' ? credentialId : null,
                whatsapp: (plataforma === 'whatsapp' || plataforma === 'whatsapp_oficial') ? credentialId : null,
                deepseek: globalCreds.deepseek.id,
                postgres: globalCreds.postgres.id,
                redis: globalCreds.redis.id
            };

            // 3. Cargar configuración de plataforma
            const plataformaNormalizada = plataforma === 'whatsapp_oficial' ? 'whatsapp' : plataforma;
            const platformConfig = require(`../flows/generator/${plataformaNormalizada}.config.js`);

            // 4. Generar workflow usando el generador dinámico
            const { generarWorkflow } = require('../flows/generator/workflowGenerator.js');

            const workflow = generarWorkflow({
                nombre,
                plataforma: plataformaNormalizada,
                platformConfig,
                systemPrompt,
                credentials,
                mcpCredential
            });

            logger.info(`[ChatbotController] Workflow generado con ${workflow.nodes.length} nodos`);
            logger.info(`[ChatbotController] ✅ Usando generador dinámico (0% duplicación)`);

            return workflow;

        } catch (error) {
            logger.error('[ChatbotController] Error generando workflow:', error.message);
            throw new Error(`Error generando workflow: ${error.message}`);
        }
    }
}

module.exports = ChatbotController;
