-- ====================================================================
-- MODULO WEBSITE: TRADUCCIONES MULTI-IDIOMA
-- Archivo: sql/website/08-traducciones.sql
-- Version: 1.0.0
-- Descripcion: Tablas para soporte multi-idioma del sitio web
-- Fecha creacion: 25 Enero 2026
-- ====================================================================

-- ====================================================================
-- TABLA: website_traducciones
-- ====================================================================
-- Almacena traducciones de contenido para diferentes idiomas.
-- Cada registro es una traduccion de una entidad especifica.

CREATE TABLE IF NOT EXISTS website_traducciones (
    -- Identificador unico
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relacion con website
    website_id UUID NOT NULL REFERENCES website_config(id) ON DELETE CASCADE,

    -- Entidad traducida
    entidad_tipo VARCHAR(20) NOT NULL CHECK (entidad_tipo IN (
        'config',     -- Traducciones de website_config (nombre_sitio, descripcion_seo)
        'pagina',     -- Traducciones de website_paginas (titulo, descripcion_seo)
        'bloque'      -- Traducciones de website_bloques (contenido completo)
    )),
    entidad_id UUID NOT NULL,  -- ID de la entidad (config, pagina o bloque)

    -- Idioma de la traduccion
    idioma VARCHAR(5) NOT NULL,  -- Codigo ISO: es, en, pt, fr, etc.

    -- Contenido traducido (estructura depende de entidad_tipo)
    contenido_traducido JSONB NOT NULL,
    -- Ejemplos:
    -- config: {"nombre_sitio": "My Business", "descripcion_seo": "..."}
    -- pagina: {"titulo": "Services", "descripcion_seo": "..."}
    -- bloque: {contenido completo del bloque traducido}

    -- Estado de la traduccion
    estado VARCHAR(20) DEFAULT 'borrador' CHECK (estado IN (
        'borrador',       -- En proceso de traduccion
        'revision',       -- Pendiente de revision
        'aprobada',       -- Lista para publicar
        'publicada'       -- Activa en el sitio
    )),

    -- Metadata de traduccion
    traducido_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    revisado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    traduccion_automatica BOOLEAN DEFAULT false,  -- true si se uso IA/Google Translate
    porcentaje_completado INTEGER DEFAULT 0 CHECK (porcentaje_completado BETWEEN 0 AND 100),

    -- Timestamps
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- Restriccion: una traduccion por entidad + idioma
    UNIQUE(website_id, entidad_tipo, entidad_id, idioma)
);

-- Comentarios
COMMENT ON TABLE website_traducciones IS 'Traducciones de contenido del sitio web para multi-idioma';
COMMENT ON COLUMN website_traducciones.entidad_tipo IS 'Tipo de entidad: config, pagina o bloque';
COMMENT ON COLUMN website_traducciones.contenido_traducido IS 'Contenido traducido en formato JSON';
COMMENT ON COLUMN website_traducciones.idioma IS 'Codigo de idioma ISO (es, en, pt, fr, etc.)';

-- ====================================================================
-- TABLA: website_idiomas_config
-- ====================================================================
-- Configuracion de idiomas por sitio web.

CREATE TABLE IF NOT EXISTS website_idiomas_config (
    -- Identificador unico
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relacion
    website_id UUID NOT NULL REFERENCES website_config(id) ON DELETE CASCADE,

    -- Configuracion del idioma
    idioma VARCHAR(5) NOT NULL,           -- Codigo ISO
    nombre_nativo VARCHAR(50) NOT NULL,   -- "Espanol", "English", "Portugues"
    nombre_display VARCHAR(50),           -- Nombre a mostrar en selector
    bandera_emoji VARCHAR(10),            -- Emoji de bandera

    -- Estado
    activo BOOLEAN DEFAULT true,
    es_default BOOLEAN DEFAULT false,

    -- Ordenamiento en selector
    orden INTEGER DEFAULT 0,

    -- Timestamps
    creado_en TIMESTAMPTZ DEFAULT NOW(),

    -- Restriccion
    UNIQUE(website_id, idioma)
);

-- Comentarios
COMMENT ON TABLE website_idiomas_config IS 'Configuracion de idiomas disponibles por sitio web';

-- ====================================================================
-- INDICES
-- ====================================================================

-- Traducciones
CREATE INDEX IF NOT EXISTS idx_traducciones_website
    ON website_traducciones(website_id, idioma);

CREATE INDEX IF NOT EXISTS idx_traducciones_entidad
    ON website_traducciones(entidad_tipo, entidad_id, idioma);

CREATE INDEX IF NOT EXISTS idx_traducciones_publicadas
    ON website_traducciones(website_id, idioma, estado)
    WHERE estado = 'publicada';

CREATE INDEX IF NOT EXISTS idx_traducciones_pendientes
    ON website_traducciones(website_id, estado)
    WHERE estado IN ('borrador', 'revision');

-- Idiomas config
CREATE INDEX IF NOT EXISTS idx_idiomas_website
    ON website_idiomas_config(website_id, activo, orden)
    WHERE activo = true;

-- ====================================================================
-- RLS POLICIES
-- ====================================================================

ALTER TABLE website_traducciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_idiomas_config ENABLE ROW LEVEL SECURITY;

-- Traducciones
CREATE POLICY traducciones_org_select ON website_traducciones
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM website_config wc
        WHERE wc.id = website_id
        AND wc.organizacion_id = current_setting('app.current_org_id', true)::int
    ));

CREATE POLICY traducciones_org_insert ON website_traducciones
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM website_config wc
        WHERE wc.id = website_id
        AND wc.organizacion_id = current_setting('app.current_org_id', true)::int
    ));

CREATE POLICY traducciones_org_update ON website_traducciones
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM website_config wc
        WHERE wc.id = website_id
        AND wc.organizacion_id = current_setting('app.current_org_id', true)::int
    ));

CREATE POLICY traducciones_org_delete ON website_traducciones
    FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM website_config wc
        WHERE wc.id = website_id
        AND wc.organizacion_id = current_setting('app.current_org_id', true)::int
    ));

CREATE POLICY traducciones_superadmin ON website_traducciones
    FOR ALL
    USING (current_setting('app.bypass_rls', true) = 'true');

-- Lectura publica de traducciones publicadas
CREATE POLICY traducciones_public_read ON website_traducciones
    FOR SELECT
    USING (
        estado = 'publicada'
        AND EXISTS (
            SELECT 1 FROM website_config wc
            WHERE wc.id = website_id
            AND wc.publicado = true
        )
    );

-- Idiomas config
CREATE POLICY idiomas_org_all ON website_idiomas_config
    FOR ALL
    USING (EXISTS (
        SELECT 1 FROM website_config wc
        WHERE wc.id = website_id
        AND wc.organizacion_id = current_setting('app.current_org_id', true)::int
    ));

CREATE POLICY idiomas_superadmin ON website_idiomas_config
    FOR ALL
    USING (current_setting('app.bypass_rls', true) = 'true');

-- Lectura publica de idiomas activos
CREATE POLICY idiomas_public_read ON website_idiomas_config
    FOR SELECT
    USING (
        activo = true
        AND EXISTS (
            SELECT 1 FROM website_config wc
            WHERE wc.id = website_id
            AND wc.publicado = true
        )
    );

-- ====================================================================
-- FUNCIONES UTILES
-- ====================================================================

-- Funcion para obtener contenido traducido o default
CREATE OR REPLACE FUNCTION website_obtener_contenido_traducido(
    p_entidad_tipo VARCHAR,
    p_entidad_id UUID,
    p_idioma VARCHAR,
    p_contenido_default JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_traduccion JSONB;
BEGIN
    SELECT contenido_traducido INTO v_traduccion
    FROM website_traducciones
    WHERE entidad_tipo = p_entidad_tipo
      AND entidad_id = p_entidad_id
      AND idioma = p_idioma
      AND estado = 'publicada'
    LIMIT 1;

    -- Si hay traduccion, hacer merge con default
    IF v_traduccion IS NOT NULL THEN
        RETURN p_contenido_default || v_traduccion;
    END IF;

    -- Si no hay traduccion, retornar default
    RETURN p_contenido_default;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION website_obtener_contenido_traducido IS 'Obtiene contenido traducido o default si no existe';

-- Funcion para calcular progreso de traduccion
CREATE OR REPLACE FUNCTION website_progreso_traduccion(
    p_website_id UUID,
    p_idioma VARCHAR
)
RETURNS TABLE (
    total_entidades INTEGER,
    traducidas INTEGER,
    porcentaje NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH entidades AS (
        -- Contar config
        SELECT 'config' AS tipo, id FROM website_config WHERE id = p_website_id
        UNION ALL
        -- Contar paginas
        SELECT 'pagina', id FROM website_paginas WHERE website_id = p_website_id
        UNION ALL
        -- Contar bloques
        SELECT 'bloque', wb.id
        FROM website_bloques wb
        JOIN website_paginas wp ON wp.id = wb.pagina_id
        WHERE wp.website_id = p_website_id
    ),
    traducciones AS (
        SELECT entidad_tipo, entidad_id
        FROM website_traducciones
        WHERE website_id = p_website_id
          AND idioma = p_idioma
          AND estado IN ('aprobada', 'publicada')
    )
    SELECT
        (SELECT COUNT(*)::INTEGER FROM entidades),
        (SELECT COUNT(*)::INTEGER FROM traducciones),
        CASE
            WHEN (SELECT COUNT(*) FROM entidades) = 0 THEN 0
            ELSE ROUND(
                (SELECT COUNT(*) FROM traducciones)::NUMERIC /
                (SELECT COUNT(*) FROM entidades)::NUMERIC * 100, 2
            )
        END;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION website_progreso_traduccion IS 'Calcula el porcentaje de traduccion de un sitio para un idioma';

-- ====================================================================
-- VISTAS
-- ====================================================================

-- Vista: Resumen de traducciones por website
CREATE OR REPLACE VIEW vw_website_traducciones_resumen AS
SELECT
    wc.id AS website_id,
    wc.organizacion_id,
    wc.slug,
    wt.idioma,
    COUNT(*) AS total_traducciones,
    COUNT(*) FILTER (WHERE wt.estado = 'publicada') AS publicadas,
    COUNT(*) FILTER (WHERE wt.estado = 'borrador') AS borradores,
    COUNT(*) FILTER (WHERE wt.traduccion_automatica) AS automaticas,
    AVG(wt.porcentaje_completado) AS completado_promedio
FROM website_config wc
LEFT JOIN website_traducciones wt ON wt.website_id = wc.id
WHERE wt.idioma IS NOT NULL
GROUP BY wc.id, wc.organizacion_id, wc.slug, wt.idioma;

COMMENT ON VIEW vw_website_traducciones_resumen IS 'Resumen de traducciones por website e idioma';

-- ====================================================================
-- DATOS INICIALES: Idiomas comunes
-- ====================================================================

-- Nota: Estos se insertan al crear un website con multi-idioma habilitado
-- INSERT INTO website_idiomas_config (website_id, idioma, nombre_nativo, nombre_display, bandera_emoji, es_default, orden)
-- VALUES
--     ($1, 'es', 'Espanol', 'Espanol', '🇪🇸', true, 0),
--     ($1, 'en', 'English', 'English', '🇺🇸', false, 1),
--     ($1, 'pt', 'Portugues', 'Portugues', '🇧🇷', false, 2);

-- ====================================================================
-- GRANTS
-- ====================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON website_traducciones TO saas_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON website_idiomas_config TO saas_app;
GRANT SELECT ON website_traducciones TO readonly_user;
GRANT SELECT ON website_idiomas_config TO readonly_user;
GRANT SELECT ON vw_website_traducciones_resumen TO saas_app, readonly_user;

-- ====================================================================
-- FIN DEL ARCHIVO
-- ====================================================================
