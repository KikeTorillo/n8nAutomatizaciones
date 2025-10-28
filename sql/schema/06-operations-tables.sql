-- ====================================================================
-- 🎯 TABLAS OPERACIONALES DEL SISTEMA
-- ====================================================================
--
-- Este archivo contiene las tablas que manejan las operaciones diarias
-- del negocio: citas.
--
-- 📊 CONTENIDO:
-- • citas: Sistema completo de gestión de citas con workflow empresarial
--
-- 🔄 ORDEN DE EJECUCIÓN: #6 (Después de business tables)
-- 🔒 SEGURIDAD: RLS habilitado, validaciones avanzadas
-- ⚡ PERFORMANCE: Índices especializados
-- ====================================================================

-- ====================================================================
-- 📅 TABLA CITAS - SISTEMA COMPLETO DE GESTIÓN DE CITAS
-- ====================================================================
-- Tabla central que gestiona todo el ciclo de vida de las citas,
-- desde la reserva hasta la finalización, con workflow empresarial.
--
-- 🔧 CARACTERÍSTICAS EMPRESARIALES:
-- • Workflow completo con estados (pendiente → confirmada → completada)
-- • Trazabilidad completa y auditoría empresarial
-- • Validaciones automáticas de solapamientos y disponibilidad
-- ====================================================================

CREATE TABLE citas (
    -- 🔑 IDENTIFICACIÓN Y RELACIONES PRINCIPALES
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    codigo_cita VARCHAR(50) UNIQUE NOT NULL,

    -- 👥 REFERENCIAS PRINCIPALES (VALIDADAS)
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
    profesional_id INTEGER NOT NULL REFERENCES profesionales(id) ON DELETE RESTRICT,
    -- ✅ servicio_id ELIMINADO - Ahora se gestiona en tabla citas_servicios (M:N)

    -- ⏰ INFORMACIÓN TEMPORAL CRÍTICA
    fecha_cita DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    zona_horaria VARCHAR(50) DEFAULT 'America/Mexico_City', -- Para multi-zona

    -- 🔄 WORKFLOW Y ESTADO
    estado estado_cita DEFAULT 'pendiente',
    estado_anterior estado_cita, -- Para auditoría de cambios
    motivo_cancelacion TEXT, -- Obligatorio si estado = 'cancelada'

    -- 💰 INFORMACIÓN COMERCIAL (CALCULADOS DESDE citas_servicios)
    precio_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    duracion_total_minutos INTEGER NOT NULL DEFAULT 0,
    metodo_pago VARCHAR(20), -- 'efectivo', 'tarjeta', 'transferencia'
    pagado BOOLEAN DEFAULT FALSE,

    -- 📝 NOTAS Y COMUNICACIÓN
    notas_cliente TEXT,
    notas_profesional TEXT,
    notas_internas TEXT, -- Para uso interno del negocio
    origen_cita VARCHAR(50) DEFAULT 'manual', -- 'whatsapp', 'web', 'telefono', 'manual', 'api'

    -- ⭐ CALIFICACIÓN Y FEEDBACK
    calificacion_cliente INTEGER CHECK (calificacion_cliente >= 1 AND calificacion_cliente <= 5),
    comentario_cliente TEXT,
    calificacion_profesional INTEGER CHECK (calificacion_profesional >= 1 AND calificacion_profesional <= 5),
    comentario_profesional TEXT, -- Feedback del profesional sobre el cliente

    -- ⏱️ CONTROL DE TIEMPO REAL
    hora_llegada TIMESTAMPTZ,
    hora_inicio_real TIMESTAMPTZ,
    hora_fin_real TIMESTAMPTZ,
    tiempo_espera_minutos INTEGER GENERATED ALWAYS AS (
        CASE
            WHEN hora_llegada IS NOT NULL AND hora_inicio_real IS NOT NULL
            THEN EXTRACT(EPOCH FROM (hora_inicio_real - hora_llegada))/60
            ELSE NULL
        END
    ) STORED,

    -- 🔔 RECORDATORIOS Y NOTIFICACIONES
    recordatorio_enviado BOOLEAN DEFAULT FALSE,
    fecha_recordatorio TIMESTAMPTZ,
    confirmacion_requerida BOOLEAN DEFAULT TRUE,
    confirmada_por_cliente TIMESTAMPTZ,

    -- 📊 CAMPOS DE AUDITORÍA EMPRESARIAL
    creado_por INTEGER REFERENCES usuarios(id),
    actualizado_por INTEGER REFERENCES usuarios(id),
    version INTEGER DEFAULT 1,
    ip_origen INET,
    user_agent TEXT,
    origen_aplicacion VARCHAR(50) DEFAULT 'web',

    -- ⏰ TIMESTAMPS ESTÁNDAR
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ CONSTRAINTS EMPRESARIALES
    CONSTRAINT valid_horario
        CHECK (hora_inicio < hora_fin),
    CONSTRAINT valid_precio_total
        CHECK (precio_total >= 0),
    CONSTRAINT valid_duracion_total
        CHECK (duracion_total_minutos >= 0 AND duracion_total_minutos <= 480),
    CONSTRAINT valid_fecha_cita
        CHECK (fecha_cita >= CURRENT_DATE - INTERVAL '1 day'),
    CONSTRAINT valid_calificaciones
        CHECK (
            (calificacion_cliente IS NULL OR (calificacion_cliente >= 1 AND calificacion_cliente <= 5)) AND
            (calificacion_profesional IS NULL OR (calificacion_profesional >= 1 AND calificacion_profesional <= 5))
        ),
    CONSTRAINT valid_tiempo_real
        CHECK (
            (hora_inicio_real IS NULL OR hora_fin_real IS NULL OR hora_inicio_real <= hora_fin_real) AND
            (hora_llegada IS NULL OR hora_inicio_real IS NULL OR hora_llegada <= hora_inicio_real)
        ),
    CONSTRAINT valid_estado_pagado
        CHECK (
            CASE
                WHEN estado = 'completada' AND precio_total > 0 THEN pagado = TRUE
                ELSE TRUE
            END
        ),
    CONSTRAINT valid_motivo_cancelacion
        CHECK (
            CASE
                WHEN estado = 'cancelada' THEN motivo_cancelacion IS NOT NULL
                ELSE TRUE
            END
        ),
    CONSTRAINT coherencia_organizacion
        CHECK (
            -- Validar que cliente, profesional y servicio pertenezcan a la misma organización
            TRUE -- Se implementa con trigger por rendimiento
        )
);

-- ====================================================================
-- 🔗 TABLA CITAS_SERVICIOS - RELACIÓN M:N ENTRE CITAS Y SERVICIOS
-- ====================================================================
-- Tabla intermedia que permite asignar MÚLTIPLES servicios a una cita.
-- Reemplaza la relación 1:N anterior (citas.servicio_id).
--
-- 🔧 CARACTERÍSTICAS:
-- • Relación many-to-many entre citas y servicios
-- • Orden de ejecución de servicios (orden_ejecucion)
-- • Precio y duración snapshot (no afectados por cambios futuros)
-- • Descuento individual por servicio
-- • RLS habilitado (filtrado por organizacion_id de la cita)
-- ====================================================================

CREATE TABLE citas_servicios (
    -- 🔑 IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,

    -- 🔗 RELACIONES (CASCADE para eliminar servicios al borrar cita)
    cita_id INTEGER NOT NULL REFERENCES citas(id) ON DELETE CASCADE,
    servicio_id INTEGER NOT NULL REFERENCES servicios(id) ON DELETE RESTRICT,

    -- 📊 METADATA DEL SERVICIO
    orden_ejecucion INTEGER NOT NULL DEFAULT 1,

    -- 💰 INFORMACIÓN COMERCIAL (SNAPSHOT - no cambiar si servicio se actualiza)
    precio_aplicado DECIMAL(10,2) NOT NULL,
    duracion_minutos INTEGER NOT NULL,
    descuento DECIMAL(10,2) DEFAULT 0.00,

    -- 📝 NOTAS ESPECÍFICAS DEL SERVICIO EN ESTA CITA
    notas TEXT,

    -- ⏰ TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ CONSTRAINTS
    CONSTRAINT uq_cita_servicio_orden
        UNIQUE (cita_id, orden_ejecucion),

    CONSTRAINT chk_orden_positivo
        CHECK (orden_ejecucion > 0),

    CONSTRAINT chk_precio_positivo
        CHECK (precio_aplicado >= 0),

    CONSTRAINT chk_duracion_positiva
        CHECK (duracion_minutos > 0 AND duracion_minutos <= 480),

    CONSTRAINT chk_descuento_valido
        CHECK (descuento >= 0 AND descuento <= 100)
);

-- 📝 COMENTARIOS DE DOCUMENTACIÓN
COMMENT ON TABLE citas_servicios IS 'Tabla intermedia M:N entre citas y servicios - permite múltiples servicios por cita';
COMMENT ON COLUMN citas_servicios.orden_ejecucion IS 'Orden en que se ejecutan los servicios (1, 2, 3...)';
COMMENT ON COLUMN citas_servicios.precio_aplicado IS 'Precio del servicio al momento de crear la cita (snapshot)';
COMMENT ON COLUMN citas_servicios.duracion_minutos IS 'Duración del servicio al momento de crear la cita (snapshot)';
COMMENT ON COLUMN citas_servicios.descuento IS 'Descuento en porcentaje (0-100) aplicado a este servicio';

-- ====================================================================
-- 🤖 TABLA CHATBOT_CONFIG - CONFIGURACIÓN DE CHATBOTS IA
-- ====================================================================
-- Tabla que gestiona la configuración de chatbots de IA multi-plataforma
-- por organización. Cada organización puede tener múltiples chatbots
-- (uno por cada plataforma).
--
-- 🔧 CARACTERÍSTICAS PRINCIPALES:
-- • Agnóstico de plataforma (Telegram, WhatsApp, Instagram, etc.)
-- • Configuración JSON flexible por plataforma
-- • Integración con n8n workflows
-- • Métricas de uso y monitoreo
-- • System prompts personalizables
-- ====================================================================

CREATE TABLE chatbot_config (
    -- 🔑 IDENTIFICACIÓN Y RELACIONES
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

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
    workflow_activo BOOLEAN DEFAULT false,

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

    -- 🔄 ESTADO Y MÉTRICAS
    estado estado_chatbot DEFAULT 'configurando',
    activo BOOLEAN DEFAULT true,
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
    CONSTRAINT uq_chatbot_org_plataforma
        UNIQUE (organizacion_id, plataforma),

    CONSTRAINT chk_nombre_not_empty
        CHECK (LENGTH(TRIM(nombre)) > 0),

    CONSTRAINT chk_system_prompt_length
        CHECK (system_prompt IS NULL OR LENGTH(system_prompt) >= 100)
);

-- 📝 COMENTARIOS DE DOCUMENTACIÓN
COMMENT ON TABLE chatbot_config IS 'Configuración de chatbots de IA multi-plataforma por organización';
COMMENT ON COLUMN chatbot_config.config_plataforma IS 'Configuración específica de cada plataforma en formato JSON flexible';
COMMENT ON COLUMN chatbot_config.system_prompt IS 'Prompt del sistema personalizado con datos de la organización';
COMMENT ON COLUMN chatbot_config.n8n_workflow_id IS 'ID del workflow en n8n (UUID generado por n8n)';
COMMENT ON COLUMN chatbot_config.n8n_credential_id IS 'ID de la credential en n8n para autenticación con la plataforma';
COMMENT ON COLUMN chatbot_config.mcp_credential_id IS 'ID de la credential httpHeaderAuth en n8n compartida por organización para autenticación del AI Agent con MCP Server';
COMMENT ON COLUMN chatbot_config.mcp_jwt_token IS 'Token JWT único por chatbot para autenticación multi-tenant del MCP Server con el backend';
COMMENT ON COLUMN chatbot_config.total_mensajes_procesados IS 'Contador de mensajes procesados por el chatbot';
COMMENT ON COLUMN chatbot_config.total_citas_creadas IS 'Contador de citas creadas exitosamente vía chatbot';

-- ====================================================================
-- 🔐 TABLA CHATBOT_CREDENTIALS - AUDITORÍA DE CREDENTIALS N8N
-- ====================================================================
-- Tabla OPCIONAL para auditoría de credentials creadas en n8n.
-- Permite rastrear qué credentials están asociadas a qué chatbots
-- y validar su estado.
-- ====================================================================

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

-- 📝 COMENTARIOS DE DOCUMENTACIÓN
COMMENT ON TABLE chatbot_credentials IS 'Auditoría de credenciales creadas en n8n para chatbots';
COMMENT ON COLUMN chatbot_credentials.n8n_credential_id IS 'ID de la credential en n8n';
COMMENT ON COLUMN chatbot_credentials.credential_type IS 'Tipo de credential en n8n (telegramApi, httpHeaderAuth, etc)';
COMMENT ON COLUMN chatbot_credentials.is_valid IS 'Indica si la credential sigue siendo válida en n8n';
