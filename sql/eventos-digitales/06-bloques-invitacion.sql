-- ====================================================================
-- MÓDULO EVENTOS DIGITALES - BLOQUES DE INVITACIÓN
-- ====================================================================
-- Migración para agregar soporte de editor visual de invitaciones.
-- Los bloques se almacenan como JSONB para flexibilidad.
--
-- Fecha creación: 3 Febrero 2026
-- ====================================================================

-- ====================================================================
-- 1. AGREGAR COLUMNA bloques_invitacion
-- ====================================================================
-- Solo ejecutar si la columna no existe

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'eventos_digitales'
        AND column_name = 'bloques_invitacion'
    ) THEN
        ALTER TABLE eventos_digitales
        ADD COLUMN bloques_invitacion JSONB DEFAULT '[]';

        COMMENT ON COLUMN eventos_digitales.bloques_invitacion IS
            'Array de bloques del editor visual de invitación. Cada bloque tiene: id, tipo, orden, visible, contenido, estilos, version';
    END IF;
END $$;

-- ====================================================================
-- 2. CREAR ÍNDICE GIN PARA BÚSQUEDA EN BLOQUES
-- ====================================================================
-- Permite búsquedas eficientes dentro del JSONB

CREATE INDEX IF NOT EXISTS idx_eventos_bloques_invitacion
ON eventos_digitales USING GIN (bloques_invitacion);

-- ====================================================================
-- 3. FUNCIÓN AUXILIAR: Obtener tipos de bloques usados
-- ====================================================================
-- Útil para analytics y reporting

CREATE OR REPLACE FUNCTION obtener_tipos_bloques_evento(p_evento_id INTEGER)
RETURNS TABLE(tipo VARCHAR, cantidad INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (bloque->>'tipo')::VARCHAR as tipo,
        COUNT(*)::INTEGER as cantidad
    FROM
        eventos_digitales e,
        jsonb_array_elements(e.bloques_invitacion) as bloque
    WHERE
        e.id = p_evento_id
    GROUP BY
        bloque->>'tipo'
    ORDER BY
        cantidad DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION obtener_tipos_bloques_evento IS
    'Obtiene los tipos de bloques utilizados en un evento y su cantidad';

-- ====================================================================
-- 4. ACTUALIZAR FUNCIÓN obtener_evento_publico_por_slug
-- ====================================================================
-- Incluir bloques_invitacion en la respuesta pública
-- DROP requerido porque el tipo de retorno cambió (se removió organizacion_id)

DROP FUNCTION IF EXISTS obtener_evento_publico_por_slug(VARCHAR);

CREATE OR REPLACE FUNCTION obtener_evento_publico_por_slug(p_slug VARCHAR)
RETURNS TABLE (
    id INTEGER,
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
    bloques_invitacion JSONB,
    estado VARCHAR,
    publicado_en TIMESTAMPTZ,
    tema JSONB,
    ubicaciones JSONB,
    regalos JSONB,
    total_confirmados INTEGER,
    total_asistentes INTEGER,
    total_felicitaciones INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id,
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
        COALESCE(e.bloques_invitacion, '[]'::jsonb) as bloques_invitacion,
        e.estado,
        e.publicado_en,
        -- Obtener tema de la plantilla o defaults
        COALESCE(
            p.tema,
            '{
                "color_primario": "#ec4899",
                "color_secundario": "#fce7f3",
                "color_fondo": "#fdf2f8",
                "color_texto": "#1f2937",
                "color_texto_claro": "#6b7280",
                "fuente_titulo": "Playfair Display",
                "fuente_cuerpo": "Inter",
                "patron_fondo": "none",
                "patron_opacidad": 0.1,
                "decoracion_esquinas": "none",
                "icono_principal": "none",
                "animacion_entrada": "fade",
                "efecto_titulo": "none",
                "marco_fotos": "none",
                "stickers": []
            }'::jsonb
        ) as tema,
        -- Ubicaciones activas
        COALESCE(
            (SELECT jsonb_agg(
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
                    'notas', u.notas,
                    'orden', u.orden
                ) ORDER BY u.orden
            )
            FROM ubicaciones_evento u
            WHERE u.evento_id = e.id AND u.activo = true),
            '[]'::jsonb
        ) as ubicaciones,
        -- Mesa de regalos activa
        COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'id', r.id,
                    'nombre', r.nombre,
                    'descripcion', r.descripcion,
                    'url', r.url,
                    'imagen_url', r.imagen_url,
                    'orden', r.orden
                ) ORDER BY r.orden
            )
            FROM mesa_regalos_evento r
            WHERE r.evento_id = e.id AND r.activo = true),
            '[]'::jsonb
        ) as regalos,
        -- Contadores
        (SELECT COUNT(*)::INTEGER FROM invitados_evento i WHERE i.evento_id = e.id AND i.estado_rsvp = 'confirmado' AND i.activo = true) as total_confirmados,
        (SELECT COALESCE(SUM(i.cantidad_asistentes), 0)::INTEGER FROM invitados_evento i WHERE i.evento_id = e.id AND i.estado_rsvp = 'confirmado' AND i.activo = true) as total_asistentes,
        (SELECT COUNT(*)::INTEGER FROM felicitaciones_evento f WHERE f.evento_id = e.id AND f.estado = 'aprobada') as total_felicitaciones
    FROM
        eventos_digitales e
    LEFT JOIN
        plantillas_evento p ON e.plantilla_id = p.id
    WHERE
        e.slug = p_slug
        AND e.activo = true
        AND e.estado IN ('publicado', 'finalizado');
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION obtener_evento_publico_por_slug IS
    'Obtiene toda la información pública de un evento incluyendo bloques de invitación';

-- ====================================================================
-- 5. PLANTILLAS DE BLOQUES POR DEFECTO
-- ====================================================================
-- Bloques iniciales sugeridos para cada tipo de evento

CREATE OR REPLACE FUNCTION obtener_bloques_por_defecto(p_tipo_evento VARCHAR)
RETURNS JSONB AS $$
DECLARE
    v_bloques JSONB;
BEGIN
    CASE p_tipo_evento
        WHEN 'boda' THEN
            v_bloques := '[
                {"tipo": "hero_invitacion", "orden": 0, "visible": true, "contenido": {"titulo": "Nos Casamos", "subtitulo": "Te invitamos a celebrar nuestro amor"}},
                {"tipo": "protagonistas", "orden": 1, "visible": true, "contenido": {}},
                {"tipo": "countdown", "orden": 2, "visible": true, "contenido": {"titulo": "Faltan"}},
                {"tipo": "timeline", "orden": 3, "visible": true, "contenido": {"titulo": "Itinerario del Día"}},
                {"tipo": "ubicacion", "orden": 4, "visible": true, "contenido": {"titulo": "Ubicaciones"}},
                {"tipo": "rsvp", "orden": 5, "visible": true, "contenido": {"titulo": "Confirma tu Asistencia"}},
                {"tipo": "mesa_regalos", "orden": 6, "visible": true, "contenido": {"titulo": "Mesa de Regalos"}}
            ]'::jsonb;

        WHEN 'xv_anos' THEN
            v_bloques := '[
                {"tipo": "hero_invitacion", "orden": 0, "visible": true, "contenido": {"titulo": "Mis XV Años", "subtitulo": "Una noche mágica te espera"}},
                {"tipo": "protagonistas", "orden": 1, "visible": true, "contenido": {}},
                {"tipo": "countdown", "orden": 2, "visible": true, "contenido": {"titulo": "Cuenta Regresiva"}},
                {"tipo": "galeria", "orden": 3, "visible": true, "contenido": {"titulo": "Galería"}},
                {"tipo": "timeline", "orden": 4, "visible": true, "contenido": {"titulo": "Programa"}},
                {"tipo": "ubicacion", "orden": 5, "visible": true, "contenido": {"titulo": "Ubicación"}},
                {"tipo": "rsvp", "orden": 6, "visible": true, "contenido": {"titulo": "Confirma tu Asistencia"}}
            ]'::jsonb;

        WHEN 'bautizo' THEN
            v_bloques := '[
                {"tipo": "hero_invitacion", "orden": 0, "visible": true, "contenido": {"titulo": "Mi Bautizo", "subtitulo": "Un día especial de bendiciones"}},
                {"tipo": "protagonistas", "orden": 1, "visible": true, "contenido": {}},
                {"tipo": "ubicacion", "orden": 2, "visible": true, "contenido": {"titulo": "Ubicación de la Ceremonia"}},
                {"tipo": "rsvp", "orden": 3, "visible": true, "contenido": {"titulo": "Confirma tu Asistencia"}},
                {"tipo": "mesa_regalos", "orden": 4, "visible": true, "contenido": {"titulo": "Mesa de Regalos"}}
            ]'::jsonb;

        WHEN 'cumpleanos' THEN
            v_bloques := '[
                {"tipo": "hero_invitacion", "orden": 0, "visible": true, "contenido": {"titulo": "¡Estás Invitado!", "subtitulo": "Celebra conmigo"}},
                {"tipo": "countdown", "orden": 1, "visible": true, "contenido": {"titulo": "Faltan"}},
                {"tipo": "ubicacion", "orden": 2, "visible": true, "contenido": {"titulo": "¿Dónde será la fiesta?"}},
                {"tipo": "rsvp", "orden": 3, "visible": true, "contenido": {"titulo": "Confirma tu Asistencia"}}
            ]'::jsonb;

        WHEN 'corporativo' THEN
            v_bloques := '[
                {"tipo": "hero_invitacion", "orden": 0, "visible": true, "contenido": {"titulo": "Evento Corporativo", "subtitulo": ""}},
                {"tipo": "texto", "orden": 1, "visible": true, "contenido": {"contenido": "Descripción del evento"}},
                {"tipo": "timeline", "orden": 2, "visible": true, "contenido": {"titulo": "Agenda"}},
                {"tipo": "ubicacion", "orden": 3, "visible": true, "contenido": {"titulo": "Sede del Evento"}},
                {"tipo": "rsvp", "orden": 4, "visible": true, "contenido": {"titulo": "Registro"}}
            ]'::jsonb;

        ELSE
            -- Default genérico
            v_bloques := '[
                {"tipo": "hero_invitacion", "orden": 0, "visible": true, "contenido": {"titulo": "Te Invitamos", "subtitulo": ""}},
                {"tipo": "countdown", "orden": 1, "visible": true, "contenido": {"titulo": "Faltan"}},
                {"tipo": "ubicacion", "orden": 2, "visible": true, "contenido": {"titulo": "Ubicación"}},
                {"tipo": "rsvp", "orden": 3, "visible": true, "contenido": {"titulo": "Confirma tu Asistencia"}}
            ]'::jsonb;
    END CASE;

    RETURN v_bloques;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION obtener_bloques_por_defecto IS
    'Retorna la estructura de bloques por defecto según el tipo de evento';

-- ====================================================================
-- FIN DE MIGRACIÓN
-- ====================================================================
