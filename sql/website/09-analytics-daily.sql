-- ====================================================================
-- MODULO WEBSITE: ANALYTICS DIARIO (AGREGACION)
-- Archivo: sql/website/09-analytics-daily.sql
-- Version: 1.0.0
-- Descripcion: Tabla de metricas pre-agregadas para performance
-- Fecha creacion: 25 Enero 2026
-- ====================================================================

-- ====================================================================
-- TABLA: website_analytics_daily
-- ====================================================================
-- Metricas pre-agregadas por dia para evitar queries pesados.
-- La funcion website_analytics_agregar_dia() se ejecuta via pg_cron.

CREATE TABLE IF NOT EXISTS website_analytics_daily (
    -- Identificador unico
    id SERIAL PRIMARY KEY,

    -- Relaciones
    website_id UUID NOT NULL REFERENCES website_config(id) ON DELETE CASCADE,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- Fecha de agregacion
    fecha DATE NOT NULL,

    -- Metricas de trafico
    visitas_pagina INTEGER DEFAULT 0,
    sesiones_unicas INTEGER DEFAULT 0,
    visitantes_unicos INTEGER DEFAULT 0,

    -- Metricas de engagement
    clics_cta INTEGER DEFAULT 0,
    formularios_enviados INTEGER DEFAULT 0,
    clics_telefono INTEGER DEFAULT 0,
    clics_email INTEGER DEFAULT 0,
    clics_whatsapp INTEGER DEFAULT 0,
    clics_redes INTEGER DEFAULT 0,

    -- Metricas de contenido
    scroll_50 INTEGER DEFAULT 0,
    scroll_100 INTEGER DEFAULT 0,
    video_plays INTEGER DEFAULT 0,
    video_completos INTEGER DEFAULT 0,
    descargas INTEGER DEFAULT 0,

    -- Desglose por dispositivo
    visitas_desktop INTEGER DEFAULT 0,
    visitas_tablet INTEGER DEFAULT 0,
    visitas_mobile INTEGER DEFAULT 0,

    -- Tiempo promedio en pagina (segundos)
    tiempo_promedio_segundos NUMERIC(10,2) DEFAULT 0,

    -- Top 5 paginas mas visitadas (JSONB)
    top_paginas JSONB DEFAULT '[]',

    -- Top 5 fuentes de trafico (JSONB)
    top_fuentes JSONB DEFAULT '[]',

    -- Timestamps
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- Constraint unico: un registro por website por dia
    CONSTRAINT uk_website_analytics_daily_fecha UNIQUE(website_id, fecha)
);

-- Comentarios
COMMENT ON TABLE website_analytics_daily IS 'Metricas de analytics pre-agregadas por dia para performance';
COMMENT ON COLUMN website_analytics_daily.fecha IS 'Fecha del dia agregado';
COMMENT ON COLUMN website_analytics_daily.top_paginas IS 'Array de {slug, visitas} ordenado por visitas';
COMMENT ON COLUMN website_analytics_daily.top_fuentes IS 'Array de {fuente, visitas} ordenado por visitas';

-- ====================================================================
-- INDICES
-- ====================================================================

-- Indice para queries por website y rango de fechas
CREATE INDEX IF NOT EXISTS idx_website_analytics_daily_website_fecha
    ON website_analytics_daily(website_id, fecha DESC);

-- Indice para queries por organizacion
CREATE INDEX IF NOT EXISTS idx_website_analytics_daily_org_fecha
    ON website_analytics_daily(organizacion_id, fecha DESC);

-- ====================================================================
-- RLS POLICIES
-- ====================================================================

ALTER TABLE website_analytics_daily ENABLE ROW LEVEL SECURITY;

-- Politica: Organizacion puede ver sus metricas
CREATE POLICY website_analytics_daily_org_select ON website_analytics_daily
    FOR SELECT
    USING (organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER);

-- Politica: Solo insercion via funcion (bypass RLS)
CREATE POLICY website_analytics_daily_insert ON website_analytics_daily
    FOR INSERT
    WITH CHECK (current_setting('app.bypass_rls', true) = 'true');

-- Politica: SuperAdmin puede ver todo
CREATE POLICY website_analytics_daily_superadmin ON website_analytics_daily
    FOR ALL
    USING (current_setting('app.bypass_rls', true) = 'true');

-- ====================================================================
-- FUNCION: website_analytics_agregar_dia
-- ====================================================================
-- Agrega metricas de un dia especifico en website_analytics_daily.
-- Diseñada para ejecutarse via pg_cron a las 00:30 cada dia.
--
-- Uso manual:
--   SELECT website_analytics_agregar_dia(CURRENT_DATE - 1);
--
-- Configuracion pg_cron (ejecutar una vez):
--   SELECT cron.schedule('agregar_website_analytics', '30 0 * * *',
--     $$SELECT website_analytics_agregar_dia(CURRENT_DATE - 1)$$);

CREATE OR REPLACE FUNCTION website_analytics_agregar_dia(fecha_agregar DATE)
RETURNS INTEGER AS $$
DECLARE
    websites_procesados INTEGER := 0;
    rec RECORD;
BEGIN
    -- Iterar por cada website que tuvo actividad ese dia
    FOR rec IN
        SELECT DISTINCT website_id, organizacion_id
        FROM website_analytics
        WHERE DATE(creado_en) = fecha_agregar
    LOOP
        -- Insertar o actualizar metricas agregadas
        INSERT INTO website_analytics_daily (
            website_id,
            organizacion_id,
            fecha,
            visitas_pagina,
            sesiones_unicas,
            visitantes_unicos,
            clics_cta,
            formularios_enviados,
            clics_telefono,
            clics_email,
            clics_whatsapp,
            clics_redes,
            scroll_50,
            scroll_100,
            video_plays,
            video_completos,
            descargas,
            visitas_desktop,
            visitas_tablet,
            visitas_mobile,
            tiempo_promedio_segundos,
            top_paginas,
            top_fuentes
        )
        SELECT
            wa.website_id,
            wa.organizacion_id,
            fecha_agregar,
            -- Metricas de trafico
            COUNT(*) FILTER (WHERE evento_tipo = 'vista_pagina'),
            COUNT(DISTINCT session_id),
            COUNT(DISTINCT ip_hash),
            -- Metricas de engagement
            COUNT(*) FILTER (WHERE evento_tipo = 'clic_cta'),
            COUNT(*) FILTER (WHERE evento_tipo = 'formulario_enviado'),
            COUNT(*) FILTER (WHERE evento_tipo = 'clic_telefono'),
            COUNT(*) FILTER (WHERE evento_tipo = 'clic_email'),
            COUNT(*) FILTER (WHERE evento_tipo = 'clic_whatsapp'),
            COUNT(*) FILTER (WHERE evento_tipo = 'clic_redes'),
            -- Metricas de contenido
            COUNT(*) FILTER (WHERE evento_tipo = 'scroll_50'),
            COUNT(*) FILTER (WHERE evento_tipo = 'scroll_100'),
            COUNT(*) FILTER (WHERE evento_tipo = 'video_play'),
            COUNT(*) FILTER (WHERE evento_tipo = 'video_complete'),
            COUNT(*) FILTER (WHERE evento_tipo = 'descarga'),
            -- Desglose por dispositivo
            COUNT(*) FILTER (WHERE evento_tipo = 'vista_pagina' AND dispositivo = 'desktop'),
            COUNT(*) FILTER (WHERE evento_tipo = 'vista_pagina' AND dispositivo = 'tablet'),
            COUNT(*) FILTER (WHERE evento_tipo = 'vista_pagina' AND dispositivo = 'mobile'),
            -- Tiempo promedio
            COALESCE(AVG((datos_evento->>'segundos')::numeric) FILTER (WHERE evento_tipo = 'tiempo_en_pagina'), 0),
            -- Top paginas (subquery)
            (
                SELECT COALESCE(jsonb_agg(top ORDER BY top.visitas DESC), '[]'::jsonb)
                FROM (
                    SELECT pagina_slug as slug, COUNT(*) as visitas
                    FROM website_analytics
                    WHERE website_id = wa.website_id
                      AND DATE(creado_en) = fecha_agregar
                      AND evento_tipo = 'vista_pagina'
                      AND pagina_slug IS NOT NULL
                    GROUP BY pagina_slug
                    ORDER BY visitas DESC
                    LIMIT 5
                ) top
            ),
            -- Top fuentes (subquery)
            (
                SELECT COALESCE(jsonb_agg(top ORDER BY top.visitas DESC), '[]'::jsonb)
                FROM (
                    SELECT COALESCE(fuente, 'directo') as fuente, COUNT(*) as visitas
                    FROM website_analytics
                    WHERE website_id = wa.website_id
                      AND DATE(creado_en) = fecha_agregar
                      AND evento_tipo = 'vista_pagina'
                    GROUP BY fuente
                    ORDER BY visitas DESC
                    LIMIT 5
                ) top
            )
        FROM website_analytics wa
        WHERE wa.website_id = rec.website_id
          AND DATE(wa.creado_en) = fecha_agregar
        GROUP BY wa.website_id, wa.organizacion_id
        ON CONFLICT (website_id, fecha)
        DO UPDATE SET
            visitas_pagina = EXCLUDED.visitas_pagina,
            sesiones_unicas = EXCLUDED.sesiones_unicas,
            visitantes_unicos = EXCLUDED.visitantes_unicos,
            clics_cta = EXCLUDED.clics_cta,
            formularios_enviados = EXCLUDED.formularios_enviados,
            clics_telefono = EXCLUDED.clics_telefono,
            clics_email = EXCLUDED.clics_email,
            clics_whatsapp = EXCLUDED.clics_whatsapp,
            clics_redes = EXCLUDED.clics_redes,
            scroll_50 = EXCLUDED.scroll_50,
            scroll_100 = EXCLUDED.scroll_100,
            video_plays = EXCLUDED.video_plays,
            video_completos = EXCLUDED.video_completos,
            descargas = EXCLUDED.descargas,
            visitas_desktop = EXCLUDED.visitas_desktop,
            visitas_tablet = EXCLUDED.visitas_tablet,
            visitas_mobile = EXCLUDED.visitas_mobile,
            tiempo_promedio_segundos = EXCLUDED.tiempo_promedio_segundos,
            top_paginas = EXCLUDED.top_paginas,
            top_fuentes = EXCLUDED.top_fuentes,
            actualizado_en = NOW();

        websites_procesados := websites_procesados + 1;
    END LOOP;

    RETURN websites_procesados;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION website_analytics_agregar_dia IS 'Agrega metricas de analytics de un dia especifico. Ejecutar via pg_cron.';

-- ====================================================================
-- VISTA: Resumen de analytics por periodo
-- ====================================================================

CREATE OR REPLACE VIEW vw_website_analytics_resumen AS
SELECT
    organizacion_id,
    website_id,
    -- Ultimos 7 dias
    SUM(visitas_pagina) FILTER (WHERE fecha >= CURRENT_DATE - 7) AS visitas_7d,
    SUM(sesiones_unicas) FILTER (WHERE fecha >= CURRENT_DATE - 7) AS sesiones_7d,
    SUM(clics_cta) FILTER (WHERE fecha >= CURRENT_DATE - 7) AS ctas_7d,
    SUM(formularios_enviados) FILTER (WHERE fecha >= CURRENT_DATE - 7) AS formularios_7d,
    -- Ultimos 30 dias
    SUM(visitas_pagina) FILTER (WHERE fecha >= CURRENT_DATE - 30) AS visitas_30d,
    SUM(sesiones_unicas) FILTER (WHERE fecha >= CURRENT_DATE - 30) AS sesiones_30d,
    SUM(clics_cta) FILTER (WHERE fecha >= CURRENT_DATE - 30) AS ctas_30d,
    SUM(formularios_enviados) FILTER (WHERE fecha >= CURRENT_DATE - 30) AS formularios_30d,
    -- Total historico
    SUM(visitas_pagina) AS visitas_total,
    SUM(sesiones_unicas) AS sesiones_total,
    SUM(formularios_enviados) AS formularios_total
FROM website_analytics_daily
GROUP BY organizacion_id, website_id;

COMMENT ON VIEW vw_website_analytics_resumen IS 'Resumen de metricas agregadas por periodos (7d, 30d, total)';

-- ====================================================================
-- GRANTS
-- ====================================================================

GRANT SELECT ON website_analytics_daily TO saas_app;
GRANT INSERT, UPDATE ON website_analytics_daily TO saas_app;
GRANT USAGE, SELECT ON SEQUENCE website_analytics_daily_id_seq TO saas_app;
GRANT SELECT ON website_analytics_daily TO readonly_user;
GRANT SELECT ON vw_website_analytics_resumen TO saas_app, readonly_user;

-- ====================================================================
-- FIN DEL ARCHIVO
-- ====================================================================
