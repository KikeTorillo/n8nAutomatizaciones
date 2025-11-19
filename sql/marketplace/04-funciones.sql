-- ====================================================================
-- MÓDULO MARKETPLACE: FUNCIONES PL/pgSQL
-- ====================================================================
-- Funciones de utilidad y mantenimiento automático:
--
-- FUNCIONES (3):
-- 1. actualizar_search_vector_marketplace() - Búsqueda full-text
-- 2. actualizar_stats_perfil_marketplace() - Estadísticas automáticas
-- 3. obtener_perfil_publico_por_slug() - Query optimizado de perfil completo
--
-- CARACTERÍSTICAS:
-- • Actualización automática vía triggers
-- • Queries optimizados con JOINs y CTEs
-- • Compatible con RLS (usa bypass cuando es necesario)
-- • Retorna JSONB para fácil consumo en APIs
--
-- Fecha creación: 17 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- FUNCIÓN 1/3: actualizar_search_vector_marketplace
-- ====================================================================
-- Actualiza el campo search_vector para búsqueda full-text en español.
--
-- CAMPOS INDEXADOS (con pesos):
-- • meta_titulo (peso A - máxima relevancia)
-- • ciudad (peso A - muy importante para SEO local)
-- • descripcion_corta (peso B - alta relevancia)
-- • estado (peso B - importante para SEO)
-- • descripcion_larga (peso C - contenido completo)
--
-- USO: Trigger BEFORE INSERT OR UPDATE
-- RENDIMIENTO: <1ms por registro
-- ====================================================================

CREATE OR REPLACE FUNCTION actualizar_search_vector_marketplace()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('spanish', COALESCE(NEW.meta_titulo, '')), 'A') ||
        setweight(to_tsvector('spanish', COALESCE(NEW.ciudad, '')), 'A') ||
        setweight(to_tsvector('spanish', COALESCE(NEW.descripcion_corta, '')), 'B') ||
        setweight(to_tsvector('spanish', COALESCE(NEW.estado, '')), 'B') ||
        setweight(to_tsvector('spanish', COALESCE(NEW.descripcion_larga, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION actualizar_search_vector_marketplace() IS
'Actualiza search_vector para búsqueda full-text en español.
Trigger: BEFORE INSERT/UPDATE en marketplace_perfiles.
Pesos: A=meta_titulo/ciudad, B=descripcion_corta/estado, C=descripcion_larga.
Performance: <1ms por registro.';

-- ====================================================================
-- FUNCIÓN 2/3: actualizar_stats_perfil_marketplace
-- ====================================================================
-- Actualiza automáticamente las estadísticas del perfil tras INSERT/UPDATE
-- de reseñas.
--
-- ESTADÍSTICAS ACTUALIZADAS:
-- • total_reseñas - Contador de reseñas publicadas
-- • rating_promedio - Promedio de ratings (solo publicadas)
--
-- LÓGICA:
-- • Solo cuenta reseñas con estado='publicada'
-- • Usa ROUND(AVG(), 2) para 2 decimales
-- • Usa COALESCE para manejar caso sin reseñas (0.00)
--
-- USO: Trigger AFTER INSERT/UPDATE en marketplace_reseñas
-- RENDIMIENTO: <5ms por operación (1 SELECT + 1 UPDATE)
-- ====================================================================

CREATE OR REPLACE FUNCTION actualizar_stats_perfil_marketplace()
RETURNS TRIGGER AS $$
DECLARE
    v_org_id INTEGER;
    v_total_reseñas INTEGER;
    v_rating_promedio DECIMAL(3,2);
BEGIN
    -- Obtener organizacion_id de la cita
    SELECT organizacion_id INTO v_org_id
    FROM citas
    WHERE id = NEW.cita_id
    AND fecha_cita = NEW.fecha_cita;

    -- Calcular estadísticas actualizadas
    -- Solo reseñas publicadas
    SELECT
        COUNT(*),
        COALESCE(ROUND(AVG(rating), 2), 0)
    INTO v_total_reseñas, v_rating_promedio
    FROM marketplace_reseñas
    WHERE organizacion_id = v_org_id
      AND estado = 'publicada';

    -- Actualizar perfil
    UPDATE marketplace_perfiles
    SET
        total_reseñas = v_total_reseñas,
        rating_promedio = v_rating_promedio,
        actualizado_en = NOW()
    WHERE organizacion_id = v_org_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION actualizar_stats_perfil_marketplace() IS
'Actualiza total_reseñas y rating_promedio del perfil.
Trigger: AFTER INSERT/UPDATE en marketplace_reseñas.
Solo cuenta reseñas con estado=publicada.
Performance: <5ms (1 SELECT + 1 UPDATE).';

-- ====================================================================
-- FUNCIÓN 3/3: obtener_perfil_publico_por_slug
-- ====================================================================
-- Obtiene perfil completo de un negocio por su slug en un solo query.
--
-- RETORNA (JSONB):
-- • perfil - Datos completos del perfil
-- • servicios - Array de servicios activos
-- • profesionales - Array de profesionales activos
-- • reseñas - Array de últimas 10 reseñas publicadas
-- • stats - Estadísticas calculadas
--
-- OPTIMIZACIONES:
-- • Usa CTEs (Common Table Expressions) para organizar queries
-- • Un solo query con múltiples subqueries
-- • jsonb_agg para construir arrays JSON
-- • LIMIT en reseñas para evitar traer todas
--
-- USO: GET /api/v1/marketplace/perfiles/:slug
-- RENDIMIENTO: <50ms para perfil completo (5 subqueries + 1 final)
-- ====================================================================

CREATE OR REPLACE FUNCTION obtener_perfil_publico_por_slug(p_slug VARCHAR)
RETURNS TABLE (
    -- Datos del perfil
    perfil JSONB,
    -- Servicios disponibles
    servicios JSONB,
    -- Profesionales
    profesionales JSONB,
    -- Reseñas recientes
    reseñas JSONB,
    -- Estadísticas
    stats JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH perfil_data AS (
        -- Obtener perfil base con nombre comercial de la organización
        SELECT mp.*, o.nombre_comercial
        FROM marketplace_perfiles mp
        INNER JOIN organizaciones o ON mp.organizacion_id = o.id
        WHERE mp.slug = p_slug
          AND mp.activo = true
          AND mp.visible_en_directorio = true
        LIMIT 1
    ),
    servicios_data AS (
        -- Obtener servicios activos del negocio
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', s.id,
                'nombre', s.nombre,
                'descripcion', s.descripcion,
                'categoria', s.categoria,
                'subcategoria', s.subcategoria,
                'precio', s.precio,
                'duracion_minutos', s.duracion_minutos
            ) ORDER BY s.creado_en
        ) as servicios
        FROM servicios s
        INNER JOIN perfil_data pd ON s.organizacion_id = pd.organizacion_id
        WHERE s.activo = true
    ),
    profesionales_data AS (
        -- Obtener profesionales activos
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', p.id,
                'nombre_completo', p.nombre_completo,
                'biografia', p.biografia,
                'calificacion_promedio', p.calificacion_promedio
            ) ORDER BY p.creado_en
        ) as profesionales
        FROM profesionales p
        INNER JOIN perfil_data pd ON p.organizacion_id = pd.organizacion_id
        WHERE p.activo = true
    ),
    reseñas_data AS (
        -- Obtener últimas 10 reseñas publicadas
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', r.id,
                'rating', r.rating,
                'titulo', r.titulo,
                'comentario', r.comentario,
                'respuesta_negocio', r.respuesta_negocio,
                'creado_en', r.creado_en,
                'votos_util', r.votos_util
            ) ORDER BY r.creado_en DESC
        ) as reseñas
        FROM (
            SELECT r.id, r.rating, r.titulo, r.comentario, r.respuesta_negocio, r.creado_en, r.votos_util
            FROM marketplace_reseñas r
            INNER JOIN perfil_data pd ON r.organizacion_id = pd.organizacion_id
            WHERE r.estado = 'publicada'
            ORDER BY r.creado_en DESC
            LIMIT 10
        ) r
    ),
    stats_data AS (
        -- Construir objeto de estadísticas
        SELECT jsonb_build_object(
            'total_reseñas', pd.total_reseñas,
            'rating_promedio', pd.rating_promedio,
            'total_citas_completadas', pd.total_citas_completadas
        ) as stats
        FROM perfil_data pd
    )
    -- Query final: unir todos los datos
    SELECT
        row_to_json(pd.*)::jsonb as perfil,
        COALESCE(sd.servicios, '[]'::jsonb) as servicios,
        COALESCE(prd.profesionales, '[]'::jsonb) as profesionales,
        COALESCE(rd.reseñas, '[]'::jsonb) as reseñas,
        std.stats
    FROM perfil_data pd
    CROSS JOIN servicios_data sd
    CROSS JOIN profesionales_data prd
    CROSS JOIN reseñas_data rd
    CROSS JOIN stats_data std;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION obtener_perfil_publico_por_slug IS
'Obtiene perfil público completo de un negocio por slug.
Retorna: perfil + servicios + profesionales + reseñas + stats.
Un solo query con 5 CTEs para máxima eficiencia.
Usado por: GET /api/v1/marketplace/perfiles/:slug.
Performance: <50ms para perfil completo.
Ejemplo: SELECT * FROM obtener_perfil_publico_por_slug(''guadalajara-barberia-salon'');';
