-- ====================================================================
-- MODULO WEBSITE: VERSIONES (HISTORIAL/ROLLBACK)
-- Archivo: sql/website/10-versiones.sql
-- Version: 1.0.0
-- Descripcion: Sistema de versionamiento para revertir cambios
-- Fecha creacion: 25 Enero 2026
-- ====================================================================

-- ====================================================================
-- TABLA: website_versiones
-- ====================================================================
-- Almacena snapshots completos del sitio web para permitir rollback.
-- Cada version contiene config + paginas + bloques en formato JSONB.

CREATE TABLE IF NOT EXISTS website_versiones (
    -- Identificador unico
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relaciones
    website_id UUID NOT NULL REFERENCES website_config(id) ON DELETE CASCADE,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- Metadata de la version
    numero_version INTEGER NOT NULL,
    nombre VARCHAR(100),
    descripcion TEXT,

    -- Snapshot completo del sitio
    snapshot JSONB NOT NULL,
    -- Estructura del snapshot:
    -- {
    --   "config": { ... campos de website_config ... },
    --   "paginas": [
    --     {
    --       "id": "...",
    --       "titulo": "...",
    --       "slug": "...",
    --       ...
    --       "bloques": [ { ... }, { ... } ]
    --     }
    --   ]
    -- }

    -- Tamaño del snapshot en bytes (para monitoreo)
    tamano_bytes INTEGER,

    -- Usuario que creo la version
    creado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,

    -- Tipo de version
    tipo VARCHAR(20) DEFAULT 'manual' CHECK (tipo IN (
        'manual',           -- Creada manualmente por usuario
        'auto_publicar',    -- Creada automaticamente al publicar
        'auto_backup'       -- Creada por backup programado
    )),

    -- Timestamps
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Comentarios
COMMENT ON TABLE website_versiones IS 'Snapshots del sitio web para historial y rollback';
COMMENT ON COLUMN website_versiones.snapshot IS 'Snapshot JSONB completo del sitio (config + paginas + bloques)';
COMMENT ON COLUMN website_versiones.tipo IS 'manual=usuario, auto_publicar=al publicar, auto_backup=programado';

-- ====================================================================
-- INDICES
-- ====================================================================

-- Indice para listar versiones de un website
CREATE INDEX IF NOT EXISTS idx_website_versiones_website
    ON website_versiones(website_id, creado_en DESC);

-- Indice para listar por organizacion
CREATE INDEX IF NOT EXISTS idx_website_versiones_org
    ON website_versiones(organizacion_id, creado_en DESC);

-- Indice para buscar por numero de version
CREATE INDEX IF NOT EXISTS idx_website_versiones_numero
    ON website_versiones(website_id, numero_version DESC);

-- ====================================================================
-- RLS POLICIES
-- ====================================================================

ALTER TABLE website_versiones ENABLE ROW LEVEL SECURITY;

-- Politica: Organizacion puede ver sus versiones
CREATE POLICY website_versiones_org_select ON website_versiones
    FOR SELECT
    USING (organizacion_id = current_setting('app.current_org_id', true)::int);

-- Politica: Organizacion puede crear versiones
CREATE POLICY website_versiones_org_insert ON website_versiones
    FOR INSERT
    WITH CHECK (organizacion_id = current_setting('app.current_org_id', true)::int);

-- Politica: Organizacion puede eliminar sus versiones
CREATE POLICY website_versiones_org_delete ON website_versiones
    FOR DELETE
    USING (organizacion_id = current_setting('app.current_org_id', true)::int);

-- Politica: SuperAdmin puede ver todo
CREATE POLICY website_versiones_superadmin ON website_versiones
    FOR ALL
    USING (current_setting('app.bypass_rls', true) = 'true');

-- ====================================================================
-- FUNCION: website_crear_version
-- ====================================================================
-- Crea un snapshot completo del sitio web actual.
--
-- Parametros:
--   p_website_id: UUID del sitio web
--   p_nombre: Nombre opcional de la version
--   p_descripcion: Descripcion opcional
--   p_tipo: Tipo de version (manual, auto_publicar, auto_backup)
--   p_usuario_id: ID del usuario que crea (opcional)
--
-- Retorna: La version creada

CREATE OR REPLACE FUNCTION website_crear_version(
    p_website_id UUID,
    p_nombre VARCHAR(100) DEFAULT NULL,
    p_descripcion TEXT DEFAULT NULL,
    p_tipo VARCHAR(20) DEFAULT 'manual',
    p_usuario_id INTEGER DEFAULT NULL
)
RETURNS website_versiones AS $$
DECLARE
    v_organizacion_id INTEGER;
    v_numero_version INTEGER;
    v_snapshot JSONB;
    v_config JSONB;
    v_paginas JSONB;
    v_version website_versiones;
    v_tamano INTEGER;
BEGIN
    -- Obtener organizacion_id del website
    SELECT organizacion_id INTO v_organizacion_id
    FROM website_config
    WHERE id = p_website_id;

    IF v_organizacion_id IS NULL THEN
        RAISE EXCEPTION 'Website no encontrado: %', p_website_id;
    END IF;

    -- Obtener siguiente numero de version
    SELECT COALESCE(MAX(numero_version), 0) + 1 INTO v_numero_version
    FROM website_versiones
    WHERE website_id = p_website_id;

    -- Capturar config del sitio
    SELECT to_jsonb(wc.*) - 'organizacion_id' INTO v_config
    FROM website_config wc
    WHERE wc.id = p_website_id;

    -- Capturar paginas con sus bloques
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', wp.id,
            'slug', wp.slug,
            'titulo', wp.titulo,
            'descripcion_seo', wp.descripcion_seo,
            'orden', wp.orden,
            'visible_menu', wp.visible_menu,
            'icono', wp.icono,
            'publicada', wp.publicada,
            'bloques', COALESCE((
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', wb.id,
                        'tipo', wb.tipo,
                        'contenido', wb.contenido,
                        'estilos', wb.estilos,
                        'orden', wb.orden,
                        'visible', wb.visible
                    ) ORDER BY wb.orden
                )
                FROM website_bloques wb
                WHERE wb.pagina_id = wp.id
            ), '[]'::jsonb)
        ) ORDER BY wp.orden
    ), '[]'::jsonb) INTO v_paginas
    FROM website_paginas wp
    WHERE wp.website_id = p_website_id;

    -- Construir snapshot completo
    v_snapshot := jsonb_build_object(
        'config', v_config,
        'paginas', v_paginas,
        'metadata', jsonb_build_object(
            'version_schema', 1,
            'creado_en', NOW(),
            'total_paginas', jsonb_array_length(v_paginas),
            'total_bloques', (
                SELECT COUNT(*)
                FROM website_bloques wb
                JOIN website_paginas wp ON wp.id = wb.pagina_id
                WHERE wp.website_id = p_website_id
            )
        )
    );

    -- Calcular tamaño aproximado
    v_tamano := octet_length(v_snapshot::text);

    -- Insertar version
    INSERT INTO website_versiones (
        website_id,
        organizacion_id,
        numero_version,
        nombre,
        descripcion,
        snapshot,
        tamano_bytes,
        creado_por,
        tipo
    ) VALUES (
        p_website_id,
        v_organizacion_id,
        v_numero_version,
        COALESCE(p_nombre, 'Versión ' || v_numero_version),
        p_descripcion,
        v_snapshot,
        v_tamano,
        p_usuario_id,
        p_tipo
    )
    RETURNING * INTO v_version;

    -- Auto-limpieza: mantener solo las ultimas 10 versiones manuales
    -- Las versiones auto se limpian segun su propio criterio
    IF p_tipo = 'manual' THEN
        DELETE FROM website_versiones
        WHERE website_id = p_website_id
          AND tipo = 'manual'
          AND id NOT IN (
              SELECT id FROM website_versiones
              WHERE website_id = p_website_id
                AND tipo = 'manual'
              ORDER BY creado_en DESC
              LIMIT 10
          );
    END IF;

    -- Auto-limpieza de versiones auto_publicar (mantener ultimas 5)
    IF p_tipo = 'auto_publicar' THEN
        DELETE FROM website_versiones
        WHERE website_id = p_website_id
          AND tipo = 'auto_publicar'
          AND id NOT IN (
              SELECT id FROM website_versiones
              WHERE website_id = p_website_id
                AND tipo = 'auto_publicar'
              ORDER BY creado_en DESC
              LIMIT 5
          );
    END IF;

    RETURN v_version;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION website_crear_version IS 'Crea un snapshot completo del sitio web para historial/rollback';

-- ====================================================================
-- FUNCION: website_restaurar_version
-- ====================================================================
-- Restaura el sitio web a una version anterior.
-- CUIDADO: Esta operacion es destructiva y reemplaza el contenido actual.

CREATE OR REPLACE FUNCTION website_restaurar_version(
    p_version_id UUID,
    p_crear_backup BOOLEAN DEFAULT TRUE
)
RETURNS BOOLEAN AS $$
DECLARE
    v_version website_versiones;
    v_website_id UUID;
    v_organizacion_id INTEGER;
    v_config JSONB;
    v_paginas JSONB;
    v_pagina JSONB;
    v_bloque JSONB;
    v_pagina_id UUID;
BEGIN
    -- Obtener la version a restaurar
    SELECT * INTO v_version
    FROM website_versiones
    WHERE id = p_version_id;

    IF v_version IS NULL THEN
        RAISE EXCEPTION 'Version no encontrada: %', p_version_id;
    END IF;

    v_website_id := v_version.website_id;
    v_organizacion_id := v_version.organizacion_id;
    v_config := v_version.snapshot->'config';
    v_paginas := v_version.snapshot->'paginas';

    -- Crear backup del estado actual antes de restaurar
    IF p_crear_backup THEN
        PERFORM website_crear_version(
            v_website_id,
            'Backup antes de restaurar a v' || v_version.numero_version,
            'Backup automatico creado antes de restaurar version',
            'auto_backup'
        );
    END IF;

    -- Eliminar todos los bloques actuales
    DELETE FROM website_bloques
    WHERE pagina_id IN (
        SELECT id FROM website_paginas WHERE website_id = v_website_id
    );

    -- Eliminar todas las paginas actuales
    DELETE FROM website_paginas WHERE website_id = v_website_id;

    -- Actualizar configuracion del sitio
    UPDATE website_config SET
        slug = v_config->>'slug',
        nombre_sitio = v_config->>'nombre_sitio',
        descripcion_seo = v_config->>'descripcion_seo',
        keywords_seo = v_config->>'keywords_seo',
        favicon_url = v_config->>'favicon_url',
        logo_url = v_config->>'logo_url',
        logo_alt = v_config->>'logo_alt',
        color_primario = v_config->>'color_primario',
        color_secundario = v_config->>'color_secundario',
        color_acento = v_config->>'color_acento',
        color_texto = v_config->>'color_texto',
        color_fondo = v_config->>'color_fondo',
        fuente_titulos = v_config->>'fuente_titulos',
        fuente_cuerpo = v_config->>'fuente_cuerpo',
        redes_sociales = (v_config->'redes_sociales'),
        actualizado_en = NOW()
    WHERE id = v_website_id;

    -- Restaurar paginas y bloques
    FOR v_pagina IN SELECT * FROM jsonb_array_elements(v_paginas)
    LOOP
        -- Crear pagina
        INSERT INTO website_paginas (
            id,
            website_id,
            organizacion_id,
            slug,
            titulo,
            descripcion_seo,
            orden,
            visible_menu,
            icono,
            publicada
        ) VALUES (
            COALESCE((v_pagina->>'id')::uuid, gen_random_uuid()),
            v_website_id,
            v_organizacion_id,
            v_pagina->>'slug',
            v_pagina->>'titulo',
            v_pagina->>'descripcion_seo',
            COALESCE((v_pagina->>'orden')::int, 0),
            COALESCE((v_pagina->>'visible_menu')::boolean, true),
            v_pagina->>'icono',
            COALESCE((v_pagina->>'publicada')::boolean, true)
        )
        RETURNING id INTO v_pagina_id;

        -- Restaurar bloques de la pagina
        FOR v_bloque IN SELECT * FROM jsonb_array_elements(v_pagina->'bloques')
        LOOP
            INSERT INTO website_bloques (
                pagina_id,
                tipo,
                contenido,
                estilos,
                orden,
                visible
            ) VALUES (
                v_pagina_id,
                v_bloque->>'tipo',
                (v_bloque->'contenido'),
                (v_bloque->'estilos'),
                COALESCE((v_bloque->>'orden')::int, 0),
                COALESCE((v_bloque->>'visible')::boolean, true)
            );
        END LOOP;
    END LOOP;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION website_restaurar_version IS 'Restaura el sitio web a una version anterior (operacion destructiva)';

-- ====================================================================
-- GRANTS
-- ====================================================================

GRANT SELECT, INSERT, DELETE ON website_versiones TO saas_app;
GRANT SELECT ON website_versiones TO readonly_user;

-- ====================================================================
-- FIN DEL ARCHIVO
-- ====================================================================
