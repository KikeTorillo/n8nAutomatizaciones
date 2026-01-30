-- ====================================================================
-- MODULO WEBSITE: ANALYTICS Y ESTADISTICAS
-- Archivo: sql/website/06-analytics.sql
-- Version: 1.0.0
-- Descripcion: Tabla para tracking de eventos y metricas del sitio web
-- Fecha creacion: 25 Enero 2026
-- ====================================================================

-- ====================================================================
-- TABLA: website_analytics
-- ====================================================================
-- Registra eventos del sitio publico: vistas de pagina, clicks en CTA,
-- formularios enviados, etc. La IP se hashea para privacidad.

CREATE TABLE IF NOT EXISTS website_analytics (
    -- Identificador unico
    id SERIAL PRIMARY KEY,

    -- Relaciones
    website_id UUID NOT NULL REFERENCES website_config(id) ON DELETE CASCADE,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- Tipo de evento
    evento_tipo VARCHAR(30) NOT NULL CHECK (evento_tipo IN (
        'vista_pagina',
        'clic_cta',
        'formulario_enviado',
        'scroll_50',
        'scroll_100',
        'tiempo_en_pagina',
        'clic_telefono',
        'clic_email',
        'clic_whatsapp',
        'clic_redes',
        'descarga',
        'video_play',
        'video_complete'
    )),

    -- Contexto del evento
    pagina_slug VARCHAR(100),
    bloque_id UUID,
    bloque_tipo VARCHAR(50),

    -- Origen del trafico
    fuente VARCHAR(100),           -- utm_source o referrer simplificado
    medio VARCHAR(50),             -- utm_medium (organic, cpc, social, etc.)
    campana VARCHAR(100),          -- utm_campaign
    referrer TEXT,                 -- URL completa del referrer

    -- Dispositivo
    dispositivo VARCHAR(20) CHECK (dispositivo IN ('desktop', 'tablet', 'mobile')),
    navegador VARCHAR(50),
    sistema_operativo VARCHAR(50),
    resolucion VARCHAR(20),        -- "1920x1080"

    -- Privacidad (IP hasheada)
    ip_hash VARCHAR(64),           -- SHA-256 de la IP
    session_id VARCHAR(64),        -- ID de sesion anonimo

    -- Datos adicionales del evento
    datos_evento JSONB DEFAULT '{}',
    -- Ejemplos:
    -- vista_pagina: {"tiempo_carga_ms": 1200}
    -- clic_cta: {"texto_boton": "Agendar", "destino": "#contacto"}
    -- formulario_enviado: {"tipo_formulario": "contacto"}
    -- tiempo_en_pagina: {"segundos": 45}
    -- video_play: {"video_url": "...", "posicion": 0}

    -- Geolocalizacion aproximada (opcional, basada en IP)
    pais VARCHAR(2),               -- Codigo ISO pais
    ciudad VARCHAR(100),

    -- Timestamp
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Comentarios
COMMENT ON TABLE website_analytics IS 'Eventos y metricas del sitio web publico para analytics';
COMMENT ON COLUMN website_analytics.evento_tipo IS 'Tipo de evento trackeado';
COMMENT ON COLUMN website_analytics.ip_hash IS 'Hash SHA-256 de la IP para privacidad';
COMMENT ON COLUMN website_analytics.session_id IS 'ID de sesion anonimo para agrupar eventos';

-- ====================================================================
-- INDICES
-- ====================================================================

-- Indice para consultas por website y fecha (dashboard)
CREATE INDEX IF NOT EXISTS idx_website_analytics_website_fecha
    ON website_analytics(website_id, creado_en DESC);

-- Indice para consultas por organizacion
CREATE INDEX IF NOT EXISTS idx_website_analytics_org
    ON website_analytics(organizacion_id, creado_en DESC);

-- Indice para filtrar por tipo de evento
CREATE INDEX IF NOT EXISTS idx_website_analytics_tipo
    ON website_analytics(website_id, evento_tipo, creado_en DESC);

-- Indice para metricas de paginas especificas
CREATE INDEX IF NOT EXISTS idx_website_analytics_pagina
    ON website_analytics(website_id, pagina_slug, creado_en DESC)
    WHERE pagina_slug IS NOT NULL;

-- Indice para agrupar por sesion
CREATE INDEX IF NOT EXISTS idx_website_analytics_session
    ON website_analytics(session_id, creado_en)
    WHERE session_id IS NOT NULL;

-- Indice para analisis por dispositivo
CREATE INDEX IF NOT EXISTS idx_website_analytics_dispositivo
    ON website_analytics(website_id, dispositivo, creado_en DESC)
    WHERE dispositivo IS NOT NULL;

-- ====================================================================
-- RLS POLICIES
-- ====================================================================

ALTER TABLE website_analytics ENABLE ROW LEVEL SECURITY;

-- Politica: Organizacion puede ver sus analytics
CREATE POLICY website_analytics_org_select ON website_analytics
    FOR SELECT
    USING (organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER);

-- Politica: Insercion publica (para tracking desde sitio publico)
-- Nota: Los inserts se hacen con bypass de RLS desde el controller publico
CREATE POLICY website_analytics_public_insert ON website_analytics
    FOR INSERT
    WITH CHECK (true);

-- Politica: SuperAdmin puede ver todo
CREATE POLICY website_analytics_superadmin ON website_analytics
    FOR ALL
    USING (current_setting('app.bypass_rls', true) = 'true');

-- ====================================================================
-- VISTAS UTILES
-- ====================================================================

-- Vista: Resumen diario de visitas
CREATE OR REPLACE VIEW vw_website_analytics_diario AS
SELECT
    organizacion_id,
    website_id,
    DATE(creado_en) AS fecha,
    COUNT(*) FILTER (WHERE evento_tipo = 'vista_pagina') AS vistas_pagina,
    COUNT(DISTINCT session_id) AS sesiones_unicas,
    COUNT(*) FILTER (WHERE evento_tipo = 'clic_cta') AS clics_cta,
    COUNT(*) FILTER (WHERE evento_tipo = 'formulario_enviado') AS formularios,
    COUNT(*) FILTER (WHERE evento_tipo = 'clic_telefono') AS clics_telefono,
    COUNT(*) FILTER (WHERE evento_tipo = 'clic_whatsapp') AS clics_whatsapp
FROM website_analytics
WHERE creado_en >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY organizacion_id, website_id, DATE(creado_en);

COMMENT ON VIEW vw_website_analytics_diario IS 'Resumen diario de metricas por website (ultimos 90 dias)';

-- Vista: Paginas mas visitadas
CREATE OR REPLACE VIEW vw_website_paginas_populares AS
SELECT
    organizacion_id,
    website_id,
    pagina_slug,
    COUNT(*) AS total_vistas,
    COUNT(DISTINCT session_id) AS visitantes_unicos,
    AVG((datos_evento->>'tiempo_carga_ms')::int) AS tiempo_carga_promedio
FROM website_analytics
WHERE evento_tipo = 'vista_pagina'
  AND creado_en >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY organizacion_id, website_id, pagina_slug
ORDER BY total_vistas DESC;

COMMENT ON VIEW vw_website_paginas_populares IS 'Paginas mas visitadas por website (ultimos 30 dias)';

-- ====================================================================
-- FUNCION: Limpiar analytics antiguos (ejecutar periodicamente)
-- ====================================================================

CREATE OR REPLACE FUNCTION website_analytics_limpiar_antiguos(dias_retener INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
    filas_eliminadas INTEGER;
BEGIN
    DELETE FROM website_analytics
    WHERE creado_en < CURRENT_DATE - (dias_retener || ' days')::INTERVAL;

    GET DIAGNOSTICS filas_eliminadas = ROW_COUNT;
    RETURN filas_eliminadas;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION website_analytics_limpiar_antiguos IS 'Elimina registros de analytics mas antiguos que los dias especificados';

-- ====================================================================
-- GRANTS
-- ====================================================================

GRANT SELECT, INSERT ON website_analytics TO saas_app;
GRANT USAGE, SELECT ON SEQUENCE website_analytics_id_seq TO saas_app;
GRANT SELECT ON website_analytics TO readonly_user;
GRANT SELECT ON vw_website_analytics_diario TO saas_app, readonly_user;
GRANT SELECT ON vw_website_paginas_populares TO saas_app, readonly_user;

-- ====================================================================
-- INDICES ADICIONALES PARA PERFORMANCE
-- ====================================================================

-- Indice compuesto para queries de dashboard (sitio + fecha + tipo)
CREATE INDEX IF NOT EXISTS idx_website_analytics_sitio_fecha_tipo
    ON website_analytics(website_id, creado_en DESC, evento_tipo);

-- ====================================================================
-- FIN DEL ARCHIVO
-- ====================================================================
