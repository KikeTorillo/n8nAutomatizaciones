/**
 * ====================================================================
 * WORKFLOW GENERATOR - Generación Dinámica de Workflows n8n
 * ====================================================================
 *
 * Sistema modular para generar workflows de chatbots eliminando
 * duplicación de código entre plataformas.
 *
 * ANTES: 2 archivos (422 + 373 líneas) con 90% duplicación
 * AHORA: 1 generador + configs por plataforma
 *
 * Arquitectura:
 * - Nodos comunes (90%): Anti-flood, AI Agent, Memory, MCP
 * - Nodos específicos (10%): Trigger, Extract, Send
 */

const crypto = require('crypto');

// ====================================================================
// GENERADOR DE IDs ÚNICOS
// ====================================================================

function generarNodeId() {
    return crypto.randomUUID();
}

// ====================================================================
// FACTORY DE NODOS COMUNES
// ====================================================================

/**
 * Crea nodo Redis para anti-flood (PUSH)
 */
function crearRedisNode(nodeIds, redisCredentialId) {
    return {
        parameters: {
            operation: 'push',
            list: '={{ $json.sender }}',
            messageData: '={{ $json.conversation }}',
            tail: true
        },
        type: 'n8n-nodes-base.redis',
        typeVersion: 1,
        position: [448, 648],
        id: nodeIds.redis,
        name: 'Redis',
        credentials: {
            redis: {
                id: redisCredentialId,
                name: 'Redis account'
            }
        }
    };
}

/**
 * Crea nodo Wait (20 segundos de debouncing)
 */
function crearWaitNode(nodeIds) {
    return {
        parameters: {
            amount: 20
        },
        type: 'n8n-nodes-base.wait',
        typeVersion: 1.1,
        position: [672, 648],
        id: nodeIds.wait,
        name: 'Wait',
        webhookId: crypto.randomUUID()
    };
}

/**
 * Crea nodo Redis1 (GET - recuperar mensajes)
 */
function crearRedis1Node(nodeIds, redisCredentialId) {
    return {
        parameters: {
            operation: 'get',
            key: "={{ $('Redis').item.json.sender }}",
            options: {}
        },
        type: 'n8n-nodes-base.redis',
        typeVersion: 1,
        position: [896, 648],
        id: nodeIds.redis1,
        name: 'Redis1',
        credentials: {
            redis: {
                id: redisCredentialId,
                name: 'Redis account'
            }
        }
    };
}

/**
 * Crea nodo If (verificar último mensaje)
 */
function crearIfNode(nodeIds) {
    return {
        parameters: {
            conditions: {
                options: {
                    caseSensitive: true,
                    leftValue: '',
                    typeValidation: 'strict',
                    version: 2
                },
                conditions: [
                    {
                        id: crypto.randomUUID(),
                        leftValue: "={{ $json.propertyName.last() }}",
                        rightValue: "={{ $('Redis').item.json.conversation }}",
                        operator: {
                            type: 'string',
                            operation: 'equals',
                            name: 'filter.operator.equals'
                        }
                    }
                ],
                combinator: 'and'
            },
            options: {}
        },
        type: 'n8n-nodes-base.if',
        typeVersion: 2.2,
        position: [1120, 648],
        id: nodeIds.if,
        name: 'If'
    };
}

/**
 * Crea nodo No Operation (descarte de duplicados)
 */
function crearNoOpNode(nodeIds) {
    return {
        parameters: {},
        type: 'n8n-nodes-base.noOp',
        typeVersion: 1,
        position: [1344, 744],
        id: nodeIds.noOp,
        name: 'No Operation, do nothing'
    };
}

/**
 * Crea nodo Redis2 (DELETE - limpiar buffer)
 */
function crearRedis2Node(nodeIds, redisCredentialId) {
    return {
        parameters: {
            operation: 'delete',
            key: "={{ $('Redis').item.json.sender }}"
        },
        type: 'n8n-nodes-base.redis',
        typeVersion: 1,
        position: [1344, 552],
        id: nodeIds.redis2,
        name: 'Redis2',
        credentials: {
            redis: {
                id: redisCredentialId,
                name: 'Redis account'
            }
        }
    };
}

/**
 * Crea nodo AI Agent
 */
function crearAIAgentNode(nodeIds, systemPrompt) {
    return {
        parameters: {
            promptType: 'define',
            text: "={{ $('Redis1').item.json.propertyName.join(\" \") }}",
            options: {
                systemMessage: `=${systemPrompt}`
            }
        },
        type: '@n8n/n8n-nodes-langchain.agent',
        typeVersion: 2.2,
        position: [1752, 552],
        id: nodeIds.aiAgent,
        name: 'AI Agent'
    };
}

/**
 * Crea nodo DeepSeek Chat Model
 */
function crearDeepSeekNode(nodeIds, deepseekCredentialId) {
    return {
        parameters: {
            options: {}
        },
        type: '@n8n/n8n-nodes-langchain.lmChatDeepSeek',
        typeVersion: 1,
        position: [1568, 776],
        id: nodeIds.deepseek,
        name: 'DeepSeek Chat Model',
        credentials: {
            deepSeekApi: {
                id: deepseekCredentialId,
                name: 'DeepSeek account'
            }
        }
    };
}

/**
 * Crea nodo Postgres Chat Memory
 */
function crearPostgresChatMemoryNode(nodeIds, postgresCredentialId) {
    return {
        parameters: {
            sessionIdType: 'customKey',
            sessionKey: "={{ $('Redis').item.json.sender }}"
        },
        type: '@n8n/n8n-nodes-langchain.memoryPostgresChat',
        typeVersion: 1.3,
        position: [1696, 776],
        id: nodeIds.postgresMemory,
        name: 'Postgres Chat Memory',
        credentials: {
            postgres: {
                id: postgresCredentialId,
                name: 'Postgres account'
            }
        }
    };
}

/**
 * Crea nodo MCP Client - All Tools
 */
function crearMCPClientNode(nodeIds, mcpCredential) {
    return {
        parameters: {
            endpointUrl: 'http://mcp-server:3100/mcp/execute',
            authentication: 'headerAuth',
            options: {}
        },
        type: '@n8n/n8n-nodes-langchain.mcpClientTool',
        typeVersion: 1.2,
        position: [1824, 776],
        id: nodeIds.mcpClient,
        name: 'MCP Client - All Tools',
        credentials: {
            httpHeaderAuth: {
                id: mcpCredential.id,
                name: mcpCredential.name
            }
        }
    };
}

// ====================================================================
// CREADOR DE CONEXIONES
// ====================================================================

/**
 * Crea las conexiones entre nodos
 * @param {string} plataforma - 'telegram' o 'whatsapp'
 */
function crearConexiones(plataforma) {
    // Nombres de nodos específicos por plataforma
    const nombreTrigger = plataforma === 'telegram' ? 'Telegram Trigger' : 'WhatsApp Trigger';
    const nombreSend = plataforma === 'telegram' ? 'Send a text message' : 'Send message';

    return {
        'Edit Fields': {
            main: [[{ node: 'Redis', type: 'main', index: 0 }]]
        },
        'DeepSeek Chat Model': {
            ai_languageModel: [[{ node: 'AI Agent', type: 'ai_languageModel', index: 0 }]]
        },
        'AI Agent': {
            main: [[{ node: nombreSend, type: 'main', index: 0 }]]
        },
        'Redis': {
            main: [[{ node: 'Wait', type: 'main', index: 0 }]]
        },
        'Wait': {
            main: [[{ node: 'Redis1', type: 'main', index: 0 }]]
        },
        'Redis1': {
            main: [[{ node: 'If', type: 'main', index: 0 }]]
        },
        'If': {
            main: [
                [{ node: 'Redis2', type: 'main', index: 0 }],
                [{ node: 'No Operation, do nothing', type: 'main', index: 0 }]
            ]
        },
        'Redis2': {
            main: [[{ node: 'AI Agent', type: 'main', index: 0 }]]
        },
        'Postgres Chat Memory': {
            ai_memory: [[{ node: 'AI Agent', type: 'ai_memory', index: 0 }]]
        },
        'MCP Client - All Tools': {
            ai_tool: [[{ node: 'AI Agent', type: 'ai_tool', index: 0 }]]
        },
        [nombreTrigger]: {
            main: [[{ node: 'Edit Fields', type: 'main', index: 0 }]]
        }
    };
}

// ====================================================================
// GENERADOR PRINCIPAL
// ====================================================================

/**
 * Genera workflow completo para una plataforma
 *
 * @param {Object} config - Configuración del workflow
 * @param {string} config.nombre - Nombre del workflow
 * @param {string} config.plataforma - 'telegram' o 'whatsapp'
 * @param {Object} config.platformConfig - Configuración específica de plataforma
 * @param {string} config.systemPrompt - System prompt del AI Agent
 * @param {Object} config.credentials - IDs de credentials
 * @param {Object} config.mcpCredential - Credential MCP
 * @returns {Object} - Workflow completo n8n
 */
function generarWorkflow({
    nombre,
    plataforma,
    platformConfig,
    systemPrompt,
    credentials,
    mcpCredential
}) {
    // Generar IDs únicos para todos los nodos
    const nodeIds = {
        trigger: generarNodeId(),
        editFields: generarNodeId(),
        redis: generarNodeId(),
        wait: generarNodeId(),
        redis1: generarNodeId(),
        if: generarNodeId(),
        noOp: generarNodeId(),
        redis2: generarNodeId(),
        aiAgent: generarNodeId(),
        deepseek: generarNodeId(),
        postgresMemory: generarNodeId(),
        mcpClient: generarNodeId(),
        sendMessage: generarNodeId()
    };

    // Crear nodos comunes
    const nodosComunes = [
        crearRedisNode(nodeIds, credentials.redis),
        crearWaitNode(nodeIds),
        crearRedis1Node(nodeIds, credentials.redis),
        crearIfNode(nodeIds),
        crearNoOpNode(nodeIds),
        crearRedis2Node(nodeIds, credentials.redis),
        crearAIAgentNode(nodeIds, systemPrompt),
        crearDeepSeekNode(nodeIds, credentials.deepseek),
        crearPostgresChatMemoryNode(nodeIds, credentials.postgres),
        crearMCPClientNode(nodeIds, mcpCredential)
    ];

    // Agregar nodos específicos de plataforma
    const nodosEspecificos = platformConfig.crearNodos(nodeIds, credentials);

    // Combinar todos los nodos
    const nodes = [...nodosEspecificos, ...nodosComunes];

    // Crear workflow completo
    const workflow = {
        name: `${nombre} - ${plataforma} Bot`,
        nodes,
        connections: crearConexiones(plataforma),
        settings: {
            executionOrder: 'v1'
        }
    };

    // NOTA: No incluir 'active: false' - es un campo read-only en n8n API
    // n8n gestiona este campo automáticamente

    return workflow;
}

// ====================================================================
// EXPORTS
// ====================================================================

module.exports = {
    generarWorkflow,
    generarNodeId
};
