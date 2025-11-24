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

const ChatbotConfigModel = require('../models/chatbot-config.model');
const OrganizacionModel = require('../../../modules/core/models/organizacion.model');
const N8nService = require('../../../services/n8nService');
const N8nCredentialService = require('../../../services/n8nCredentialService');
const N8nGlobalCredentialsService = require('../../../services/n8nGlobalCredentialsService');
const N8nMcpCredentialsService = require('../../../services/n8nMcpCredentialsService');
const TelegramValidator = require('../../../services/platformValidators/telegramValidator');
const WhatsAppValidator = require('../../../services/platformValidators/whatsAppValidator');
const { generarTokenMCP } = require('../../../utils/mcpTokenGenerator');
const { asyncHandler } = require('../../../middleware');
const { ResponseHelper } = require('../../../utils/helpers');
const logger = require('../../../utils/logger');

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

        // ========== 4. Crear/Reutilizar credential MCP para autenticación del AI Agent ==========
        let mcpCredentialId = null;
        let mcpJwtToken = null; // Solo disponible si creamos nueva credential
        let mcpCredentialCreada = false;

        try {
            // Verificar si la organización ya tiene credential MCP
            const organizacion = await OrganizacionModel.obtenerPorId(organizacionId);

            if (organizacion.mcp_credential_id) {
                // Reutilizar credential existente
                mcpCredentialId = organizacion.mcp_credential_id;
                logger.info(`[ChatbotController] ✅ Credential MCP reutilizada para org ${organizacionId}: ${mcpCredentialId}`);
            } else {
                // Crear nueva credential MCP
                const mcpCredential = await N8nMcpCredentialsService.crearParaOrganizacion(organizacionId);
                mcpCredentialId = mcpCredential.id;
                mcpJwtToken = mcpCredential.token; // Guardar token para auditoría
                mcpCredentialCreada = true;

                // Guardar ID en tabla organizaciones
                await OrganizacionModel.actualizar(organizacionId, {
                    mcp_credential_id: mcpCredentialId
                });

                logger.info(`[ChatbotController] ✅ Credential MCP creada y guardada para org ${organizacionId}: ${mcpCredentialId}`);
            }
        } catch (mcpError) {
            logger.error('[ChatbotController] Error obteniendo/creando credential MCP:', mcpError);

            // Rollback: eliminar credential de plataforma
            try {
                await N8nCredentialService.eliminarCredential(credentialCreada.id);
                logger.info(`[ChatbotController] Rollback: credential de plataforma ${credentialCreada.id} eliminada`);
            } catch (rollbackError) {
                logger.error('[ChatbotController] Error en rollback de credential de plataforma:', rollbackError.message);
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
                mcpCredentialId // Pasar solo el ID de la credential MCP
            });

            workflowCreado = await N8nService.crearWorkflow(workflowTemplate);
            logger.info(`[ChatbotController] Workflow creado en n8n: ${workflowCreado.id}`);
        } catch (error) {
            logger.error('[ChatbotController] Error creando workflow en n8n:', error.message);

            // Rollback: eliminar credentials creadas
            try {
                await N8nCredentialService.eliminarCredential(credentialCreada.id);
                logger.info(`[ChatbotController] Rollback: credential Telegram ${credentialCreada.id} eliminada`);

                // Rollback credential MCP solo si la acabamos de crear
                if (mcpCredentialCreada) {
                    try {
                        await N8nMcpCredentialsService.eliminar(mcpCredentialId);
                        await OrganizacionModel.actualizar(organizacionId, { mcp_credential_id: null });
                        logger.info(`[ChatbotController] Rollback: credential MCP ${mcpCredentialId} eliminada (recién creada)`);
                    } catch (rollbackMcpError) {
                        logger.error('[ChatbotController] Error en rollback de credential MCP:', rollbackMcpError.message);
                    }
                } else {
                    logger.info(`[ChatbotController] Credential MCP ${mcpCredentialId} se mantiene (reutilizada de org)`);
                }
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

                // Rollback credential MCP solo si la acabamos de crear
                if (mcpCredentialCreada) {
                    try {
                        await N8nMcpCredentialsService.eliminar(mcpCredentialId);
                        await OrganizacionModel.actualizar(organizacionId, { mcp_credential_id: null });
                        logger.info(`[ChatbotController] Rollback: credential MCP ${mcpCredentialId} eliminada (recién creada)`);
                    } catch (rollbackMcpError) {
                        logger.error('[ChatbotController] Error en rollback de credential MCP:', rollbackMcpError.message);
                    }
                } else {
                    logger.info(`[ChatbotController] Credential MCP ${mcpCredentialId} se mantiene (reutilizada de org)`);
                }
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
                mcp_credential_id: mcpCredentialId, // Credential MCP compartida por org
                ai_model: ai_model || 'deepseek-chat',
                ai_temperature: ai_temperature || 0.7,
                system_prompt: systemPromptFinal,
                mcp_jwt_token: mcpJwtToken, // Token JWT para auditoría (NULL si reutilizada)
                activo: workflowActivado, // Mapeo 1:1 con workflow.active de n8n
                ultimo_error: workflowActivado ? null : 'Error al activar el workflow en n8n'
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

                // Rollback credential MCP solo si la acabamos de crear
                if (mcpCredentialCreada) {
                    try {
                        await N8nMcpCredentialsService.eliminar(mcpCredentialId);
                        await OrganizacionModel.actualizar(organizacionId, { mcp_credential_id: null });
                        logger.info(`[ChatbotController] Rollback: credential MCP ${mcpCredentialId} eliminada (recién creada)`);
                    } catch (rollbackMcpError) {
                        logger.error('[ChatbotController] Error en rollback de credential MCP:', rollbackMcpError.message);
                    }
                } else {
                    logger.info(`[ChatbotController] Credential MCP ${mcpCredentialId} se mantiene (reutilizada de org)`);
                }
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

        if (req.query.activo !== undefined) {
            filtros.activo = req.query.activo === 'true';
        }

        if (req.query.incluir_eliminados !== undefined) {
            filtros.incluir_eliminados = req.query.incluir_eliminados === 'true';
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
     * Elimina el chatbot, el workflow y las credentials de n8n
     *
     * ESTRATEGIA CREDENTIAL MCP (1 por organización):
     * - Solo elimina la credential MCP si es el ÚLTIMO chatbot de la org
     * - Si quedan otros chatbots, la credential MCP se reutiliza
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

        // 2. Verificar cuántos chatbots activos quedan en la org (ANTES de eliminar)
        const estadisticas = await ChatbotConfigModel.obtenerEstadisticas(organizacionId);
        const esUltimoChatbot = estadisticas.total_chatbots <= 1;

        logger.info(`[ChatbotController] Eliminando chatbot ${id}. Total chatbots en org: ${estadisticas.total_chatbots}, Es último: ${esUltimoChatbot}`);

        // 3. Eliminar workflow de n8n (si existe)
        if (chatbot.n8n_workflow_id) {
            try {
                await N8nService.eliminarWorkflow(chatbot.n8n_workflow_id);
                logger.info(`[ChatbotController] Workflow ${chatbot.n8n_workflow_id} eliminado de n8n`);
            } catch (error) {
                logger.warn(`[ChatbotController] Error eliminando workflow: ${error.message}`);
                // Continuar con la eliminación aunque falle
            }
        }

        // 4. Eliminar credential de plataforma de n8n (si existe)
        if (chatbot.n8n_credential_id) {
            try {
                await N8nCredentialService.eliminarCredential(chatbot.n8n_credential_id);
                logger.info(`[ChatbotController] Credential de plataforma ${chatbot.n8n_credential_id} eliminada de n8n`);
            } catch (error) {
                logger.warn(`[ChatbotController] Error eliminando credential de plataforma: ${error.message}`);
                // Continuar con la eliminación aunque falle
            }
        }

        // 5. Eliminar credential MCP SOLO si es el último chatbot de la org
        if (chatbot.mcp_credential_id) {
            if (esUltimoChatbot) {
                try {
                    await N8nMcpCredentialsService.eliminar(chatbot.mcp_credential_id);
                    logger.info(`[ChatbotController] Credential MCP ${chatbot.mcp_credential_id} eliminada (último chatbot de org ${organizacionId})`);

                    // Limpiar campo en tabla organizaciones
                    await OrganizacionModel.actualizar(organizacionId, {
                        mcp_credential_id: null
                    });
                    logger.info(`[ChatbotController] Campo mcp_credential_id limpiado en org ${organizacionId}`);
                } catch (error) {
                    logger.warn(`[ChatbotController] Error eliminando credential MCP: ${error.message}`);
                    // Continuar con la eliminación aunque falle
                }
            } else {
                logger.info(`[ChatbotController] Credential MCP ${chatbot.mcp_credential_id} NO eliminada (quedan ${estadisticas.total_chatbots - 1} chatbots más en org ${organizacionId})`);
            }
        }

        // 6. Eliminar de BD (soft delete)
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
     * ACTUALIZAR ESTADO ACTIVO
     * ====================================================================
     * Activa o desactiva un chatbot (mapeo 1:1 con workflow.active de n8n)
     *
     * SINCRONIZACIÓN AUTOMÁTICA:
     * 1. Verifica el estado REAL del workflow en n8n
     * 2. Si hay desincronización, corrige la BD primero
     * 3. Aplica el nuevo estado solicitado
     * 4. Actualiza BD con el resultado
     *
     * Esto garantiza que nunca haya desincronización al momento de cambiar el estado.
     *
     * @route PATCH /api/v1/chatbots/:id/estado
     */
    static actualizarEstado = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { activo } = req.body;

        // 1. Obtener chatbot para verificar que existe y tiene workflow
        const chatbot = await ChatbotConfigModel.obtenerPorId(
            parseInt(id),
            req.tenant.organizacionId
        );

        if (!chatbot) {
            return ResponseHelper.error(res, 'Chatbot no encontrado', 404);
        }

        if (!chatbot.n8n_workflow_id) {
            return ResponseHelper.error(res, 'Chatbot no tiene workflow asociado', 400);
        }

        // 2. VERIFICAR ESTADO REAL EN N8N (prevenir desincronización)
        let estadoRealN8n = null;
        try {
            const estadoN8n = await N8nService.verificarEstado(chatbot.n8n_workflow_id);
            estadoRealN8n = estadoN8n.active;

            // Si hay desincronización, corregir la BD silenciosamente
            if (estadoN8n.exists && chatbot.activo !== estadoRealN8n) {
                logger.warn(`Desincronización detectada en chatbot ${id}: BD=${chatbot.activo}, n8n=${estadoRealN8n}. Corrigiendo...`);
                await ChatbotConfigModel.actualizarEstado(
                    parseInt(id),
                    estadoRealN8n,
                    req.tenant.organizacionId,
                    { ultimo_error: null }
                );
            }
        } catch (error) {
            logger.error(`Error al verificar estado en n8n: ${error.message}`);
            // Continuar con la operación aunque falle la verificación
        }

        // 3. Aplicar el NUEVO estado solicitado por el usuario
        let errorN8n = null;
        let sincronizado = false;

        try {
            if (activo) {
                // Activar en n8n
                await N8nService.activarWorkflow(chatbot.n8n_workflow_id);
                logger.info(`Workflow ${chatbot.n8n_workflow_id} activado en n8n`);
            } else {
                // Desactivar en n8n
                await N8nService.desactivarWorkflow(chatbot.n8n_workflow_id);
                logger.info(`Workflow ${chatbot.n8n_workflow_id} desactivado en n8n`);
            }
            sincronizado = true;
        } catch (error) {
            errorN8n = error.message;
            logger.error(`Error al ${activo ? 'activar' : 'desactivar'} workflow en n8n:`, error.message);
        }

        // 4. Actualizar BD con resultado de sincronización
        const opciones = {
            ultimo_error: sincronizado ? null : errorN8n
        };

        const chatbotActualizado = await ChatbotConfigModel.actualizarEstado(
            parseInt(id),
            activo,
            req.tenant.organizacionId,
            opciones
        );

        if (!chatbotActualizado) {
            return ResponseHelper.error(res, 'Error al actualizar chatbot en BD', 500);
        }

        // 5. Responder según resultado
        if (sincronizado) {
            return ResponseHelper.success(
                res,
                chatbotActualizado,
                `Chatbot ${activo ? 'activado' : 'desactivado'} exitosamente`
            );
        } else {
            return ResponseHelper.error(
                res,
                `Error al sincronizar con n8n: ${errorN8n}`,
                500,
                { chatbot: chatbotActualizado }
            );
        }
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

        return `Eres ${botName} ${username}, asistente de agendamiento de citas.

=== IDENTIFICACIÓN AUTOMÁTICA ===
IDENTIFICADOR USUARIO: {{ $('Redis').item.json.sender }}
- NUNCA pidas teléfono (ya disponible automáticamente)
- Solo pide NOMBRE del cliente
- Para crear/buscar citas: sender="{{ $('Redis').item.json.sender }}"

=== FECHA Y HORA ===
HOY: {{ $now.toFormat('dd/MM/yyyy') }} ({{ $now.toFormat('cccc', { locale: 'es' }) }})
HORA ACTUAL: {{ $now.toFormat('HH:mm') }}

Fechas calculadas:
- Mañana: {{ $now.plus({ days: 1 }).toFormat('dd/MM/yyyy') }}
- Pasado mañana: {{ $now.plus({ days: 2 }).toFormat('dd/MM/yyyy') }}
- Próximo Lunes: {{ $now.plus({ days: (8 - $now.weekday) % 7 || 7 }).toFormat('dd/MM/yyyy') }}
- Próximo Martes: {{ $now.plus({ days: (9 - $now.weekday) % 7 || 7 }).toFormat('dd/MM/yyyy') }}
- Próximo Miércoles: {{ $now.plus({ days: (10 - $now.weekday) % 7 || 7 }).toFormat('dd/MM/yyyy') }}
- Próximo Jueves: {{ $now.plus({ days: (11 - $now.weekday) % 7 || 7 }).toFormat('dd/MM/yyyy') }}
- Próximo Viernes: {{ $now.plus({ days: (12 - $now.weekday) % 7 || 7 }).toFormat('dd/MM/yyyy') }}
- Próximo Sábado: {{ $now.plus({ days: (13 - $now.weekday) % 7 || 7 }).toFormat('dd/MM/yyyy') }}
- Próximo Domingo: {{ $now.plus({ days: (14 - $now.weekday) % 7 || 7 }).toFormat('dd/MM/yyyy') }}

Convierte lenguaje natural a DD/MM/YYYY. Horas a formato 24h HH:MM (ej: "3pm" → "15:00").

=== HERRAMIENTAS MCP ===

1. **listarServicios** - Catálogo con precios y duración

2. **verificarDisponibilidad**
   Parámetros: { servicios_ids: [number], fecha: "DD/MM/YYYY", hora?: "HH:MM", excluir_cita_id?: number }
   - Sin hora: Retorna todos los slots disponibles
   - Con hora: Valida si ese horario está libre
   - excluir_cita_id: CRÍTICO para reagendamiento (libera slot de cita actual)
   - Retorna profesional_id (úsalo en crearCita/reagendarCita)

3. **buscarCliente**
   Parámetros: { busqueda: string, tipo?: "telefono"|"nombre" }

4. **buscarCitasCliente**
   Parámetros: { sender: "{{ $('Redis').item.json.sender }}", estado?: string }
   - Retorna: cita_id (uso interno), codigo_cita (mostrar al cliente), fecha, hora, servicios

5. **crearCita**
   Parámetros: { fecha, hora, profesional_id, servicios_ids: [number], cliente: {nombre}, sender: "{{ $('Redis').item.json.sender }}" }
   - Soporta múltiples servicios: servicios_ids: [1, 2, 3]

6. **reagendarCita**
   Parámetros: { cita_id, nueva_fecha, nueva_hora, motivo? }
   - Solo citas 'pendiente' o 'confirmada'

7. **modificarServiciosCita**
   Parámetros: { cita_id, servicios_ids: [number], motivo? }
   - Cambia servicios SIN cambiar fecha/hora
   - Solo citas 'pendiente', 'confirmada' o 'en_curso'
   - Si error 409 (conflicto duración): Verifica disponibilidad y reagenda

=== ÁRBOL DE DECISIÓN - CUÁNDO USAR CADA TOOL ===

**CREAR CITA NUEVA:**
1. listarServicios → obtén servicios_ids
2. verificarDisponibilidad (con hora si cliente la pidió, sin hora para ver opciones)
3. crearCita (usa profesional_id de verificarDisponibilidad)

**MODIFICAR SOLO SERVICIOS (mantener fecha/hora):**
1. buscarCitasCliente → obtén cita_id y servicios actuales
2. listarServicios → obtén nuevos servicios_ids
3. modificarServiciosCita (cita_id + servicios_ids)
⚠️ NO llames verificarDisponibilidad (no es necesario si solo cambias servicios)
   - Si falla con error 409 (duración excede horario), ENTONCES:
     a. verificarDisponibilidad con nueva duración
     b. reagendarCita con nuevo horario

**CAMBIAR SOLO FECHA/HORA (mantener servicios):**
1. buscarCitasCliente → obtén cita_id y servicios_ids existentes
2. verificarDisponibilidad (servicios_ids existentes + nueva fecha/hora + excluir_cita_id)
3. reagendarCita (cita_id + nueva_fecha + nueva_hora)

**CAMBIAR SERVICIOS Y FECHA/HORA:**
1. buscarCitasCliente → obtén cita_id
2. listarServicios → obtén nuevos servicios_ids
3. verificarDisponibilidad (nuevos servicios_ids + nueva fecha/hora + excluir_cita_id)
4. reagendarCita → cambia fecha/hora primero
5. modificarServiciosCita → actualiza servicios

=== FLUJO AGENDAMIENTO ===

PASO 1: listarServicios (identifica servicio_id correcto)
PASO 2: Pide fecha y hora preferida
PASO 3: verificarDisponibilidad
  - Si ocupado: Llama verificarDisponibilidad SIN hora para ver slots reales. Sugiere 2-3 opciones.
  - Si libre: Continúa
PASO 4: Pide SOLO nombre (NO teléfono)
PASO 5: crearCita (usa profesional_id de verificarDisponibilidad)

=== FLUJO REAGENDAMIENTO ===

PASO 1: buscarCitasCliente (automático con sender)
  - Muestra citas con codigo_cita (ej: ORG001-20251025-001), NO cita_id
PASO 2: Cliente elige cita (guarda cita_id y servicios_ids)
PASO 3: Pide nueva fecha y hora
PASO 4: verificarDisponibilidad (servicios_ids + nueva fecha/hora + excluir_cita_id)
  - Si ocupado: Llama sin hora para obtener slots reales
PASO 5: reagendarCita (cita_id + nueva_fecha + nueva_hora)

=== PRESENTACIÓN DE INFORMACIÓN ===

✅ Usa nombres EXACTOS de listarServicios (NO los modifiques)
✅ Formato servicios: "[Nombre] - [X] minutos - $[Precio]"
✅ Muestra codigo_cita (ej: ORG001-20251025-001), NO cita_id
✅ Respuestas concisas y amigables

❌ NO muestres IDs internos (servicio_id, cita_id, profesional_id)
❌ NO modifiques nombres de servicios
❌ NO asumas industria del negocio
❌ NO inventes horarios sin verificar`;

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
    static async _generarWorkflowTemplate({ nombre, plataforma, credentialId, systemPrompt, aiModel, aiTemperature, organizacionId, mcpCredentialId }) {
        try {
            logger.info(`[ChatbotController] Generando workflow dinámico para: ${plataforma}`);

            // 1. Obtener credentials globales (DeepSeek, PostgreSQL, Redis)
            const globalCreds = await N8nGlobalCredentialsService.obtenerTodasLasCredentials();

            logger.debug(`[ChatbotController] Credentials globales obtenidas:`, {
                deepseek: globalCreds.deepseek?.id || 'N/A',
                openrouter: globalCreds.openrouter?.id || 'N/A',
                postgres: globalCreds.postgres?.id || 'N/A',
                redis: globalCreds.redis?.id || 'N/A',
                mcp: mcpCredentialId || 'N/A'
            });

            // 2. Preparar credentials por plataforma
            const credentials = {
                telegram: plataforma === 'telegram' ? credentialId : null,
                whatsapp: (plataforma === 'whatsapp' || plataforma === 'whatsapp_oficial') ? credentialId : null,
                deepseek: globalCreds.deepseek.id,       // ✅ Fallback
                openrouter: globalCreds.openrouter.id,   // ✅ Modelo principal (Qwen3-32B)
                postgres: globalCreds.postgres.id,
                redis: globalCreds.redis.id
            };

            // 3. Preparar objeto MCP credential (solo si existe)
            const mcpCredential = mcpCredentialId ? { id: mcpCredentialId } : null;

            // 4. Cargar configuración de plataforma
            const plataformaNormalizada = plataforma === 'whatsapp_oficial' ? 'whatsapp' : plataforma;
            const platformConfig = require(`../../../flows/generator/${plataformaNormalizada}.config.js`);

            // 5. Generar workflow usando el generador dinámico
            const { generarWorkflow } = require('../../../flows/generator/workflowGenerator.js');

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
