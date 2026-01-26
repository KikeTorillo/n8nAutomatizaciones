-- ====================================================================
-- MODULO WEBSITE: PREVIEW/STAGING
-- Archivo: sql/website/11-preview.sql
-- Version: 1.0.0
-- Descripcion: Sistema de preview temporal para sitios no publicados
-- Fecha creacion: 26 Enero 2026
-- ====================================================================

-- ====================================================================
-- AGREGAR COLUMNAS A WEBSITE_CONFIG
-- ====================================================================

-- Token para acceder al preview sin autenticacion
ALTER TABLE website_config
ADD COLUMN IF NOT EXISTS preview_token UUID DEFAULT NULL;

-- Fecha de expiracion del token (1 hora por defecto)
ALTER TABLE website_config
ADD COLUMN IF NOT EXISTS preview_expira_en TIMESTAMPTZ DEFAULT NULL;

-- Comentarios
COMMENT ON COLUMN website_config.preview_token IS 'Token temporal para acceder al preview sin autenticacion';
COMMENT ON COLUMN website_config.preview_expira_en IS 'Fecha/hora de expiracion del token de preview';

-- Indice para buscar por token
CREATE INDEX IF NOT EXISTS idx_website_config_preview_token
    ON website_config(preview_token)
    WHERE preview_token IS NOT NULL;

-- ====================================================================
-- FUNCION: website_generar_preview_token
-- ====================================================================
-- Genera un nuevo token de preview con expiracion configurable.
--
-- Parametros:
--   p_website_id: UUID del sitio web
--   p_duracion_horas: Duracion en horas del token (default 1)
--
-- Retorna: El token generado

CREATE OR REPLACE FUNCTION website_generar_preview_token(
    p_website_id UUID,
    p_duracion_horas INTEGER DEFAULT 1
)
RETURNS UUID AS $$
DECLARE
    v_token UUID;
BEGIN
    -- Generar nuevo token
    v_token := gen_random_uuid();

    -- Actualizar website_config
    UPDATE website_config
    SET preview_token = v_token,
        preview_expira_en = NOW() + (p_duracion_horas || ' hours')::interval,
        actualizado_en = NOW()
    WHERE id = p_website_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Website no encontrado: %', p_website_id;
    END IF;

    RETURN v_token;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION website_generar_preview_token IS 'Genera token temporal para preview del sitio';

-- ====================================================================
-- FUNCION: website_validar_preview_token
-- ====================================================================
-- Valida un token de preview y retorna el website_id si es valido.
--
-- Parametros:
--   p_token: Token a validar
--
-- Retorna: website_id si valido, NULL si no

CREATE OR REPLACE FUNCTION website_validar_preview_token(
    p_token UUID
)
RETURNS UUID AS $$
DECLARE
    v_website_id UUID;
BEGIN
    SELECT id INTO v_website_id
    FROM website_config
    WHERE preview_token = p_token
      AND preview_expira_en > NOW();

    RETURN v_website_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION website_validar_preview_token IS 'Valida token de preview y retorna website_id';

-- ====================================================================
-- FUNCION: website_revocar_preview_token
-- ====================================================================
-- Revoca el token de preview de un sitio.
--
-- Parametros:
--   p_website_id: UUID del sitio web

CREATE OR REPLACE FUNCTION website_revocar_preview_token(
    p_website_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE website_config
    SET preview_token = NULL,
        preview_expira_en = NULL,
        actualizado_en = NOW()
    WHERE id = p_website_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION website_revocar_preview_token IS 'Revoca el token de preview de un sitio';

-- ====================================================================
-- GRANTS
-- ====================================================================

GRANT EXECUTE ON FUNCTION website_generar_preview_token TO saas_app;
GRANT EXECUTE ON FUNCTION website_validar_preview_token TO saas_app;
GRANT EXECUTE ON FUNCTION website_revocar_preview_token TO saas_app;

-- ====================================================================
-- FIN DEL ARCHIVO
-- ====================================================================
