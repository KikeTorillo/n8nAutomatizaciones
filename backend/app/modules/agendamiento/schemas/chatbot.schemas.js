/**
 * Schemas de Validación Joi para Chatbots
 *
 * Validaciones específicas por plataforma de mensajería.
 * Cada plataforma tiene su propia estructura de config_plataforma.
 */

const Joi = require('joi');
const { commonSchemas } = require('../../../middleware/validation');

// ========== Regex Patterns ==========

// Telegram bot token: {bot_id}:{hash} (ej: 123456789:ABCdefGHI_jklMNOpqrSTUvwxYZ12345678)
const TELEGRAM_TOKEN_REGEX = /^\d{8,10}:[A-Za-z0-9_-]{35}$/;

// ========== Plataformas Soportadas ==========

const PLATAFORMAS_VALIDAS = [
    'telegram',
    'whatsapp',
    'instagram',
    'facebook_messenger',
    'slack',
    'discord',
    'otro'
];

// ========== Modelos de IA Soportados ==========

const MODELOS_IA_VALIDOS = [
    'qwen3-235b',        // ✅ Modelo principal - mejor function calling
    'deepseek-chat',
    'gpt-4',
    'gpt-4-turbo',
    'gpt-3.5-turbo',
    'claude-3-opus',
    'claude-3-sonnet',
    'claude-3-haiku'
];

// ========== Config Plataforma por Tipo ==========

/**
 * Schema de configuración específica para Telegram
 */
const configTelegramSchema = Joi.object({
    bot_token: Joi.string().pattern(TELEGRAM_TOKEN_REGEX).required()
        .messages({
            'string.empty': 'bot_token es requerido para Telegram',
            'string.pattern.base': 'bot_token debe tener formato válido: {bot_id}:{hash}'
        }),
    webhook_url: Joi.string().uri().optional().allow(null, ''),
    allowed_updates: Joi.array().items(Joi.string()).optional().default([
        'message', 'callback_query', 'inline_query'
    ])
});

/**
 * Schema de configuración específica para WhatsApp
 */
const configWhatsAppSchema = Joi.object({
    api_key: Joi.string().min(10).required()
        .messages({
            'string.empty': 'api_key es requerido para WhatsApp',
            'string.min': 'api_key debe tener al menos 10 caracteres'
        }),
    phone_number_id: Joi.string().required()
        .messages({'string.empty': 'phone_number_id es requerido para WhatsApp'}),
    business_account_id: Joi.string().optional().allow(null, ''),
    webhook_verify_token: Joi.string().optional().allow(null, '')
});

/**
 * Schema de configuración específica para Instagram
 */
const configInstagramSchema = Joi.object({
    access_token: Joi.string().min(10).required()
        .messages({
            'string.empty': 'access_token es requerido para Instagram',
            'string.min': 'access_token debe tener al menos 10 caracteres'
        }),
    instagram_account_id: Joi.string().required()
        .messages({'string.empty': 'instagram_account_id es requerido'}),
    webhook_verify_token: Joi.string().optional().allow(null, '')
});

/**
 * Schema de configuración específica para Facebook Messenger
 */
const configFacebookMessengerSchema = Joi.object({
    page_access_token: Joi.string().min(10).required()
        .messages({
            'string.empty': 'page_access_token es requerido para Facebook Messenger',
            'string.min': 'page_access_token debe tener al menos 10 caracteres'
        }),
    page_id: Joi.string().required()
        .messages({'string.empty': 'page_id es requerido'}),
    app_id: Joi.string().optional().allow(null, ''),
    webhook_verify_token: Joi.string().optional().allow(null, '')
});

/**
 * Schema de configuración específica para Slack
 */
const configSlackSchema = Joi.object({
    bot_token: Joi.string().pattern(/^xoxb-/).required()
        .messages({
            'string.empty': 'bot_token es requerido para Slack',
            'string.pattern.base': 'bot_token debe comenzar con xoxb-'
        }),
    app_token: Joi.string().pattern(/^xapp-/).optional().allow(null, ''),
    signing_secret: Joi.string().optional().allow(null, '')
});

/**
 * Schema de configuración específica para Discord
 */
const configDiscordSchema = Joi.object({
    bot_token: Joi.string().min(50).required()
        .messages({
            'string.empty': 'bot_token es requerido para Discord',
            'string.min': 'bot_token debe tener al menos 50 caracteres'
        }),
    application_id: Joi.string().required()
        .messages({'string.empty': 'application_id es requerido'}),
    public_key: Joi.string().optional().allow(null, '')
});

/**
 * Schema genérico para plataformas no especificadas
 */
const configOtroSchema = Joi.object().pattern(
    Joi.string(),
    Joi.alternatives().try(
        Joi.string(),
        Joi.number(),
        Joi.boolean(),
        Joi.object(),
        Joi.array()
    )
);

// ========== Schemas CRUD Estándar ==========

/**
 * Schema para configurar un nuevo chatbot
 * Valida config_plataforma según el tipo de plataforma
 */
const configurar = {
    body: Joi.object({
        nombre: Joi.string().trim().min(3).max(255).required()
            .messages({
                'string.empty': 'nombre es requerido',
                'string.min': 'nombre debe tener al menos 3 caracteres',
                'string.max': 'nombre no puede exceder 255 caracteres'
            }),

        plataforma: Joi.string().valid(...PLATAFORMAS_VALIDAS).required()
            .messages({
                'string.empty': 'plataforma es requerida',
                'any.only': `plataforma debe ser una de: ${PLATAFORMAS_VALIDAS.join(', ')}`
            }),

        config_plataforma: Joi.when('plataforma', {
            switch: [
                { is: 'telegram', then: configTelegramSchema },
                { is: 'whatsapp', then: configWhatsAppSchema },
                { is: 'instagram', then: configInstagramSchema },
                { is: 'facebook_messenger', then: configFacebookMessengerSchema },
                { is: 'slack', then: configSlackSchema },
                { is: 'discord', then: configDiscordSchema },
                { is: 'otro', then: configOtroSchema }
            ],
            otherwise: Joi.object().required()
        }).required(),

        ai_model: Joi.string().valid(...MODELOS_IA_VALIDOS).optional().default('qwen3-235b')
            .messages({
                'any.only': `ai_model debe ser uno de: ${MODELOS_IA_VALIDOS.join(', ')}`
            }),

        ai_temperature: Joi.number().min(0.0).max(2.0).optional().default(0.4)
            .messages({
                'number.min': 'ai_temperature debe estar entre 0.0 y 2.0',
                'number.max': 'ai_temperature debe estar entre 0.0 y 2.0'
            }),

        system_prompt: Joi.string().trim().max(10000).optional().allow(null, '')
            .messages({
                'string.max': 'system_prompt no puede exceder 10000 caracteres'
            }),

        activo: Joi.boolean().optional().default(true)
    })
};

/**
 * Schema para listar chatbots con filtros
 */
const listar = {
    query: Joi.object({
        pagina: Joi.number().integer().min(1).default(1),
        limite: Joi.number().integer().min(1).max(100).default(20),
        plataforma: Joi.string().valid(...PLATAFORMAS_VALIDAS).optional(),
        activo: Joi.boolean().optional(),
        incluir_eliminados: Joi.boolean().optional()
    })
};

/**
 * Schema para obtener chatbot por ID
 */
const obtenerPorId = {
    params: Joi.object({
        id: commonSchemas.id
    })
};

/**
 * Schema para actualizar configuración general del chatbot
 */
const actualizar = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        nombre: Joi.string().trim().min(3).max(255).optional(),

        config_plataforma: Joi.object().optional(),

        ai_model: Joi.string().valid(...MODELOS_IA_VALIDOS).optional(),

        ai_temperature: Joi.number().min(0.0).max(2.0).optional()
            .messages({
                'number.min': 'ai_temperature debe estar entre 0.0 y 2.0',
                'number.max': 'ai_temperature debe estar entre 0.0 y 2.0'
            }),

        system_prompt: Joi.string().trim().max(10000).optional().allow(null, ''),

        activo: Joi.boolean().optional()
    }).min(1)
        .messages({
            'object.min': 'Debe proporcionar al menos un campo para actualizar'
        })
};

/**
 * Schema para eliminar chatbot (soft delete)
 */
const eliminar = {
    params: Joi.object({
        id: commonSchemas.id
    })
};

// ========== Schemas Específicos de Chatbot ==========

/**
 * Schema para actualizar estado activo del chatbot
 * Mapeo 1:1 con workflow.active de n8n
 */
const actualizarEstado = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        activo: Joi.boolean().required()
            .messages({
                'boolean.base': 'activo debe ser un valor booleano (true/false)',
                'any.required': 'activo es requerido'
            }),

        ultimo_error: Joi.string().trim().max(500).allow(null, '').optional()
            .messages({
                'string.max': 'ultimo_error no puede exceder 500 caracteres'
            })
    })
};

/**
 * Schema para actualizar workflow de n8n
 */
const actualizarWorkflow = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        n8n_workflow_id: Joi.string().trim().min(1).max(100).optional()
            .messages({
                'string.empty': 'n8n_workflow_id no puede estar vacío',
                'string.max': 'n8n_workflow_id no puede exceder 100 caracteres'
            }),

        n8n_credential_id: Joi.string().trim().min(1).max(100).optional()
            .messages({
                'string.empty': 'n8n_credential_id no puede estar vacío',
                'string.max': 'n8n_credential_id no puede exceder 100 caracteres'
            })
    }).min(1)
        .messages({
            'object.min': 'Debe proporcionar al menos un campo de workflow para actualizar'
        })
};

/**
 * Schema para incrementar métricas de uso
 */
const incrementarMetricas = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        mensajes: Joi.number().integer().min(0).optional().default(0)
            .messages({
                'number.min': 'mensajes debe ser un número positivo'
            }),

        citas: Joi.number().integer().min(0).optional().default(0)
            .messages({
                'number.min': 'citas debe ser un número positivo'
            })
    })
};

/**
 * Schema para obtener estadísticas
 */
const obtenerEstadisticas = {
    query: Joi.object({})
};

// ========== Exports ==========

module.exports = {
    configurar,
    listar,
    obtenerPorId,
    actualizar,
    eliminar,
    actualizarEstado,
    actualizarWorkflow,
    incrementarMetricas,
    obtenerEstadisticas,

    // Exportar constantes para uso en tests
    PLATAFORMAS_VALIDAS,
    MODELOS_IA_VALIDOS,
    TELEGRAM_TOKEN_REGEX
};
