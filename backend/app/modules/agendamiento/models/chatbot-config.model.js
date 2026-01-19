/**
 * Modelo de Chatbot Config - Operaciones CRUD con RLS multi-tenant
 *
 * Gestiona la configuración de chatbots de IA por organización y plataforma.
 * Cada organización puede tener 1 chatbot por plataforma (Telegram, WhatsApp, etc).
 *
 * @module database/chatbot-config.model
 */

const RLSContextManager = require('../../../utils/rlsContextManager');
const { ErrorHelper } = require('../../../utils/helpers');

class ChatbotConfigModel {

    /**
     * Crear nueva configuración de chatbot
     *
     * @param {Object} chatbotData - Datos del chatbot
     * @param {number} chatbotData.organizacion_id - ID de la organización
     * @param {string} chatbotData.nombre - Nombre del chatbot
     * @param {string} chatbotData.plataforma - Plataforma (telegram, whatsapp, etc)
     * @param {Object} chatbotData.config_plataforma - Configuración específica de la plataforma (JSONB)
     * @param {string} [chatbotData.n8n_workflow_id] - ID del workflow en n8n
     * @param {string} [chatbotData.n8n_credential_id] - ID de la credential en n8n
     * @param {string} [chatbotData.mcp_credential_id] - ID de la credential MCP en n8n (compartida por org)
     * @param {string} [chatbotData.ai_model] - Modelo de IA (default: qwen3-235b)
     * @param {number} [chatbotData.ai_temperature] - Temperatura del modelo (0.0-2.0, default: 0.4)
     * @param {string} [chatbotData.system_prompt] - Prompt del sistema para el AI Agent
     * @param {string} [chatbotData.mcp_jwt_token] - Token JWT para autenticación con MCP Server
     * @param {boolean} [chatbotData.activo] - Si el chatbot está activo (default: false, se activa después)
     * @param {string} [chatbotData.ultimo_error] - Mensaje de error si hubo problema en activación
     * @returns {Promise<Object>} Chatbot creado
     */
    static async crear(chatbotData) {
        return await RLSContextManager.query(chatbotData.organizacion_id, async (db) => {
            const query = `
                INSERT INTO chatbot_config (
                    organizacion_id, nombre, plataforma, config_plataforma,
                    n8n_workflow_id, n8n_credential_id, mcp_credential_id,
                    ai_model, ai_temperature, system_prompt, mcp_jwt_token,
                    activo, ultimo_error
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                RETURNING
                    id, organizacion_id, nombre, plataforma, config_plataforma,
                    n8n_workflow_id, n8n_credential_id, mcp_credential_id,
                    ai_model, ai_temperature, system_prompt, mcp_jwt_token,
                    activo, deleted_at, ultimo_error, ultimo_mensaje_recibido,
                    total_mensajes_procesados, total_citas_creadas,
                    creado_en, actualizado_en
            `;

            const values = [
                chatbotData.organizacion_id,
                chatbotData.nombre,
                chatbotData.plataforma,
                chatbotData.config_plataforma || {},
                chatbotData.n8n_workflow_id || null,
                chatbotData.n8n_credential_id || null,
                chatbotData.mcp_credential_id || null,
                chatbotData.ai_model || 'qwen3-235b',
                chatbotData.ai_temperature !== undefined ? chatbotData.ai_temperature : 0.4,
                chatbotData.system_prompt || null,
                chatbotData.mcp_jwt_token || null,
                chatbotData.activo !== undefined ? chatbotData.activo : false,
                chatbotData.ultimo_error || null
            ];

            try {
                const result = await db.query(query, values);
                return result.rows[0];
            } catch (error) {
                // Constraint unique: organizacion_id + plataforma
                if (error.code === '23505') {
                    if (error.constraint === 'uq_chatbot_org_plataforma') {
                        ErrorHelper.throwConflict(`Ya existe un chatbot de ${chatbotData.plataforma} para esta organización`);
                    }
                    if (error.constraint === 'chatbot_config_n8n_workflow_id_key') {
                        ErrorHelper.throwConflict(`El workflow ID ${chatbotData.n8n_workflow_id} ya está en uso`);
                    }
                }

                // Check constraint (temperatura 0.0-2.0)
                if (error.code === '23514') {
                    if (error.constraint === 'chatbot_config_ai_temperature_check') {
                        ErrorHelper.throwValidation('La temperatura del modelo debe estar entre 0.0 y 2.0');
                    }
                }

                // Foreign key (organización no existe)
                if (error.code === '23503') {
                    if (error.constraint === 'chatbot_config_organizacion_id_fkey') {
                        ErrorHelper.throwIfNotFound(null, 'Organización');
                    }
                }

                throw error;
            }
        });
    }

    /**
     * Obtener chatbot por ID
     *
     * @param {number} id - ID del chatbot
     * @param {number} organizacionId - ID de la organización (RLS context)
     * @returns {Promise<Object|null>} Chatbot o null si no existe
     */
    static async obtenerPorId(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    id, organizacion_id, nombre, plataforma, config_plataforma,
                    n8n_workflow_id, n8n_credential_id, mcp_credential_id,
                    ai_model, ai_temperature, system_prompt, mcp_jwt_token,
                    activo, deleted_at, ultimo_error, ultimo_mensaje_recibido,
                    total_mensajes_procesados, total_citas_creadas,
                    creado_en, actualizado_en
                FROM chatbot_config
                WHERE id = $1 AND deleted_at IS NULL
            `;

            const result = await db.query(query, [id]);
            return result.rows[0] || null;
        });
    }

    /**
     * Obtener chatbot por plataforma
     *
     * @param {string} plataforma - Plataforma del chatbot (telegram, whatsapp, etc)
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object|null>} Chatbot o null si no existe
     */
    static async obtenerPorPlataforma(plataforma, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    id, organizacion_id, nombre, plataforma, config_plataforma,
                    n8n_workflow_id, n8n_credential_id, mcp_credential_id,
                    ai_model, ai_temperature, system_prompt, mcp_jwt_token,
                    activo, deleted_at, ultimo_error, ultimo_mensaje_recibido,
                    total_mensajes_procesados, total_citas_creadas,
                    creado_en, actualizado_en
                FROM chatbot_config
                WHERE plataforma = $1 AND deleted_at IS NULL
            `;

            const result = await db.query(query, [plataforma]);
            return result.rows[0] || null;
        });
    }

    /**
     * Listar chatbots de una organización con filtros opcionales
     *
     * @param {number} organizacionId - ID de la organización
     * @param {Object} [filtros] - Filtros opcionales
     * @param {string} [filtros.plataforma] - Filtrar por plataforma
     * @param {boolean} [filtros.activo] - Filtrar por activo
     * @param {boolean} [filtros.incluir_eliminados] - Incluir chatbots eliminados (default: false)
     * @param {Object} [paginacion] - Opciones de paginación
     * @param {number} [paginacion.pagina=1] - Página actual
     * @param {number} [paginacion.limite=20] - Elementos por página
     * @returns {Promise<Object>} Objeto con chatbots y metadata de paginación
     */
    static async listarPorOrganizacion(organizacionId, filtros = {}, paginacion = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const pagina = Math.max(1, parseInt(paginacion.pagina) || 1);
            const limite = Math.min(100, Math.max(1, parseInt(paginacion.limite) || 20));
            const offset = (pagina - 1) * limite;

            // Construir condiciones WHERE dinámicamente
            const condiciones = [];
            const valores = [];
            let parametroIndex = 1;

            // Filtro por deleted_at (excluir eliminados por defecto)
            if (!filtros.incluir_eliminados) {
                condiciones.push('deleted_at IS NULL');
            }

            if (filtros.plataforma) {
                condiciones.push(`plataforma = $${parametroIndex}`);
                valores.push(filtros.plataforma);
                parametroIndex++;
            }

            if (filtros.activo !== undefined) {
                condiciones.push(`activo = $${parametroIndex}`);
                valores.push(filtros.activo);
                parametroIndex++;
            }

            const whereClause = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';

            const queryChatbots = `
                SELECT
                    id, organizacion_id, nombre, plataforma, config_plataforma,
                    n8n_workflow_id, n8n_credential_id, mcp_credential_id,
                    ai_model, ai_temperature, system_prompt, mcp_jwt_token,
                    activo, deleted_at, ultimo_error, ultimo_mensaje_recibido,
                    total_mensajes_procesados, total_citas_creadas,
                    creado_en, actualizado_en
                FROM chatbot_config
                ${whereClause}
                ORDER BY creado_en DESC
                LIMIT $${parametroIndex} OFFSET $${parametroIndex + 1}
            `;

            valores.push(limite, offset);

            const queryTotal = `
                SELECT COUNT(*) as total
                FROM chatbot_config
                ${whereClause}
            `;

            const valoresTotal = valores.slice(0, -2);

            const [resultChatbots, resultTotal] = await Promise.all([
                db.query(queryChatbots, valores),
                db.query(queryTotal, valoresTotal)
            ]);

            const total = parseInt(resultTotal.rows[0].total);
            const totalPaginas = Math.ceil(total / limite);

            return {
                chatbots: resultChatbots.rows,
                paginacion: {
                    pagina_actual: pagina,
                    total_paginas: totalPaginas,
                    total_elementos: total,
                    elementos_por_pagina: limite,
                    tiene_anterior: pagina > 1,
                    tiene_siguiente: pagina < totalPaginas
                },
                filtros_aplicados: filtros
            };
        });
    }

    /**
     * Actualizar workflow de n8n asociado al chatbot
     *
     * @param {number} id - ID del chatbot
     * @param {Object} workflowData - Datos del workflow a actualizar
     * @param {string} [workflowData.n8n_workflow_id] - ID del workflow en n8n
     * @param {string} [workflowData.n8n_credential_id] - ID de la credential en n8n
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object|null>} Chatbot actualizado o null
     */
    static async actualizarWorkflow(id, workflowData, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const camposActualizables = ['n8n_workflow_id', 'n8n_credential_id'];
            const setClauses = [];
            const valores = [id];
            let parametroIndex = 2;

            for (const campo of camposActualizables) {
                if (workflowData.hasOwnProperty(campo)) {
                    setClauses.push(`${campo} = $${parametroIndex}`);
                    valores.push(workflowData[campo]);
                    parametroIndex++;
                }
            }

            if (setClauses.length === 0) {
                ErrorHelper.throwValidation('No hay campos de workflow para actualizar');
            }

            setClauses.push(`actualizado_en = NOW()`);

            const query = `
                UPDATE chatbot_config
                SET ${setClauses.join(', ')}
                WHERE id = $1 AND deleted_at IS NULL
                RETURNING
                    id, organizacion_id, nombre, plataforma, config_plataforma,
                    n8n_workflow_id, n8n_credential_id, mcp_credential_id,
                    ai_model, ai_temperature, system_prompt, mcp_jwt_token,
                    activo, deleted_at, ultimo_error, ultimo_mensaje_recibido,
                    total_mensajes_procesados, total_citas_creadas,
                    creado_en, actualizado_en
            `;

            try {
                const result = await db.query(query, valores);
                return result.rows.length > 0 ? result.rows[0] : null;
            } catch (error) {
                if (error.code === '23505') {
                    if (error.constraint === 'chatbot_config_n8n_workflow_id_key') {
                        ErrorHelper.throwConflict(`El workflow ID ${workflowData.n8n_workflow_id} ya está en uso`);
                    }
                }
                throw error;
            }
        });
    }

    /**
     * Actualizar estado activo del chatbot
     *
     * @param {number} id - ID del chatbot
     * @param {boolean} activo - true para activar, false para desactivar
     * @param {number} organizacionId - ID de la organización
     * @param {Object} [opciones] - Opciones adicionales
     * @param {string} [opciones.ultimo_error] - Mensaje de error si hay problema al activar
     * @returns {Promise<Object|null>} Chatbot actualizado o null
     */
    static async actualizarEstado(id, activo, organizacionId, opciones = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const setClauses = ['activo = $2', 'actualizado_en = NOW()'];
            const valores = [id, activo];
            let parametroIndex = 3;

            // Si se proporciona mensaje de error, actualizarlo
            if (opciones.ultimo_error !== undefined) {
                setClauses.push(`ultimo_error = $${parametroIndex}`);
                valores.push(opciones.ultimo_error);
                parametroIndex++;
            }

            const query = `
                UPDATE chatbot_config
                SET ${setClauses.join(', ')}
                WHERE id = $1 AND deleted_at IS NULL
                RETURNING
                    id, organizacion_id, nombre, plataforma, config_plataforma,
                    n8n_workflow_id, n8n_credential_id, mcp_credential_id,
                    ai_model, ai_temperature, system_prompt, mcp_jwt_token,
                    activo, deleted_at, ultimo_error, ultimo_mensaje_recibido,
                    total_mensajes_procesados, total_citas_creadas,
                    creado_en, actualizado_en
            `;

            const result = await db.query(query, valores);
            return result.rows.length > 0 ? result.rows[0] : null;
        });
    }

    /**
     * Actualizar configuración general del chatbot
     *
     * @param {number} id - ID del chatbot
     * @param {Object} chatbotData - Datos a actualizar
     * @param {string} [chatbotData.nombre] - Nombre del chatbot
     * @param {Object} [chatbotData.config_plataforma] - Configuración de la plataforma
     * @param {string} [chatbotData.ai_model] - Modelo de IA
     * @param {number} [chatbotData.ai_temperature] - Temperatura del modelo
     * @param {string} [chatbotData.system_prompt] - Prompt del sistema
     * @param {string} [chatbotData.mcp_jwt_token] - Token JWT para MCP Server
     * @param {string} [chatbotData.mcp_credential_id] - ID de la credential MCP en n8n
     * @param {boolean} [chatbotData.activo] - Si el chatbot está activo
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object|null>} Chatbot actualizado o null
     */
    static async actualizar(id, chatbotData, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const camposActualizables = [
                'nombre', 'config_plataforma', 'ai_model', 'ai_temperature',
                'system_prompt', 'mcp_jwt_token', 'mcp_credential_id', 'activo'
            ];

            const setClauses = [];
            const valores = [id];
            let parametroIndex = 2;

            for (const campo of camposActualizables) {
                if (chatbotData.hasOwnProperty(campo)) {
                    setClauses.push(`${campo} = $${parametroIndex}`);
                    valores.push(chatbotData[campo]);
                    parametroIndex++;
                }
            }

            if (setClauses.length === 0) {
                ErrorHelper.throwValidation('No hay campos para actualizar');
            }

            setClauses.push(`actualizado_en = NOW()`);

            const query = `
                UPDATE chatbot_config
                SET ${setClauses.join(', ')}
                WHERE id = $1 AND deleted_at IS NULL
                RETURNING
                    id, organizacion_id, nombre, plataforma, config_plataforma,
                    n8n_workflow_id, n8n_credential_id, mcp_credential_id,
                    ai_model, ai_temperature, system_prompt, mcp_jwt_token,
                    activo, deleted_at, ultimo_error, ultimo_mensaje_recibido,
                    total_mensajes_procesados, total_citas_creadas,
                    creado_en, actualizado_en
            `;

            try {
                const result = await db.query(query, valores);
                return result.rows.length > 0 ? result.rows[0] : null;
            } catch (error) {
                if (error.code === '23514') {
                    if (error.constraint === 'chatbot_config_ai_temperature_check') {
                        ErrorHelper.throwValidation('La temperatura del modelo debe estar entre 0.0 y 2.0');
                    }
                }
                throw error;
            }
        });
    }

    /**
     * Incrementar métricas de uso del chatbot
     *
     * @param {number} id - ID del chatbot
     * @param {number} organizacionId - ID de la organización
     * @param {Object} metricas - Métricas a incrementar
     * @param {number} [metricas.mensajes=0] - Mensajes procesados
     * @param {number} [metricas.citas=0] - Citas creadas
     * @returns {Promise<Object|null>} Chatbot actualizado o null
     */
    static async incrementarMetricas(id, organizacionId, metricas = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const { mensajes = 0, citas = 0 } = metricas;

            const query = `
                UPDATE chatbot_config
                SET
                    total_mensajes_procesados = total_mensajes_procesados + $2,
                    total_citas_creadas = total_citas_creadas + $3,
                    actualizado_en = NOW()
                WHERE id = $1
                RETURNING
                    id, total_mensajes_procesados, total_citas_creadas, actualizado_en
            `;

            const result = await db.query(query, [id, mensajes, citas]);
            return result.rows.length > 0 ? result.rows[0] : null;
        });
    }

    /**
     * Eliminar chatbot (soft delete)
     *
     * @param {number} id - ID del chatbot
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<boolean>} true si se eliminó correctamente
     */
    static async eliminar(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                UPDATE chatbot_config
                SET activo = false, deleted_at = NOW(), actualizado_en = NOW()
                WHERE id = $1 AND deleted_at IS NULL
            `;

            const result = await db.query(query, [id]);
            return result.rowCount > 0;
        });
    }

    /**
     * Eliminar chatbot permanentemente (hard delete)
     *
     * IMPORTANTE: Esto también eliminará el workflow en n8n si existe.
     * Solo usar si el workflow ya fue eliminado de n8n o no existe.
     *
     * @param {number} id - ID del chatbot
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<boolean>} true si se eliminó correctamente
     */
    static async eliminarPermanente(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `DELETE FROM chatbot_config WHERE id = $1`;

            try {
                const result = await db.query(query, [id]);
                return result.rowCount > 0;
            } catch (error) {
                // Si hay foreign key constraints (ej: chatbot_credentials)
                if (error.code === '23503') {
                    ErrorHelper.throwConflict('No se puede eliminar el chatbot porque tiene dependencias asociadas');
                }
                throw error;
            }
        });
    }

    /**
     * Obtener estadísticas de chatbots de una organización
     *
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object>} Estadísticas de chatbots
     */
    static async obtenerEstadisticas(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    COUNT(*) FILTER (WHERE deleted_at IS NULL) as total_chatbots,
                    COUNT(*) FILTER (WHERE activo = true AND deleted_at IS NULL) as chatbots_activos,
                    COUNT(*) FILTER (WHERE activo = false AND deleted_at IS NULL) as chatbots_inactivos,
                    COUNT(*) FILTER (WHERE ultimo_error IS NOT NULL AND deleted_at IS NULL) as chatbots_con_error,
                    COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as chatbots_eliminados,
                    COUNT(DISTINCT plataforma) FILTER (WHERE deleted_at IS NULL) as total_plataformas_configuradas,
                    SUM(total_mensajes_procesados) FILTER (WHERE deleted_at IS NULL) as total_mensajes_procesados,
                    SUM(total_citas_creadas) FILTER (WHERE deleted_at IS NULL) as total_citas_creadas
                FROM chatbot_config
            `;

            const result = await db.query(query);
            const stats = result.rows[0];

            // Convertir BigInt a Number para JSON serialization
            return {
                total_chatbots: parseInt(stats.total_chatbots),
                chatbots_activos: parseInt(stats.chatbots_activos),
                chatbots_inactivos: parseInt(stats.chatbots_inactivos),
                chatbots_con_error: parseInt(stats.chatbots_con_error),
                chatbots_eliminados: parseInt(stats.chatbots_eliminados),
                total_plataformas_configuradas: parseInt(stats.total_plataformas_configuradas),
                total_mensajes_procesados: parseInt(stats.total_mensajes_procesados) || 0,
                total_citas_creadas: parseInt(stats.total_citas_creadas) || 0
            };
        });
    }

    /**
     * Obtener chatbot por workflow ID de n8n
     * Útil para verificar si un workflow ya está asociado
     *
     * @param {string} workflowId - ID del workflow en n8n
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object|null>} Chatbot o null
     */
    static async obtenerPorWorkflowId(workflowId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    id, organizacion_id, nombre, plataforma, config_plataforma,
                    n8n_workflow_id, n8n_credential_id, mcp_credential_id,
                    ai_model, ai_temperature, system_prompt, mcp_jwt_token,
                    activo, deleted_at, ultimo_error, ultimo_mensaje_recibido,
                    total_mensajes_procesados, total_citas_creadas,
                    creado_en, actualizado_en
                FROM chatbot_config
                WHERE n8n_workflow_id = $1 AND deleted_at IS NULL
            `;

            const result = await db.query(query, [workflowId]);
            return result.rows[0] || null;
        });
    }
}

module.exports = ChatbotConfigModel;
