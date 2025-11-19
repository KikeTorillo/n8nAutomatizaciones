/**
 * Rutas de Chatbots - CRUD con aislamiento multi-tenant
 *
 * Stack de middleware estándar:
 * 1. rateLimiting - Rate limiting por tipo de operación
 * 2. auth.authenticateToken - Validación JWT
 * 3. tenant.setTenantContext - Configurar RLS context
 * 4. tenant.verifyTenantActive - Verificar que la org esté activa (solo para mutaciones)
 * 5. validation.validate - Validación Joi de request
 * 6. Controller - Lógica de negocio
 */

const express = require('express');
const ChatbotController = require('../../../../../controllers/chatbot.controller');
const { auth, tenant, rateLimiting, validation } = require('../../../../../middleware');
const chatbotSchemas = require('../../schemas/chatbot.schemas');

const router = express.Router();

// ========== Rutas de Estadísticas ==========
// IMPORTANTE: Rutas específicas primero para evitar conflictos con /:id

router.get('/estadisticas',
    rateLimiting.apiRateLimit,
    auth.authenticateToken,
    tenant.setTenantContext,
    validation.validate(chatbotSchemas.obtenerEstadisticas),
    ChatbotController.obtenerEstadisticas
);

// ========== Rutas CRUD Estándar ==========

/**
 * POST /api/v1/chatbots/configurar
 * Configurar nuevo chatbot (operación pesada por integración con n8n)
 *
 * Flujo:
 * 1. Validar credenciales con plataforma (Telegram API, etc)
 * 2. Crear credential en n8n
 * 3. Crear workflow en n8n
 * 4. Activar workflow
 * 5. Guardar config en BD
 */
router.post('/configurar',
    rateLimiting.heavyOperationRateLimit, // Operación pesada
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    validation.validate(chatbotSchemas.configurar),
    ChatbotController.configurar
);

/**
 * GET /api/v1/chatbots
 * Listar chatbots con filtros opcionales
 */
router.get('/',
    rateLimiting.apiRateLimit,
    auth.authenticateToken,
    tenant.setTenantContext,
    validation.validate(chatbotSchemas.listar),
    ChatbotController.listar
);

/**
 * GET /api/v1/chatbots/:id
 * Obtener chatbot por ID
 */
router.get('/:id',
    rateLimiting.apiRateLimit,
    auth.authenticateToken,
    tenant.setTenantContext,
    validation.validate(chatbotSchemas.obtenerPorId),
    ChatbotController.obtener
);

/**
 * PUT /api/v1/chatbots/:id
 * Actualizar configuración general del chatbot
 */
router.put('/:id',
    rateLimiting.heavyOperationRateLimit,
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    validation.validate(chatbotSchemas.actualizar),
    ChatbotController.actualizar
);

/**
 * PATCH /api/v1/chatbots/:id/estado
 * Actualizar solo el estado del chatbot
 */
router.patch('/:id/estado',
    rateLimiting.apiRateLimit,
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    validation.validate(chatbotSchemas.actualizarEstado),
    ChatbotController.actualizarEstado
);

/**
 * DELETE /api/v1/chatbots/:id
 * Eliminar chatbot (soft delete + eliminar workflow y credential de n8n)
 *
 * IMPORTANTE: Solo admin o propietario pueden eliminar chatbots
 */
router.delete('/:id',
    rateLimiting.heavyOperationRateLimit,
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole, // Solo admin/propietario
    validation.validate(chatbotSchemas.eliminar),
    ChatbotController.eliminar
);

module.exports = router;
