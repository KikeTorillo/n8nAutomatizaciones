-- ====================================================================
-- 🔔 MÓDULO RECORDATORIOS - TABLAS
-- ====================================================================
--
-- Versión: 1.0.0
-- Fecha: 25 Noviembre 2025
-- Módulo: recordatorios
--
-- DESCRIPCIÓN:
-- Sistema de recordatorios automáticos para citas con inyección en
-- memoria del chat para que el chatbot IA tenga contexto cuando
-- el cliente responda.
--
-- TABLAS (2):
-- • configuracion_recordatorios: Config por organización
-- • historial_recordatorios: Registro de envíos
--
-- CARACTERÍSTICAS PRINCIPALES:
-- • Múltiples recordatorios: 24h antes, 2h antes (configurable)
-- • Plantillas personalizables con variables {{cliente_nombre}}, etc.
-- • Ventana horaria: No enviar de noche
-- • Reintentos automáticos en caso de fallo
-- • Inyección en memoria del chat para contexto IA
-- • Requiere chatbot activo para funcionar
--
-- REQUISITO CRÍTICO:
-- La organización DEBE tener chatbot configurado y activo.
-- Sin chatbot = Sin recordatorios (no hay canal de envío)
--
-- ====================================================================

-- ====================================================================
-- TABLA 1: configuracion_recordatorios
-- ====================================================================
-- Almacena la configuración de recordatorios por organización.
-- Una organización = Una configuración (1:1)
--
-- TIEMPOS DE RECORDATORIO:
-- • recordatorio_1: Principal (default 24h antes)
-- • recordatorio_2: Secundario (default 2h antes, opcional)
--
-- PLANTILLA CON VARIABLES:
-- {{cliente_nombre}}, {{negocio_nombre}}, {{fecha}}, {{hora}},
-- {{servicios}}, {{precio}}, {{profesional_nombre}}
-- ====================================================================

CREATE TABLE IF NOT EXISTS configuracion_recordatorios (
    -- IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    sucursal_id INTEGER,  -- NULL = config global, con valor = config de sucursal

    -- ACTIVACIÓN GLOBAL
    habilitado BOOLEAN DEFAULT TRUE,

    -- RECORDATORIO 1 (Principal - 24h antes por defecto)
    recordatorio_1_horas INTEGER DEFAULT 24 CHECK (recordatorio_1_horas >= 1 AND recordatorio_1_horas <= 168),
    recordatorio_1_activo BOOLEAN DEFAULT TRUE,

    -- RECORDATORIO 2 (Secundario - 2h antes por defecto, opcional)
    recordatorio_2_horas INTEGER DEFAULT 2 CHECK (recordatorio_2_horas >= 1 AND recordatorio_2_horas <= 24),
    recordatorio_2_activo BOOLEAN DEFAULT FALSE,

    -- PLANTILLA PERSONALIZABLE
    -- Variables: {{cliente_nombre}}, {{negocio_nombre}}, {{fecha}}, {{hora}},
    --            {{servicios}}, {{precio}}, {{profesional_nombre}}
    plantilla_mensaje TEXT DEFAULT 'Hola {{cliente_nombre}}!

Te recordamos tu cita en {{negocio_nombre}}:
📅 {{fecha}} a las {{hora}}
✂️ Servicios: {{servicios}}
👤 Con: {{profesional_nombre}}
💰 Total: ${{precio}}

Responde SI para confirmar o escríbeme si necesitas cambiar algo.',

    -- VENTANA HORARIA (no enviar de noche)
    hora_inicio TIME DEFAULT '08:00',
    hora_fin TIME DEFAULT '21:00',

    -- REINTENTOS
    max_reintentos INTEGER DEFAULT 3 CHECK (max_reintentos >= 1 AND max_reintentos <= 5),

    -- CONFIGURACIÓN AVANZADA (JSONB para extensibilidad)
    config_avanzada JSONB DEFAULT '{}',
    -- Ejemplos:
    -- { "enviar_confirmacion_automatica": true }
    -- { "incluir_ubicacion": true, "incluir_notas": false }

    -- TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- CONSTRAINTS
    CONSTRAINT uk_config_recordatorios_org UNIQUE(organizacion_id),
    CONSTRAINT chk_recordatorio_1_mayor_2 CHECK (recordatorio_1_horas > recordatorio_2_horas)
);

-- Comentarios descriptivos
COMMENT ON TABLE configuracion_recordatorios IS 'Configuración de recordatorios automáticos por organización';
COMMENT ON COLUMN configuracion_recordatorios.recordatorio_1_horas IS 'Horas antes de la cita para enviar recordatorio principal (1-168)';
COMMENT ON COLUMN configuracion_recordatorios.recordatorio_2_horas IS 'Horas antes de la cita para enviar recordatorio secundario (1-24)';
COMMENT ON COLUMN configuracion_recordatorios.plantilla_mensaje IS 'Plantilla con variables: {{cliente_nombre}}, {{negocio_nombre}}, {{fecha}}, {{hora}}, {{servicios}}, {{precio}}, {{profesional_nombre}}';
COMMENT ON COLUMN configuracion_recordatorios.hora_inicio IS 'Hora mínima para enviar recordatorios (respetar horario del cliente)';
COMMENT ON COLUMN configuracion_recordatorios.hora_fin IS 'Hora máxima para enviar recordatorios';

-- ====================================================================
-- TABLA 2: historial_recordatorios
-- ====================================================================
-- Registro completo de todos los recordatorios enviados.
-- Permite auditoría, reintentos y seguimiento de confirmaciones.
--
-- ESTADOS:
-- • pendiente: Programado, aún no enviado
-- • enviado: Enviado exitosamente al cliente
-- • fallido: Error al enviar (se puede reintentar)
-- • confirmado: Cliente respondió confirmando
-- • reagendado: Cliente solicitó cambio de horario
-- • cancelado: Cita cancelada antes del envío
--
-- FLUJO TÍPICO:
-- 1. Job crea registro con estado 'pendiente'
-- 2. Servicio intenta enviar → 'enviado' o 'fallido'
-- 3. Cliente responde → Chatbot actualiza a 'confirmado' o 'reagendado'
-- ====================================================================

CREATE TABLE IF NOT EXISTS historial_recordatorios (
    -- IDENTIFICACIÓN
    id BIGSERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    cita_id INTEGER NOT NULL,  -- Sin FK para permitir citas en particiones

    -- TIPO DE RECORDATORIO
    numero_recordatorio INTEGER NOT NULL DEFAULT 1 CHECK (numero_recordatorio IN (1, 2)),
    -- 1 = Recordatorio principal (24h)
    -- 2 = Recordatorio secundario (2h)

    -- CANAL Y DESTINO
    canal VARCHAR(20) NOT NULL CHECK (canal IN ('telegram', 'whatsapp', 'whatsapp_oficial')),
    sender VARCHAR(100) NOT NULL,  -- chat_id (Telegram) o teléfono (WhatsApp)

    -- CONTENIDO
    mensaje_enviado TEXT NOT NULL,

    -- ESTADO Y SEGUIMIENTO
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'enviado', 'fallido', 'confirmado', 'reagendado', 'cancelado')),

    -- ERROR Y REINTENTOS
    error_mensaje TEXT,
    intento_numero INTEGER DEFAULT 1 CHECK (intento_numero >= 1 AND intento_numero <= 5),

    -- RESPUESTA DEL CLIENTE
    respuesta_cliente TEXT,
    fecha_respuesta TIMESTAMPTZ,

    -- TIMESTAMPS
    programado_para TIMESTAMPTZ NOT NULL,
    enviado_en TIMESTAMPTZ,
    creado_en TIMESTAMPTZ DEFAULT NOW(),

    -- METADATA ADICIONAL (para debugging)
    metadata JSONB DEFAULT '{}'
    -- Ejemplos:
    -- { "api_response_id": "xxx", "delivery_status": "delivered" }
    -- { "error_code": "RATE_LIMITED", "retry_after": 60 }
);

-- Comentarios descriptivos
COMMENT ON TABLE historial_recordatorios IS 'Historial completo de recordatorios enviados con estado y respuestas';
COMMENT ON COLUMN historial_recordatorios.numero_recordatorio IS '1 = principal (24h), 2 = secundario (2h)';
COMMENT ON COLUMN historial_recordatorios.sender IS 'ID del destinatario: chat_id para Telegram, teléfono para WhatsApp';
COMMENT ON COLUMN historial_recordatorios.estado IS 'pendiente → enviado/fallido → confirmado/reagendado/cancelado';
COMMENT ON COLUMN historial_recordatorios.programado_para IS 'Fecha/hora programada para el envío';
COMMENT ON COLUMN historial_recordatorios.enviado_en IS 'Fecha/hora real del envío (NULL si no enviado)';

-- ====================================================================
-- TRIGGER: Actualizar timestamp
-- ====================================================================

CREATE OR REPLACE FUNCTION actualizar_timestamp_recordatorios()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actualizar_timestamp_config_recordatorios
    BEFORE UPDATE ON configuracion_recordatorios
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp_recordatorios();

-- ====================================================================
-- FUNCIÓN: Crear configuración por defecto al crear organización
-- ====================================================================
-- Se ejecuta automáticamente cuando se crea una nueva organización
-- para que tenga configuración de recordatorios lista para usar.
-- ====================================================================

CREATE OR REPLACE FUNCTION crear_config_recordatorios_default()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO configuracion_recordatorios (organizacion_id)
    VALUES (NEW.id)
    ON CONFLICT (organizacion_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para crear config automáticamente
-- NOTA: Solo crear si no existe otro trigger similar
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'trg_crear_config_recordatorios_org'
    ) THEN
        CREATE TRIGGER trg_crear_config_recordatorios_org
            AFTER INSERT ON organizaciones
            FOR EACH ROW
            EXECUTE FUNCTION crear_config_recordatorios_default();
    END IF;
END $$;

-- ====================================================================
-- DATOS INICIALES: Config para organizaciones existentes
-- ====================================================================

INSERT INTO configuracion_recordatorios (organizacion_id)
SELECT id FROM organizaciones
WHERE id NOT IN (SELECT organizacion_id FROM configuracion_recordatorios)
ON CONFLICT (organizacion_id) DO NOTHING;
