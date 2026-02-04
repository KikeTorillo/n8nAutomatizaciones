-- ====================================================================
-- MÓDULO EVENTOS DIGITALES - FUNCIONES SQL
-- ====================================================================
-- Funciones de utilidad para el módulo de eventos digitales.
--
-- Fecha creación: 4 Diciembre 2025
-- Actualizado: 3 Febrero 2026 - Eliminados triggers de métricas no usados
-- ====================================================================

-- ====================================================================
-- FUNCIÓN: OBTENER ESTADÍSTICAS DE RSVP POR EVENTO
-- ====================================================================
CREATE OR REPLACE FUNCTION obtener_estadisticas_rsvp(p_evento_id INTEGER)
RETURNS TABLE (
    total_invitados INTEGER,
    total_confirmados INTEGER,
    total_declinados INTEGER,
    total_pendientes INTEGER,
    total_asistentes INTEGER,
    porcentaje_confirmacion DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER as total_invitados,
        COUNT(*) FILTER (WHERE estado_rsvp = 'confirmado')::INTEGER as total_confirmados,
        COUNT(*) FILTER (WHERE estado_rsvp = 'declinado')::INTEGER as total_declinados,
        COUNT(*) FILTER (WHERE estado_rsvp = 'pendiente')::INTEGER as total_pendientes,
        COALESCE(SUM(num_asistentes) FILTER (WHERE estado_rsvp = 'confirmado'), 0)::INTEGER as total_asistentes,
        CASE
            WHEN COUNT(*) > 0
            THEN ROUND((COUNT(*) FILTER (WHERE estado_rsvp = 'confirmado')::DECIMAL / COUNT(*)) * 100, 2)
            ELSE 0
        END as porcentaje_confirmacion
    FROM invitados_evento
    WHERE evento_id = p_evento_id AND activo = true;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION obtener_estadisticas_rsvp IS
    'Retorna estadísticas de confirmación RSVP para un evento específico';

-- ====================================================================
-- FUNCIÓN: OBTENER EVENTO PÚBLICO POR SLUG
-- ====================================================================
CREATE OR REPLACE FUNCTION obtener_evento_publico_por_slug(p_slug VARCHAR)
RETURNS TABLE (
    id INTEGER,
    organizacion_id INTEGER,
    nombre VARCHAR,
    tipo VARCHAR,
    slug VARCHAR,
    descripcion TEXT,
    fecha_evento TIMESTAMPTZ,
    hora_evento TIME,
    fecha_fin_evento TIMESTAMPTZ,
    fecha_limite_rsvp TIMESTAMPTZ,
    protagonistas JSONB,
    portada_url TEXT,
    galeria_urls JSONB,
    configuracion JSONB,
    -- Tema de la plantilla
    tema JSONB,
    plantilla_nombre VARCHAR,
    -- Estadísticas
    total_confirmados INTEGER,
    total_asistentes INTEGER,
    -- Ubicaciones
    ubicaciones JSONB,
    -- Mesa de regalos
    regalos JSONB,
    total_regalos INTEGER,
    -- Felicitaciones count
    total_felicitaciones INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id,
        e.organizacion_id,
        e.nombre,
        e.tipo,
        e.slug,
        e.descripcion,
        e.fecha_evento,
        e.hora_evento,
        e.fecha_fin_evento,
        e.fecha_limite_rsvp,
        e.protagonistas,
        e.portada_url,
        e.galeria_urls,
        e.configuracion,
        -- Tema de la plantilla (con default si no tiene)
        COALESCE(p.tema, '{
            "color_primario": "#ec4899",
            "color_secundario": "#fce7f3",
            "color_fondo": "#fdf2f8",
            "color_texto": "#1f2937",
            "color_texto_claro": "#6b7280",
            "fuente_titulo": "Playfair Display",
            "fuente_cuerpo": "Inter"
        }'::jsonb),
        p.nombre,
        -- Estadísticas de invitados
        (SELECT COUNT(*) FROM invitados_evento i WHERE i.evento_id = e.id AND i.estado_rsvp = 'confirmado')::INTEGER,
        (SELECT COALESCE(SUM(i.num_asistentes), 0) FROM invitados_evento i WHERE i.evento_id = e.id AND i.estado_rsvp = 'confirmado')::INTEGER,
        -- Ubicaciones como JSONB array
        (
            SELECT COALESCE(jsonb_agg(
                jsonb_build_object(
                    'id', u.id,
                    'nombre', u.nombre,
                    'tipo', u.tipo,
                    'descripcion', u.descripcion,
                    'direccion', u.direccion,
                    'latitud', u.latitud,
                    'longitud', u.longitud,
                    'google_maps_url', u.google_maps_url,
                    'hora_inicio', u.hora_inicio,
                    'hora_fin', u.hora_fin,
                    'codigo_vestimenta', u.codigo_vestimenta,
                    'notas', u.notas
                ) ORDER BY u.orden
            ), '[]'::jsonb)
            FROM ubicaciones_evento u
            WHERE u.evento_id = e.id AND u.activo = true
        ),
        -- Regalos como JSONB array
        (
            SELECT COALESCE(jsonb_agg(
                jsonb_build_object(
                    'id', m.id,
                    'tipo', m.tipo,
                    'nombre', m.nombre,
                    'descripcion', m.descripcion,
                    'precio', m.precio,
                    'imagen_url', m.imagen_url,
                    'url_externa', m.url_externa,
                    'comprado', m.comprado,
                    'orden', m.orden
                ) ORDER BY m.orden, m.id
            ), '[]'::jsonb)
            FROM mesa_regalos_evento m
            WHERE m.evento_id = e.id AND m.activo = true
        ),
        -- Total regalos
        (SELECT COUNT(*) FROM mesa_regalos_evento m WHERE m.evento_id = e.id AND m.activo = true)::INTEGER,
        -- Total felicitaciones
        (SELECT COUNT(*) FROM felicitaciones_evento f WHERE f.evento_id = e.id AND f.aprobado = true)::INTEGER
    FROM eventos_digitales e
    LEFT JOIN plantillas_evento p ON e.plantilla_id = p.id
    WHERE e.slug = p_slug
      AND e.estado = 'publicado'
      AND e.activo = true;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION obtener_evento_publico_por_slug IS
    'Obtiene toda la información pública de un evento por su slug, incluyendo tema de plantilla, ubicaciones y contadores';
