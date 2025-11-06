/**
 * ====================================================================
 * CONFIGURACIÓN TELEGRAM - Nodos Específicos
 * ====================================================================
 *
 * Define los 3 nodos que son específicos de Telegram:
 * 1. Telegram Trigger
 * 2. Edit Fields (extracción de sender desde message.from.id)
 * 3. Send a text message
 */

const crypto = require('crypto');

/**
 * Crea nodo Telegram Trigger
 */
function crearTelegramTrigger(nodeIds, credentialId) {
    const triggerId = nodeIds.trigger;

    return {
        parameters: {
            updates: ['message'],
            additionalFields: {}
        },
        type: 'n8n-nodes-base.telegramTrigger',
        typeVersion: 1.2,
        position: [0, 648],
        id: triggerId,
        name: 'Telegram Trigger',
        webhookId: triggerId,  // ✅ Fix bug n8n: webhookId = node.id
        credentials: {
            telegramApi: {
                id: credentialId,
                name: 'Telegram account'
            }
        }
    };
}

/**
 * Crea nodo Edit Fields (extracción específica de Telegram)
 */
function crearEditFieldsTelegram(nodeIds) {
    return {
        parameters: {
            assignments: {
                assignments: [
                    {
                        id: crypto.randomUUID(),
                        name: 'sender',
                        value: '={{ $json.message.from.id }}',  // ← TELEGRAM ESPECÍFICO
                        type: 'string'
                    },
                    {
                        id: crypto.randomUUID(),
                        name: 'conversation',
                        value: '={{ $json.message.text }}',
                        type: 'string'
                    },
                    {
                        id: crypto.randomUUID(),
                        name: 'sessionId',
                        value: '={{ $json.message.from.id }}',
                        type: 'number'
                    }
                ]
            },
            options: {}
        },
        type: 'n8n-nodes-base.set',
        typeVersion: 3.4,
        position: [224, 648],
        id: nodeIds.editFields,
        name: 'Edit Fields'
    };
}

/**
 * Crea nodo Send a text message (Telegram)
 */
function crearSendMessageTelegram(nodeIds, credentialId) {
    return {
        parameters: {
            chatId: "={{ $('Telegram Trigger').item.json.message.from.id }}",
            text: '={{ $json.output }}',
            additionalFields: {}
        },
        type: 'n8n-nodes-base.telegram',
        typeVersion: 1.2,
        position: [2288, 552],
        id: nodeIds.sendMessage,
        name: 'Send a text message',
        webhookId: crypto.randomUUID(),
        credentials: {
            telegramApi: {
                id: credentialId,
                name: 'Telegram account'
            }
        }
    };
}

/**
 * Crea todos los nodos específicos de Telegram
 */
function crearNodos(nodeIds, credentials) {
    return [
        crearTelegramTrigger(nodeIds, credentials.telegram),
        crearEditFieldsTelegram(nodeIds),
        crearSendMessageTelegram(nodeIds, credentials.telegram)
    ];
}

// ====================================================================
// EXPORTS
// ====================================================================

module.exports = {
    crearNodos,
    plataforma: 'telegram'
};
