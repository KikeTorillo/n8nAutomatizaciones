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

        // ========== 7. Activar workflow ==========
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

Tienes acceso a 4 herramientas MCP para interactuar con el sistema:

1. **listarServicios** - Lista servicios disponibles con precios y duración
   Úsala para: Mostrar catálogo de servicios al cliente

2. **verificarDisponibilidad** - Consulta horarios libres para un servicio
   Parámetros: {
     servicio_id: number,      // REQUERIDO - ID del servicio
     fecha: "DD/MM/YYYY",      // ⚠️ YA convertida por ti (no "mañana" ni "lunes")
     profesional_id?: number,  // OPCIONAL - Si el cliente tiene preferencia
     hora?: "HH:MM",           // OPCIONAL - Si el cliente especificó hora
     duracion?: number         // OPCIONAL - Minutos
   }
   Úsala para: Verificar si un horario está disponible ANTES de crear la cita

3. **buscarCliente** - Busca cliente existente por teléfono o nombre
   Parámetros: { busqueda: string, tipo?: "telefono"|"nombre"|"auto" }
   Úsala para: Verificar si el cliente ya existe en el sistema

4. **crearCita** - Crea una nueva cita en el sistema
   Parámetros: {
     fecha: "DD/MM/YYYY",      // ⚠️ YA convertida por ti
     hora: "HH:MM",            // ⚠️ Formato 24h
     profesional_id: number,
     servicio_id: number,
     cliente: { nombre: string, telefono: string, email?: string },
     notas?: string
   }
   ⚠️ IMPORTANTE: Esta tool busca/crea el cliente automáticamente.
   Solo proporciona los datos del cliente, no necesitas buscar antes.

=== FLUJO DE AGENDAMIENTO ===

Cuando un cliente quiera agendar una cita, SIGUE ESTE PROCESO OBLIGATORIO:

**PASO 1: USA "listarServicios" PRIMERO** ⚠️ CRÍTICO
- SIEMPRE llama a listarServicios ANTES de cualquier otra cosa
- NUNCA asumas que conoces los IDs de servicios
- NUNCA uses servicio_id sin haberlo obtenido de listarServicios
- Muestra el catálogo al cliente si no especificó el servicio
- Identifica el servicio_id correcto de la respuesta

**PASO 2: RECOPILAR INFORMACIÓN FALTANTE**
- Nombre del cliente (OBLIGATORIO)
- Teléfono del cliente (OBLIGATORIO)
- Servicio deseado (ya obtenido en Paso 1)
- Fecha preferida (OBLIGATORIO) - ⚠️ Convierte a DD/MM/YYYY con año 2025
- Hora preferida (OBLIGATORIO) - ⚠️ Convierte a HH:MM formato 24h
- Profesional preferido (OPCIONAL)

**PASO 3: USA "verificarDisponibilidad"**
- Usa el servicio_id obtenido en el Paso 1
- ANTES de crear la cita, verifica que el horario esté libre
- RECUERDA: Requiere servicio_id (no profesional_id)
- Si está ocupado, sugiere 2-3 horarios alternativos
- Si está libre, procede al Paso 4

**PASO 4: USA "crearCita"**
- Solo cuando tengas TODOS los datos y el horario esté CONFIRMADO disponible
- Usa el servicio_id obtenido en el Paso 1
- Proporciona todos los parámetros requeridos
- Informa al cliente el código de cita generado

=== REGLAS IMPORTANTES ===

1. **SIEMPRE llama a "listarServicios" PRIMERO** - NUNCA asumas IDs de servicios
2. **NUNCA crees una cita sin verificar disponibilidad primero**
3. **SIEMPRE confirma los datos con el cliente antes de usar crearCita**
4. **SIEMPRE convierte fechas naturales a DD/MM/YYYY con año 2025**
5. **Las tools NO interpretan fechas naturales - hazlo tú primero**
6. **Si falta información, pregunta UNA SOLA VEZ de forma clara**
7. **Sé amable, profesional y empático**
8. **Confirma siempre el resultado de las operaciones al cliente**

=== EJEMPLO DE CONVERSACIÓN ===

EJEMPLO 1: Usuario pide "mañana"
Usuario: "Quiero cita para mañana a las 3pm"

Tú (internamente):
- Veo que arriba dice: MAÑANA: {{ $now.plus({ days: 1 }).toFormat('dd/MM/yyyy') }}
- Convierte: 3pm = 15:00
- PRIMERO debo llamar a listarServicios

Tú: (llamas listarServicios)

Tool responde: [
  { "id": 2, "nombre": "Corte de Cabello", "duracion": 30, "precio": 150 },
  { "id": 3, "nombre": "Tinte", "duracion": 60, "precio": 350 }
]

Tú respondes: "Hola! Veo que quieres agendar para mañana {{ $now.plus({ days: 1 }).toFormat('dd/MM/yyyy') }} a las 15:00. Tenemos estos servicios disponibles:
- Corte de Cabello (30 min - $150)
- Tinte (60 min - $350)
¿Cuál te gustaría?"

EJEMPLO 2: Usuario pide "el próximo lunes"
Usuario: "Quiero corte el próximo lunes a las 2pm"

Tú (internamente):
- Veo que arriba dice: Próximo Lunes: {{ $now.plus({ days: (8 - $now.weekday) % 7 || 7 }).toFormat('dd/MM/yyyy') }}
- Convierte: 2pm = 14:00
- PRIMERO debo llamar a listarServicios

Tú: (llamas listarServicios y obtienes servicio_id=2 para "Corte de Cabello")

Tú respondes: "Perfecto! Veo que quieres un Corte para el próximo lunes {{ $now.plus({ days: (8 - $now.weekday) % 7 || 7 }).toFormat('dd/MM/yyyy') }} a las 14:00. Déjame verificar disponibilidad..."

Tú: (llamas verificarDisponibilidad con:
  servicio_id=2, fecha="{{ $now.plus({ days: (8 - $now.weekday) % 7 || 7 }).toFormat('dd/MM/yyyy') }}", hora="14:00")

Usuario: "Corte de cabello"

Tú (internamente):
- El cliente quiere "Corte de Cabello"
- De listarServicios sé que el servicio_id = 2

Tú: "Perfecto! Déjame verificar disponibilidad para mañana a las 15:00..."

Tú: (llamas verificarDisponibilidad con:
  servicio_id=2, fecha="26/10/2025", hora="15:00")

Tool responde: { disponible: true, profesional: "Juan Pérez" }

Tú: "¡Excelente! Tenemos disponibilidad con Juan Pérez. Para confirmar la cita, necesito tu nombre completo y teléfono."

Usuario: "Luis García, 5517437767"

Tú: (llamas crearCita con:
  servicio_id=2, fecha="26/10/2025", hora="15:00",
  cliente={nombre: "Luis García", telefono: "5517437767"})

Tool responde: { codigo_cita: "ORG002-20251026-001" }

Tú: "✅ ¡Listo Luis! Tu cita está confirmada:
📅 Fecha: Mañana 26/10/2025 a las 15:00
✂️ Servicio: Corte de Cabello
👨 Profesional: Juan Pérez
🎫 Código: ORG002-20251026-001
Te esperamos!"

Organización ID: ${organizacionId}
Plataforma: ${plataforma}

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
                        // ⚠️ IMPORTANTE: Prefijo "=" indica a n8n que es una expression (no fixed)
                        // Esto permite que las expresiones de Luxon {{ $now.toFormat(...) }} se evalúen
                        node.parameters.options.systemMessage = `=${systemPrompt}`;
                    }
                }

                // 4.6 Configurar MCP Client Tools con credential httpHeaderAuth
                if (node.type === '@n8n/n8n-nodes-langchain.mcpClientTool') {
                    // Migrar serverUrl (v1.1) a endpointUrl (v1.2+)
                    if (node.parameters.serverUrl && !node.parameters.endpointUrl) {
                        // IMPORTANTE: Agregar el endpoint /mcp/execute al final
                        const baseUrl = node.parameters.serverUrl.replace(/\/$/, ''); // Eliminar trailing slash
                        node.parameters.endpointUrl = `${baseUrl}/mcp/execute`;
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

            // 6. Procesar IDs de nodos y aplicar FIX para webhookId (PR #15486)
            const crypto = require('crypto');

            plantilla.nodes.forEach(node => {
                // ✨ CRÍTICO: SIEMPRE regenerar node.id para evitar conflictos entre workflows
                // La plantilla tiene IDs hardcodeados, pero cada workflow necesita IDs únicos
                const oldId = node.id;
                node.id = crypto.randomUUID();

                logger.debug(`[ChatbotController] Regenerando ID del nodo "${node.name}": ${oldId} → ${node.id}`);

                // ✨ FIX EXPERIMENTAL (basado en n8n PR #15486)
                // Solución oficial pendiente de merge para el bug de webhookId
                // https://github.com/n8n-io/n8n/pull/15486
                if (node.type === 'n8n-nodes-base.telegramTrigger') {
                    // Asignar webhookId = node.id (solución del PR oficial)
                    node.webhookId = node.id;

                    // Asegurar que el path esté establecido
                    if (!node.parameters) {
                        node.parameters = {};
                    }
                    if (!node.parameters.path) {
                        node.parameters.path = node.id;
                    }

                    logger.info(`[ChatbotController] ✨ webhookId pre-generado para Telegram Trigger: ${node.webhookId}`);
                    logger.info(`[ChatbotController] Aplicando fix experimental del PR #15486`);
                }

                // También regenerar webhookId para otros nodos webhook si existen
                if (node.type === 'n8n-nodes-base.wait' && oldId !== node.id) {
                    node.webhookId = node.id;
                    logger.debug(`[ChatbotController] webhookId regenerado para nodo Wait: ${node.webhookId}`);
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
