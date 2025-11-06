/**
 * ====================================================================
 * CONFIGURACIÓN WHATSAPP - Nodos Específicos
 * ====================================================================
 *
 * Define los 3 nodos que son específicos de WhatsApp:
 * 1. WhatsApp Trigger
 * 2. Edit Fields (extracción de sender desde entry[0].changes[0].value.messages[0].from)
 * 3. Send message
 */

const crypto = require('crypto');

/**
 * Crea nodo WhatsApp Trigger
 */
function crearWhatsAppTrigger(nodeIds, credentialId) {
    return {
        parameters: {
            updates: ['messages'],
            options: {}
        },
        type: 'n8n-nodes-base.whatsAppTrigger',
        typeVersion: 1,
        position: [-1344, 96],
        id: nodeIds.trigger,
        name: 'WhatsApp Trigger',
        webhookId: crypto.randomUUID(),
        credentials: {
            whatsAppApi: {
                id: credentialId,
                name: 'WhatsApp account'
            }
        }
    };
}

/**
 * Crea nodo Edit Fields (extracción específica de WhatsApp)
 */
function crearEditFieldsWhatsApp(nodeIds) {
    return {
        parameters: {
            assignments: {
                assignments: [
                    {
                        id: crypto.randomUUID(),
                        name: 'sender',
                        value: '={{ $json.entry[0].changes[0].value.messages[0].from }}',  // ← WHATSAPP ESPECÍFICO
                        type: 'string'
                    },
                    {
                        id: crypto.randomUUID(),
                        name: 'conversation',
                        value: '={{ $json.entry[0].changes[0].value.messages[0].text.body }}',
                        type: 'string'
                    },
                    {
                        id: crypto.randomUUID(),
                        name: 'sessionId',
                        value: '={{ $json.entry[0].changes[0].value.messages[0].from }}',
                        type: 'string'
                    }
                ]
            },
            options: {}
        },
        type: 'n8n-nodes-base.set',
        typeVersion: 3.4,
        position: [-1120, 96],
        id: nodeIds.editFields,
        name: 'Edit Fields'
    };
}

/**
 * Crea nodo Send message (WhatsApp)
 */
function crearSendMessageWhatsApp(nodeIds, credentialId) {
    return {
        parameters: {
            operation: 'send',
            to: "={{ $('Redis').item.json.sender }}",
            message: '={{ $json.output }}',
            additionalFields: {}
        },
        type: 'n8n-nodes-base.whatsApp',
        typeVersion: 1.1,
        position: [880, 0],
        id: nodeIds.sendMessage,
        name: 'Send message',
        credentials: {
            whatsAppApi: {
                id: credentialId,
                name: 'WhatsApp account'
            }
        }
    };
}

/**
 * Crea todos los nodos específicos de WhatsApp
 */
function crearNodos(nodeIds, credentials) {
    return [
        crearWhatsAppTrigger(nodeIds, credentials.whatsapp),
        crearEditFieldsWhatsApp(nodeIds),
        crearSendMessageWhatsApp(nodeIds, credentials.whatsapp)
    ];
}

// ====================================================================
// EXPORTS
// ====================================================================

module.exports = {
    crearNodos,
    plataforma: 'whatsapp'
};
