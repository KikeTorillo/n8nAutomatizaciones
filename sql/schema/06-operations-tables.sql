-- ====================================================================
-- ⚠️  ARCHIVO LEGACY - PARCIALMENTE MIGRADO A ARQUITECTURA MODULAR
-- ====================================================================
--
-- TABLAS DE CITAS MIGRADAS al módulo citas:
-- • sql/citas/01-tablas-citas.sql         (citas + citas_servicios)
-- • sql/citas/02-particionamiento.sql     (Particiones mensuales)
-- • sql/citas/03-indices.sql              (11 índices citas + 3 citas_servicios)
-- • sql/citas/04-rls-policies.sql         (Políticas RLS)
-- • sql/citas/05-funciones.sql            (3 funciones)
-- • sql/citas/06-triggers.sql             (4 triggers)
--
-- TABLAS PENDIENTES DE MIGRACIÓN:
-- • chatbot_config: Configuración de chatbots IA
--
-- 🔄 MIGRACIÓN: 16 Noviembre 2025
-- ✅ ESTADO: Citas completamente migradas, chatbot pendiente
--
-- ⚠️  TODO el código de citas está comentado abajo.
-- ====================================================================

-- ⚠️  MIGRADO A citas/01-06
-- -- ====================================================================
-- -- 📅 TABLA CITAS - SISTEMA COMPLETO DE GESTIÓN DE CITAS (PARTICIONADA)
-- -- ====================================================================
-- -- Tabla central que gestiona todo el ciclo de vida de las citas,
-- -- desde la reserva hasta la finalización, con workflow empresarial.
-- --
-- -- 🔧 CARACTERÍSTICAS EMPRESARIALES:
-- -- • Workflow completo con estados (pendiente → confirmada → completada)
-- -- • Trazabilidad completa y auditoría empresarial
-- -- • Validaciones automáticas de solapamientos y disponibilidad
-- -- • ⚡ PARTICIONAMIENTO POR FECHA (Range Partitioning)
-- --   - Mejora rendimiento en consultas históricas (10x más rápido)
-- --   - Facilita archivado y limpieza de datos antiguos
-- --   - Particiones automáticas mensuales
-- -- ====================================================================
-- 
-- CREATE TABLE citas (
--     -- 🔑 IDENTIFICACIÓN Y RELACIONES PRINCIPALES
--     id SERIAL,
--     organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
--     codigo_cita VARCHAR(50) NOT NULL,
-- 
--     -- 👥 REFERENCIAS PRINCIPALES (VALIDADAS)
--     cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
--     profesional_id INTEGER NOT NULL REFERENCES profesionales(id) ON DELETE RESTRICT,
--     -- ✅ servicio_id ELIMINADO - Ahora se gestiona en tabla citas_servicios (M:N)
-- 
--     -- ⏰ INFORMACIÓN TEMPORAL CRÍTICA
--     fecha_cita DATE NOT NULL,
--     hora_inicio TIME NOT NULL,
--     hora_fin TIME NOT NULL,
--     zona_horaria VARCHAR(50) DEFAULT 'America/Mexico_City', -- Para multi-zona
-- 
--     -- 🔄 WORKFLOW Y ESTADO
--     estado estado_cita DEFAULT 'pendiente',
--     estado_anterior estado_cita, -- Para auditoría de cambios
--     motivo_cancelacion TEXT, -- Obligatorio si estado = 'cancelada'
-- 
--     -- 💰 INFORMACIÓN COMERCIAL (CALCULADOS DESDE citas_servicios)
--     precio_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
--     duracion_total_minutos INTEGER NOT NULL DEFAULT 0,
--     metodo_pago VARCHAR(20), -- 'efectivo', 'tarjeta', 'transferencia'
--     pagado BOOLEAN DEFAULT FALSE,
-- 
--     -- 📝 NOTAS Y COMUNICACIÓN
--     notas_cliente TEXT,
--     notas_profesional TEXT,
--     notas_internas TEXT, -- Para uso interno del negocio
--     origen_cita VARCHAR(50) DEFAULT 'manual', -- 'whatsapp', 'web', 'telefono', 'manual', 'api'
-- 
--     -- ⭐ CALIFICACIÓN Y FEEDBACK
--     calificacion_cliente INTEGER CHECK (calificacion_cliente >= 1 AND calificacion_cliente <= 5),
--     comentario_cliente TEXT,
--     calificacion_profesional INTEGER CHECK (calificacion_profesional >= 1 AND calificacion_profesional <= 5),
--     comentario_profesional TEXT, -- Feedback del profesional sobre el cliente
-- 
--     -- ⏱️ CONTROL DE TIEMPO REAL
--     hora_llegada TIMESTAMPTZ,
--     hora_inicio_real TIMESTAMPTZ,
--     hora_fin_real TIMESTAMPTZ,
--     tiempo_espera_minutos INTEGER GENERATED ALWAYS AS (
--         CASE
--             WHEN hora_llegada IS NOT NULL AND hora_inicio_real IS NOT NULL
--             THEN EXTRACT(EPOCH FROM (hora_inicio_real - hora_llegada))/60
--             ELSE NULL
--         END
--     ) STORED,
-- 
--     -- 🔔 RECORDATORIOS Y NOTIFICACIONES
--     recordatorio_enviado BOOLEAN DEFAULT FALSE,
--     fecha_recordatorio TIMESTAMPTZ,
--     confirmacion_requerida BOOLEAN DEFAULT TRUE,
--     confirmada_por_cliente TIMESTAMPTZ,
-- 
--     -- 📊 CAMPOS DE AUDITORÍA EMPRESARIAL
--     creado_por INTEGER REFERENCES usuarios(id),
--     actualizado_por INTEGER REFERENCES usuarios(id),
--     version INTEGER DEFAULT 1,
--     ip_origen INET,
--     user_agent TEXT,
--     origen_aplicacion VARCHAR(50) DEFAULT 'web',
-- 
--     -- ⏰ TIMESTAMPS ESTÁNDAR
--     creado_en TIMESTAMPTZ DEFAULT NOW(),
--     actualizado_en TIMESTAMPTZ DEFAULT NOW(),
-- 
--     -- ✅ CONSTRAINTS EMPRESARIALES
--     CONSTRAINT valid_horario
--         CHECK (hora_inicio < hora_fin),
--     CONSTRAINT valid_precio_total
--         CHECK (precio_total >= 0),
--     CONSTRAINT valid_duracion_total
--         CHECK (duracion_total_minutos >= 0 AND duracion_total_minutos <= 480),
--     CONSTRAINT valid_fecha_cita
--         CHECK (fecha_cita >= CURRENT_DATE - INTERVAL '1 day'),
--     CONSTRAINT valid_calificaciones
--         CHECK (
--             (calificacion_cliente IS NULL OR (calificacion_cliente >= 1 AND calificacion_cliente <= 5)) AND
--             (calificacion_profesional IS NULL OR (calificacion_profesional >= 1 AND calificacion_profesional <= 5))
--         ),
--     CONSTRAINT valid_tiempo_real
--         CHECK (
--             (hora_inicio_real IS NULL OR hora_fin_real IS NULL OR hora_inicio_real <= hora_fin_real) AND
--             (hora_llegada IS NULL OR hora_inicio_real IS NULL OR hora_llegada <= hora_inicio_real)
--         ),
--     CONSTRAINT valid_estado_pagado
--         CHECK (
--             CASE
--                 WHEN estado = 'completada' AND precio_total > 0 THEN pagado = TRUE
--                 ELSE TRUE
--             END
--         ),
--     CONSTRAINT valid_motivo_cancelacion
--         CHECK (
--             CASE
--                 WHEN estado = 'cancelada' THEN motivo_cancelacion IS NOT NULL
--                 ELSE TRUE
--             END
--         ),
--     CONSTRAINT coherencia_organizacion
--         CHECK (
--             -- Validar que cliente, profesional y servicio pertenezcan a la misma organización
--             TRUE -- Se implementa con trigger por rendimiento
--         ),
-- 
--     -- ⚡ PRIMARY KEY COMPUESTA (incluye fecha_cita para particionamiento)
--     PRIMARY KEY (id, fecha_cita)
-- ) PARTITION BY RANGE (fecha_cita);
-- 
-- -- ====================================================================
-- -- 📅 PARTICIONES INICIALES DE CITAS - ESTRATEGIA MINIMALISTA
-- -- ====================================================================
-- -- Pre-creamos SOLO las particiones necesarias para arrancar el sistema.
-- -- El cron job (pg_cron) creará automáticamente el resto cada mes.
-- --
-- -- 🎯 FILOSOFÍA:
-- -- • Confiamos en la automatización (si falla, queremos saberlo de inmediato)
-- -- • Código limpio sin redundancias
-- -- • Menos metadata en la BD
-- --
-- -- ⚙️ FUNCIONAMIENTO:
-- -- • Día 1 de cada mes a las 00:30: el cron ejecuta mantener_particiones(6, 24)
-- -- • Crea particiones para los próximos 6 meses automáticamente
-- -- • Ejemplo: El 1 de diciembre crea ene-2026, feb-2026, ..., jun-2026
-- --
-- -- 🚨 DETECCIÓN DE FALLOS:
-- -- • Si el cron no funciona, los INSERT a meses futuros fallarán con error claro
-- -- • Solución manual: SELECT * FROM mantener_particiones(6, 24);
-- -- ====================================================================
-- 
-- -- Mes actual (necesario AHORA)
-- CREATE TABLE citas_2025_11 PARTITION OF citas
--     FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
-- 
-- -- Próximo mes (buffer mínimo de seguridad)
-- CREATE TABLE citas_2025_12 PARTITION OF citas
--     FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');
-- 
-- -- ✅ TOTAL: 2 particiones (vs 18 originales)
-- -- ⏰ El cron job se encargará del resto automáticamente
-- 
-- -- ====================================================================
-- -- 📊 ÍNDICES EN PARTICIONES DE CITAS
-- -- ====================================================================
-- -- Los índices se crean a nivel de tabla padre y se propagan automáticamente
-- -- a todas las particiones. PostgreSQL crea índices locales en cada partición.
-- -- ====================================================================
-- 
-- -- ====================================================================
-- -- 📊 ÍNDICES PARA PARTICIONAMIENTO
-- -- ====================================================================
-- -- Los índices en tablas particionadas se crean a nivel padre y se propagan
-- -- automáticamente a las particiones hijas.
-- --
-- -- IMPORTANTE: En PostgreSQL, los índices UNIQUE en tablas particionadas
-- -- DEBEN incluir todas las columnas de la clave de partición.
-- -- Por tanto, NO podemos crear UNIQUE INDEX solo en 'id'.
-- -- Las foreign keys deben referenciar la PRIMARY KEY completa (id, fecha_cita).
-- -- ====================================================================
-- 
-- -- ✅ Índice UNIQUE para codigo_cita (incluye fecha_cita para particionamiento)
-- CREATE UNIQUE INDEX idx_citas_codigo_unico ON citas (codigo_cita, fecha_cita);
-- 
-- -- Índice en organizacion_id + fecha_cita para consultas frecuentes
-- CREATE INDEX idx_citas_org_fecha ON citas (organizacion_id, fecha_cita);
-- 
-- -- Comentarios
-- COMMENT ON TABLE citas IS 'Tabla particionada de citas con range partitioning mensual por fecha_cita';
-- COMMENT ON COLUMN citas.fecha_cita IS 'Fecha de la cita - columna de particionamiento (mensual). IMPORTANTE: Debe incluirse en todas las foreign keys que referencien esta tabla.';
-- 
-- -- ====================================================================
-- -- 🔗 TABLA CITAS_SERVICIOS - RELACIÓN M:N ENTRE CITAS Y SERVICIOS
-- -- ====================================================================
-- -- Tabla intermedia que permite asignar MÚLTIPLES servicios a una cita.
-- -- Reemplaza la relación 1:N anterior (citas.servicio_id).
-- --
-- -- 🔧 CARACTERÍSTICAS:
-- -- • Relación many-to-many entre citas y servicios
-- -- • Orden de ejecución de servicios (orden_ejecucion)
-- -- • Precio y duración snapshot (no afectados por cambios futuros)
-- -- • Descuento individual por servicio
-- -- • RLS habilitado (filtrado por organizacion_id de la cita)
-- -- ====================================================================
-- 
-- CREATE TABLE citas_servicios (
--     -- 🔑 IDENTIFICACIÓN
--     id SERIAL PRIMARY KEY,
-- 
--     -- 🔗 RELACIONES
--     -- IMPORTANTE: Como 'citas' es tabla particionada, debemos referenciar la PRIMARY KEY completa (id, fecha_cita)
--     cita_id INTEGER NOT NULL,
--     fecha_cita DATE NOT NULL,  -- ← Columna adicional requerida para FK a tabla particionada
--     servicio_id INTEGER NOT NULL REFERENCES servicios(id) ON DELETE RESTRICT,
-- 
--     -- Foreign key compuesta que referencia la PRIMARY KEY completa de citas
--     -- ON UPDATE CASCADE: Cuando se reagenda (cambia fecha_cita), se actualiza automáticamente
--     FOREIGN KEY (cita_id, fecha_cita) REFERENCES citas(id, fecha_cita) ON DELETE CASCADE ON UPDATE CASCADE,
-- 
--     -- 📊 METADATA DEL SERVICIO
--     orden_ejecucion INTEGER NOT NULL DEFAULT 1,
-- 
--     -- 💰 INFORMACIÓN COMERCIAL (SNAPSHOT - no cambiar si servicio se actualiza)
--     precio_aplicado DECIMAL(10,2) NOT NULL,
--     duracion_minutos INTEGER NOT NULL,
--     descuento DECIMAL(10,2) DEFAULT 0.00,
-- 
--     -- 📝 NOTAS ESPECÍFICAS DEL SERVICIO EN ESTA CITA
--     notas TEXT,
-- 
--     -- ⏰ TIMESTAMPS
--     creado_en TIMESTAMPTZ DEFAULT NOW(),
--     actualizado_en TIMESTAMPTZ DEFAULT NOW(),
-- 
--     -- ✅ CONSTRAINTS
--     CONSTRAINT uq_cita_servicio_orden
--         UNIQUE (cita_id, fecha_cita, orden_ejecucion),
-- 
--     CONSTRAINT chk_orden_positivo
--         CHECK (orden_ejecucion > 0),
-- 
--     CONSTRAINT chk_precio_positivo
--         CHECK (precio_aplicado >= 0),
-- 
--     CONSTRAINT chk_duracion_positiva
--         CHECK (duracion_minutos > 0 AND duracion_minutos <= 480),
-- 
--     CONSTRAINT chk_descuento_valido
--         CHECK (descuento >= 0 AND descuento <= 100)
-- );
--
-- -- 📝 COMENTARIOS DE DOCUMENTACIÓN
-- COMMENT ON TABLE citas_servicios IS 'Tabla intermedia M:N entre citas y servicios - permite múltiples servicios por cita';
-- COMMENT ON COLUMN citas_servicios.orden_ejecucion IS 'Orden en que se ejecutan los servicios (1, 2, 3...)';
-- COMMENT ON COLUMN citas_servicios.precio_aplicado IS 'Precio del servicio al momento de crear la cita (snapshot)';
-- COMMENT ON COLUMN citas_servicios.duracion_minutos IS 'Duración del servicio al momento de crear la cita (snapshot)';
-- COMMENT ON COLUMN citas_servicios.descuento IS 'Descuento en porcentaje (0-100) aplicado a este servicio';

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

-- ⚠️  MIGRADO A comisiones/01-05
-- -- ====================================================================
-- -- 💵 TABLAS DEL SISTEMA DE COMISIONES
-- -- ====================================================================
-- -- Agregado: 14 Noviembre 2025
-- -- Versión: 1.0.0
-- -- ====================================================================

-- -- ====================================================================
-- -- TABLA 1: configuracion_comisiones
-- -- ====================================================================
-- -- Almacena la configuración de comisiones por profesional y/o servicio.
-- -- ====================================================================

-- -- CREATE TABLE configuracion_comisiones (
-- --     -- Identificadores
-- --     id SERIAL PRIMARY KEY,
-- --     organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
-- --     profesional_id INTEGER NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE,
-- --     servicio_id INTEGER REFERENCES servicios(id) ON DELETE CASCADE,
--
-- --     -- Configuración
-- --     tipo_comision VARCHAR(20) NOT NULL CHECK (tipo_comision IN ('porcentaje', 'monto_fijo')),
-- --     valor_comision DECIMAL(10, 2) NOT NULL CHECK (valor_comision >= 0),
-- --     activo BOOLEAN DEFAULT true,
--
-- --     -- Metadata
-- --     notas TEXT,
-- --     creado_en TIMESTAMPTZ DEFAULT NOW(),
-- --     actualizado_en TIMESTAMPTZ DEFAULT NOW(),
-- --     creado_por INTEGER REFERENCES usuarios(id),
--
-- --     -- Constraints
-- --     UNIQUE(organizacion_id, profesional_id, servicio_id),
-- --     CHECK (
-- --         (tipo_comision = 'porcentaje' AND valor_comision <= 100) OR
-- --         (tipo_comision = 'monto_fijo')
-- --     )
-- -- );
--
-- -- COMMENT ON TABLE configuracion_comisiones IS 'Configuración de esquemas de comisiones por profesional/servicio';
-- -- COMMENT ON COLUMN configuracion_comisiones.servicio_id IS 'NULL = comisión global del profesional. Si especificado = comisión específica del servicio (sobrescribe global)';
-- -- COMMENT ON COLUMN configuracion_comisiones.tipo_comision IS 'porcentaje: % del precio | monto_fijo: cantidad fija por cita';
-- -- COMMENT ON COLUMN configuracion_comisiones.valor_comision IS 'Si tipo=porcentaje: 0-100. Si tipo=monto_fijo: cantidad en moneda';
--
-- -- ====================================================================
-- -- TABLA 2: comisiones_profesionales
-- -- ====================================================================
-- -- Registro histórico de comisiones generadas automáticamente.
-- -- NOTA: FK compuesta a citas(id, fecha_cita) por tabla particionada.
-- -- ====================================================================
--
-- -- CREATE TABLE comisiones_profesionales (
-- --     -- Identificadores
-- --     id SERIAL PRIMARY KEY,
-- --     organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
-- --     profesional_id INTEGER NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE,
--
-- --     -- FK compuesta a tabla particionada citas
-- --     cita_id INTEGER NOT NULL,
-- --     fecha_cita DATE NOT NULL,
-- --     FOREIGN KEY (cita_id, fecha_cita) REFERENCES citas(id, fecha_cita) ON DELETE CASCADE,
--
-- --     -- Cálculo de Comisión
-- --     monto_base DECIMAL(10, 2) NOT NULL CHECK (monto_base >= 0),
-- --     tipo_comision VARCHAR(20) NOT NULL CHECK (tipo_comision IN ('porcentaje', 'monto_fijo', 'mixto')),
-- --     valor_comision DECIMAL(10, 2) NOT NULL,
-- --     monto_comision DECIMAL(10, 2) NOT NULL CHECK (monto_comision >= 0),
--
-- --     -- Detalle de Servicios (JSON array con breakdown)
-- --     detalle_servicios JSONB NOT NULL,
--
-- --     -- Estado de Pago
-- --     estado_pago VARCHAR(20) DEFAULT 'pendiente' CHECK (estado_pago IN ('pendiente', 'pagada', 'cancelada')),
-- --     fecha_pago DATE,
-- --     metodo_pago VARCHAR(50),
-- --     referencia_pago VARCHAR(100),
-- --     notas_pago TEXT,
-- --     pagado_por INTEGER REFERENCES usuarios(id),
--
-- --     -- Metadata
-- --     creado_en TIMESTAMPTZ DEFAULT NOW(),
-- --     actualizado_en TIMESTAMPTZ DEFAULT NOW(),
--
-- --     -- Constraints
-- --     CHECK (
-- --         (estado_pago = 'pagada' AND fecha_pago IS NOT NULL) OR
-- --         (estado_pago != 'pagada' AND fecha_pago IS NULL)
-- --     )
-- -- );
--
-- -- COMMENT ON TABLE comisiones_profesionales IS 'Registro histórico de comisiones generadas automáticamente al completar citas';
-- -- COMMENT ON COLUMN comisiones_profesionales.monto_base IS 'Precio total de la cita (suma de todos los servicios)';
-- -- COMMENT ON COLUMN comisiones_profesionales.tipo_comision IS 'porcentaje | monto_fijo | mixto (cuando hay múltiples servicios con diferentes tipos)';
-- -- COMMENT ON COLUMN comisiones_profesionales.detalle_servicios IS 'JSON con breakdown: [{servicio_id, nombre, precio, comision_calculada}]';
-- -- COMMENT ON COLUMN comisiones_profesionales.estado_pago IS 'pendiente: no pagada | pagada: ya procesada | cancelada: cita cancelada';
--
-- -- ====================================================================
-- -- TABLA 3: historial_configuracion_comisiones
-- -- ====================================================================
-- -- Auditoría de cambios en configuración de comisiones.
-- -- ====================================================================
--
-- -- CREATE TABLE historial_configuracion_comisiones (
-- --     id SERIAL PRIMARY KEY,
-- --     organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
-- --     configuracion_id INTEGER REFERENCES configuracion_comisiones(id) ON DELETE CASCADE,
-- --     profesional_id INTEGER NOT NULL,
-- --     servicio_id INTEGER,
--
-- --     -- Valores anteriores
-- --     tipo_comision_anterior VARCHAR(20),
-- --     valor_comision_anterior DECIMAL(10, 2),
-- --     activo_anterior BOOLEAN,
--
-- --     -- Valores nuevos
-- --     tipo_comision_nuevo VARCHAR(20),
-- --     valor_comision_nuevo DECIMAL(10, 2),
-- --     activo_nuevo BOOLEAN,
--
-- --     -- Metadata
-- --     accion VARCHAR(20) CHECK (accion IN ('INSERT', 'UPDATE', 'DELETE')),
-- --     modificado_por INTEGER REFERENCES usuarios(id),
-- --     modificado_en TIMESTAMPTZ DEFAULT NOW(),
-- --     razon TEXT
-- -- );
--
-- -- COMMENT ON TABLE historial_configuracion_comisiones IS 'Auditoría de cambios en configuración de comisiones';
