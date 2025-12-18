-- ====================================================================
-- 🤖 MÓDULO: CHATBOTS - SISTEMA DE CHATBOTS IA MULTI-PLATAFORMA
-- ====================================================================
--
-- PROPÓSITO:
-- Gestión completa de chatbots de IA conversacional para múltiples
-- plataformas de mensajería (Telegram, WhatsApp, Instagram, etc.).
--
-- COMPONENTES:
-- • Tabla chatbot_config: Configuración principal de chatbots
-- • Tabla chatbot_credentials: Auditoría de credentials n8n
--
-- CARACTERÍSTICAS:
-- ✅ Multi-plataforma (7 plataformas soportadas)
-- ✅ Integración con n8n workflows
-- ✅ Autenticación MCP Server (JWT multi-tenant)
-- ✅ System prompts personalizables
-- ✅ Métricas de uso y monitoreo
-- ✅ Soft delete para preservar historial
-- ✅ Configuración JSONB flexible por plataforma
--
-- ORDEN DE CARGA: #11 (después de pagos)
-- VERSIÓN: 1.0.0
-- FECHA: 17 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- TABLA 1: CHATBOT_CONFIG - CONFIGURACIÓN PRINCIPAL DE CHATBOTS
-- ====================================================================
-- Tabla que gestiona la configuración de chatbots de IA multi-plataforma
-- por organización. Cada organización puede tener múltiples chatbots
-- (uno por cada plataforma).
-- ────────────────────────────────────────────────────────────────────

CREATE TABLE chatbot_config (
    -- 🔑 IDENTIFICACIÓN Y RELACIONES
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    sucursal_id INTEGER,  -- NULL = bot de la organización, con valor = bot de sucursal específica

    -- 📱 IDENTIFICACIÓN DEL CHATBOT
    nombre VARCHAR(255) NOT NULL,
    plataforma plataforma_chatbot NOT NULL,

    -- ⚙️ CONFIGURACIÓN ESPECÍFICA DE LA PLATAFORMA
    -- JSON flexible que varía según la plataforma:
    --
    -- Telegram:
    -- {
    --     "bot_token": "123456789:ABC...",
    --     "bot_username": "mibarberia_bot",
    --     "bot_id": 123456789
    -- }
    --
    -- WhatsApp (Evolution API):
    -- {
    --     "phone_number": "+5215512345678",
    --     "instance_id": "instance-uuid",
    --     "api_key": "evolution-api-key"
    -- }
    --
    -- Instagram:
    -- {
    --     "access_token": "instagram-access-token",
    --     "page_id": "123456789",
    --     "username": "@mibarberia"
    -- }
    config_plataforma JSONB NOT NULL,

    -- 🔗 INTEGRACIÓN CON N8N
    n8n_workflow_id VARCHAR(100) UNIQUE,
    n8n_workflow_name VARCHAR(255),
    n8n_credential_id VARCHAR(100),

    -- 🔐 AUTENTICACIÓN MCP SERVER (Multi-tenant)
    -- Token JWT único por chatbot para que el MCP Server
    -- pueda autenticarse con el backend en nombre de esta organización.
    -- Cada chatbot tiene su propio token con su organizacion_id embebido.
    mcp_jwt_token TEXT,

    -- ID de la credential httpHeaderAuth en n8n para autenticación MCP
    -- ESTRATEGIA: 1 credential por organización (compartida entre chatbots)
    -- Esto reduce clutter en n8n y facilita rotación de tokens
    mcp_credential_id VARCHAR(50),

    -- 🧠 CONFIGURACIÓN DEL AGENTE IA
    ai_model VARCHAR(100) DEFAULT 'deepseek-chat',
    ai_temperature DECIMAL(3,2) DEFAULT 0.7 CHECK (ai_temperature >= 0 AND ai_temperature <= 2),
    system_prompt TEXT,

    -- 🔄 ESTADO (Simplificado - Mapeo 1:1 con n8n)
    -- activo: true/false → Mapea directamente con workflow.active en n8n
    -- deleted_at: NULL = activo, NOT NULL = eliminado (soft delete)
    -- ultimo_error: NULL = sin errores, TEXT = mensaje de error diagnóstico
    activo BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ NULL,
    ultimo_error TEXT NULL,

    -- 📊 MÉTRICAS
    ultimo_mensaje_recibido TIMESTAMPTZ,
    total_mensajes_procesados INTEGER DEFAULT 0 CHECK (total_mensajes_procesados >= 0),
    total_citas_creadas INTEGER DEFAULT 0 CHECK (total_citas_creadas >= 0),

    -- ⚙️ CONFIGURACIÓN AVANZADA (OPCIONAL)
    -- Ejemplos:
    -- {
    --     "max_tokens": 2000,
    --     "context_window": 10,
    --     "allow_group_chats": false,
    --     "custom_commands": ["/ayuda", "/horarios"]
    -- }
    config_avanzada JSONB DEFAULT '{}'::jsonb,

    -- ⏰ TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    -- ✅ CONSTRAINTS
    CONSTRAINT chk_nombre_not_empty
        CHECK (LENGTH(TRIM(nombre)) > 0),

    CONSTRAINT chk_system_prompt_length
        CHECK (system_prompt IS NULL OR LENGTH(system_prompt) >= 100)
);

-- ====================================================================
-- 🔒 ÍNDICE ÚNICO PARCIAL: SOLO CHATBOTS ACTIVOS (NO ELIMINADOS)
-- ====================================================================
-- IMPORTANTE: No se puede usar UNIQUE constraint directo porque
-- necesitamos excluir registros con soft delete (deleted_at IS NOT NULL).
--
-- Con este índice parcial:
-- ✅ PERMITE: Crear chatbot Telegram después de eliminar uno anterior
-- ✅ PREVIENE: Tener 2+ chatbots Telegram activos simultáneamente
-- ====================================================================
CREATE UNIQUE INDEX uq_chatbot_org_plataforma_active
    ON chatbot_config(organizacion_id, plataforma)
    WHERE deleted_at IS NULL;

COMMENT ON INDEX uq_chatbot_org_plataforma_active IS
'Garantiza 1 chatbot activo por plataforma por organización.
Excluye registros eliminados (soft delete) para permitir recreación.';

-- ====================================================================
-- TABLA 2: CHATBOT_CREDENTIALS - AUDITORÍA DE CREDENTIALS N8N
-- ====================================================================
-- Tabla OPCIONAL para auditoría de credentials creadas en n8n.
-- Permite rastrear qué credentials están asociadas a qué chatbots
-- y validar su estado.
-- ────────────────────────────────────────────────────────────────────

CREATE TABLE chatbot_credentials (
    -- 🔑 IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,
    chatbot_config_id INTEGER NOT NULL REFERENCES chatbot_config(id) ON DELETE CASCADE,

    -- 🔗 REFERENCIA A N8N
    n8n_credential_id VARCHAR(100) NOT NULL UNIQUE,
    credential_type VARCHAR(100) NOT NULL,
    credential_name VARCHAR(255) NOT NULL,

    -- 📊 METADATA Y ESTADO
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMPTZ,
    is_valid BOOLEAN DEFAULT true,

    -- ✅ CONSTRAINTS
    CONSTRAINT chk_credential_type_not_empty
        CHECK (LENGTH(TRIM(credential_type)) > 0)
);

-- ====================================================================
-- 📝 COMENTARIOS PARA DOCUMENTACIÓN
-- ====================================================================

-- Tabla chatbot_config
COMMENT ON TABLE chatbot_config IS 'Configuración de chatbots de IA multi-plataforma por organización';
COMMENT ON COLUMN chatbot_config.config_plataforma IS 'Configuración específica de cada plataforma en formato JSON flexible';
COMMENT ON COLUMN chatbot_config.system_prompt IS 'Prompt del sistema personalizado con datos de la organización';
COMMENT ON COLUMN chatbot_config.n8n_workflow_id IS 'ID del workflow en n8n (UUID generado por n8n)';
COMMENT ON COLUMN chatbot_config.n8n_credential_id IS 'ID de la credential en n8n para autenticación con la plataforma';
COMMENT ON COLUMN chatbot_config.mcp_credential_id IS 'ID de la credential httpHeaderAuth en n8n compartida por organización para autenticación del AI Agent con MCP Server';
COMMENT ON COLUMN chatbot_config.mcp_jwt_token IS 'Token JWT único por chatbot para autenticación multi-tenant del MCP Server con el backend';
COMMENT ON COLUMN chatbot_config.total_mensajes_procesados IS 'Contador de mensajes procesados por el chatbot';
COMMENT ON COLUMN chatbot_config.total_citas_creadas IS 'Contador de citas creadas exitosamente vía chatbot';

-- Tabla chatbot_credentials
COMMENT ON TABLE chatbot_credentials IS 'Auditoría de credenciales creadas en n8n para chatbots';
COMMENT ON COLUMN chatbot_credentials.n8n_credential_id IS 'ID de la credential en n8n';
COMMENT ON COLUMN chatbot_credentials.credential_type IS 'Tipo de credential en n8n (telegramApi, httpHeaderAuth, etc)';
COMMENT ON COLUMN chatbot_credentials.is_valid IS 'Indica si la credential sigue siendo válida en n8n';
