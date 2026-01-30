-- ====================================================================
-- MODULO WEBSITE: CHAT EN TIEMPO REAL
-- Archivo: sql/website/07-chat.sql
-- Version: 1.0.0
-- Descripcion: Tablas para chat en vivo con visitantes del sitio web
-- Fecha creacion: 25 Enero 2026
-- ====================================================================

-- ====================================================================
-- TABLA: website_chat_conversaciones
-- ====================================================================
-- Cada conversacion representa un chat entre un visitante y un agente.

CREATE TABLE IF NOT EXISTS website_chat_conversaciones (
    -- Identificador unico
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relaciones
    website_id UUID NOT NULL REFERENCES website_config(id) ON DELETE CASCADE,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- Visitante (anonimo)
    visitante_id VARCHAR(64) NOT NULL,  -- ID de sesion del visitante
    visitante_nombre VARCHAR(100),       -- Nombre proporcionado (opcional)
    visitante_email VARCHAR(255),        -- Email proporcionado (opcional)
    visitante_telefono VARCHAR(20),      -- Telefono proporcionado (opcional)

    -- Agente asignado
    agente_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    agente_asignado_en TIMESTAMPTZ,

    -- Estado de la conversacion
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN (
        'pendiente',      -- Esperando agente
        'activa',         -- En progreso con agente
        'en_espera',      -- Agente pidio espera
        'resuelta',       -- Cerrada exitosamente
        'abandonada',     -- Visitante se fue
        'transferida'     -- Transferida a otro agente
    )),

    -- Prioridad
    prioridad VARCHAR(10) DEFAULT 'normal' CHECK (prioridad IN (
        'baja', 'normal', 'alta', 'urgente'
    )),

    -- Etiquetas/Tags para clasificacion
    etiquetas TEXT[] DEFAULT '{}',

    -- Contexto del visitante
    pagina_origen VARCHAR(100),          -- Pagina donde inicio el chat
    referrer TEXT,                       -- De donde vino
    dispositivo VARCHAR(20),             -- desktop, tablet, mobile
    navegador VARCHAR(50),
    ip_hash VARCHAR(64),                 -- IP hasheada para privacidad
    pais VARCHAR(2),
    ciudad VARCHAR(100),

    -- Metricas de la conversacion
    tiempo_primera_respuesta_seg INTEGER,  -- Tiempo hasta primer mensaje del agente
    tiempo_resolucion_seg INTEGER,         -- Tiempo total hasta resolver
    mensajes_visitante INTEGER DEFAULT 0,
    mensajes_agente INTEGER DEFAULT 0,

    -- Satisfaccion
    calificacion INTEGER CHECK (calificacion BETWEEN 1 AND 5),
    comentario_calificacion TEXT,

    -- Notas internas
    notas_internas TEXT,

    -- Timestamps
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),
    finalizado_en TIMESTAMPTZ
);

-- Comentarios
COMMENT ON TABLE website_chat_conversaciones IS 'Conversaciones de chat en vivo con visitantes del sitio web';
COMMENT ON COLUMN website_chat_conversaciones.visitante_id IS 'ID de sesion anonimo del visitante';
COMMENT ON COLUMN website_chat_conversaciones.estado IS 'Estado actual de la conversacion';

-- ====================================================================
-- TABLA: website_chat_mensajes
-- ====================================================================
-- Mensajes individuales dentro de cada conversacion.

CREATE TABLE IF NOT EXISTS website_chat_mensajes (
    -- Identificador unico
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relacion
    conversacion_id UUID NOT NULL REFERENCES website_chat_conversaciones(id) ON DELETE CASCADE,

    -- Contenido del mensaje
    contenido TEXT NOT NULL,
    tipo_contenido VARCHAR(20) DEFAULT 'texto' CHECK (tipo_contenido IN (
        'texto',
        'imagen',
        'archivo',
        'sistema',      -- Mensajes automaticos del sistema
        'bot'           -- Respuestas de chatbot
    )),

    -- Quien envio el mensaje
    es_visitante BOOLEAN NOT NULL,
    agente_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,

    -- Archivos adjuntos (si aplica)
    adjunto_url TEXT,
    adjunto_nombre VARCHAR(255),
    adjunto_tipo VARCHAR(100),
    adjunto_tamano INTEGER,

    -- Estado del mensaje
    leido BOOLEAN DEFAULT false,
    leido_en TIMESTAMPTZ,

    -- Timestamp
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Comentarios
COMMENT ON TABLE website_chat_mensajes IS 'Mensajes individuales dentro de conversaciones de chat';
COMMENT ON COLUMN website_chat_mensajes.es_visitante IS 'true si el mensaje es del visitante, false si es del agente';

-- ====================================================================
-- TABLA: website_chat_respuestas_rapidas
-- ====================================================================
-- Respuestas predefinidas para uso rapido por agentes.

CREATE TABLE IF NOT EXISTS website_chat_respuestas_rapidas (
    -- Identificador unico
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relacion
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- Contenido
    titulo VARCHAR(100) NOT NULL,       -- Nombre corto para identificar
    contenido TEXT NOT NULL,            -- Texto de la respuesta
    categoria VARCHAR(50),              -- Categoria para organizar
    atajo VARCHAR(20),                  -- Atajo de teclado (ej: "/saludo")

    -- Ordenamiento
    orden INTEGER DEFAULT 0,

    -- Estado
    activo BOOLEAN DEFAULT true,

    -- Timestamps
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Comentarios
COMMENT ON TABLE website_chat_respuestas_rapidas IS 'Respuestas predefinidas para agentes de chat';

-- ====================================================================
-- INDICES
-- ====================================================================

-- Conversaciones
CREATE INDEX IF NOT EXISTS idx_chat_conv_website
    ON website_chat_conversaciones(website_id, creado_en DESC);

CREATE INDEX IF NOT EXISTS idx_chat_conv_org
    ON website_chat_conversaciones(organizacion_id, creado_en DESC);

CREATE INDEX IF NOT EXISTS idx_chat_conv_agente
    ON website_chat_conversaciones(agente_id, estado, creado_en DESC)
    WHERE agente_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chat_conv_pendientes
    ON website_chat_conversaciones(organizacion_id, creado_en)
    WHERE estado = 'pendiente';

CREATE INDEX IF NOT EXISTS idx_chat_conv_activas
    ON website_chat_conversaciones(organizacion_id, actualizado_en DESC)
    WHERE estado IN ('pendiente', 'activa', 'en_espera');

CREATE INDEX IF NOT EXISTS idx_chat_conv_visitante
    ON website_chat_conversaciones(visitante_id, creado_en DESC);

-- Mensajes
CREATE INDEX IF NOT EXISTS idx_chat_msg_conv
    ON website_chat_mensajes(conversacion_id, creado_en);

CREATE INDEX IF NOT EXISTS idx_chat_msg_no_leidos
    ON website_chat_mensajes(conversacion_id, leido)
    WHERE leido = false;

-- Respuestas rapidas
CREATE INDEX IF NOT EXISTS idx_chat_respuestas_org
    ON website_chat_respuestas_rapidas(organizacion_id, categoria, orden)
    WHERE activo = true;

-- ====================================================================
-- RLS POLICIES
-- ====================================================================

ALTER TABLE website_chat_conversaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_chat_mensajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_chat_respuestas_rapidas ENABLE ROW LEVEL SECURITY;

-- Conversaciones
CREATE POLICY chat_conv_org_select ON website_chat_conversaciones
    FOR SELECT
    USING (organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER);

CREATE POLICY chat_conv_org_insert ON website_chat_conversaciones
    FOR INSERT
    WITH CHECK (true);  -- Insert publico, validado en controller

CREATE POLICY chat_conv_org_update ON website_chat_conversaciones
    FOR UPDATE
    USING (organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER);

CREATE POLICY chat_conv_superadmin ON website_chat_conversaciones
    FOR ALL
    USING (current_setting('app.bypass_rls', true) = 'true');

-- Mensajes (via conversacion)
CREATE POLICY chat_msg_org_select ON website_chat_mensajes
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM website_chat_conversaciones c
        WHERE c.id = conversacion_id
        AND c.organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
    ));

CREATE POLICY chat_msg_insert ON website_chat_mensajes
    FOR INSERT
    WITH CHECK (true);  -- Insert publico, validado en controller

CREATE POLICY chat_msg_superadmin ON website_chat_mensajes
    FOR ALL
    USING (current_setting('app.bypass_rls', true) = 'true');

-- Respuestas rapidas
CREATE POLICY chat_respuestas_org ON website_chat_respuestas_rapidas
    FOR ALL
    USING (organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER);

CREATE POLICY chat_respuestas_superadmin ON website_chat_respuestas_rapidas
    FOR ALL
    USING (current_setting('app.bypass_rls', true) = 'true');

-- ====================================================================
-- FUNCIONES UTILES
-- ====================================================================

-- Funcion para contar conversaciones pendientes
CREATE OR REPLACE FUNCTION website_chat_pendientes(p_organizacion_id INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM website_chat_conversaciones
        WHERE organizacion_id = p_organizacion_id
          AND estado = 'pendiente'
    );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION website_chat_pendientes IS 'Retorna cantidad de chats pendientes de asignar';

-- Funcion para obtener tiempo promedio de respuesta
CREATE OR REPLACE FUNCTION website_chat_tiempo_respuesta_promedio(
    p_organizacion_id INTEGER,
    p_dias INTEGER DEFAULT 30
)
RETURNS NUMERIC AS $$
BEGIN
    RETURN (
        SELECT AVG(tiempo_primera_respuesta_seg)
        FROM website_chat_conversaciones
        WHERE organizacion_id = p_organizacion_id
          AND tiempo_primera_respuesta_seg IS NOT NULL
          AND creado_en >= CURRENT_DATE - (p_dias || ' days')::INTERVAL
    );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION website_chat_tiempo_respuesta_promedio IS 'Tiempo promedio de primera respuesta en segundos';

-- ====================================================================
-- VISTAS
-- ====================================================================

-- Vista: Resumen de conversaciones por agente
CREATE OR REPLACE VIEW vw_website_chat_por_agente AS
SELECT
    c.organizacion_id,
    c.agente_id,
    u.nombre AS agente_nombre,
    COUNT(*) AS total_conversaciones,
    COUNT(*) FILTER (WHERE c.estado = 'resuelta') AS resueltas,
    AVG(c.tiempo_primera_respuesta_seg) AS tiempo_respuesta_promedio,
    AVG(c.calificacion) AS calificacion_promedio
FROM website_chat_conversaciones c
LEFT JOIN usuarios u ON u.id = c.agente_id
WHERE c.creado_en >= CURRENT_DATE - INTERVAL '30 days'
  AND c.agente_id IS NOT NULL
GROUP BY c.organizacion_id, c.agente_id, u.nombre;

COMMENT ON VIEW vw_website_chat_por_agente IS 'Metricas de chat por agente (ultimos 30 dias)';

-- ====================================================================
-- GRANTS
-- ====================================================================

GRANT SELECT, INSERT, UPDATE ON website_chat_conversaciones TO saas_app;
GRANT SELECT, INSERT ON website_chat_mensajes TO saas_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON website_chat_respuestas_rapidas TO saas_app;
GRANT SELECT ON website_chat_conversaciones TO readonly_user;
GRANT SELECT ON website_chat_mensajes TO readonly_user;
GRANT SELECT ON vw_website_chat_por_agente TO saas_app, readonly_user;

-- ====================================================================
-- FIN DEL ARCHIVO
-- ====================================================================
