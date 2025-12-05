-- ====================================================================
-- MÓDULO EVENTOS DIGITALES - TRIGGERS PARA MÉTRICAS
-- ====================================================================
-- Triggers que actualizan contadores en metricas_uso_organizacion
-- para validar límites del plan de suscripción.
--
-- Fecha creación: 4 Diciembre 2025
-- ====================================================================

-- ====================================================================
-- TRIGGER: ACTUALIZAR CONTADOR DE EVENTOS ACTIVOS
-- ====================================================================
CREATE OR REPLACE FUNCTION trigger_metricas_eventos_digitales()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Solo contar si el evento está activo
        IF NEW.activo = true THEN
            UPDATE metricas_uso_organizacion
            SET uso_eventos_activos = COALESCE(uso_eventos_activos, 0) + 1,
                ultima_actualizacion = NOW()
            WHERE organizacion_id = NEW.organizacion_id;

            -- Si no existe registro de métricas, crearlo
            IF NOT FOUND THEN
                INSERT INTO metricas_uso_organizacion (organizacion_id, uso_eventos_activos)
                VALUES (NEW.organizacion_id, 1)
                ON CONFLICT (organizacion_id) DO UPDATE
                SET uso_eventos_activos = COALESCE(metricas_uso_organizacion.uso_eventos_activos, 0) + 1,
                    ultima_actualizacion = NOW();
            END IF;
        END IF;
        RETURN NEW;

    ELSIF TG_OP = 'UPDATE' THEN
        -- Si cambió el estado activo
        IF OLD.activo = true AND NEW.activo = false THEN
            -- Decrementar contador
            UPDATE metricas_uso_organizacion
            SET uso_eventos_activos = GREATEST(0, COALESCE(uso_eventos_activos, 0) - 1),
                ultima_actualizacion = NOW()
            WHERE organizacion_id = NEW.organizacion_id;
        ELSIF OLD.activo = false AND NEW.activo = true THEN
            -- Incrementar contador
            UPDATE metricas_uso_organizacion
            SET uso_eventos_activos = COALESCE(uso_eventos_activos, 0) + 1,
                ultima_actualizacion = NOW()
            WHERE organizacion_id = NEW.organizacion_id;
        END IF;
        RETURN NEW;

    ELSIF TG_OP = 'DELETE' THEN
        -- Solo decrementar si estaba activo
        IF OLD.activo = true THEN
            UPDATE metricas_uso_organizacion
            SET uso_eventos_activos = GREATEST(0, COALESCE(uso_eventos_activos, 0) - 1),
                ultima_actualizacion = NOW()
            WHERE organizacion_id = OLD.organizacion_id;
        END IF;
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_metricas_eventos_digitales ON eventos_digitales;
CREATE TRIGGER trg_metricas_eventos_digitales
    AFTER INSERT OR UPDATE OF activo OR DELETE ON eventos_digitales
    FOR EACH ROW
    EXECUTE FUNCTION trigger_metricas_eventos_digitales();

COMMENT ON FUNCTION trigger_metricas_eventos_digitales IS
    'Mantiene actualizado el contador uso_eventos_activos en metricas_uso_organizacion';

-- ====================================================================
-- TRIGGER: ACTUALIZAR CONTADOR DE INVITADOS TOTALES
-- ====================================================================
CREATE OR REPLACE FUNCTION trigger_metricas_invitados_evento()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE metricas_uso_organizacion
        SET uso_invitados_total = COALESCE(uso_invitados_total, 0) + 1,
            ultima_actualizacion = NOW()
        WHERE organizacion_id = NEW.organizacion_id;

        -- Si no existe registro de métricas, crearlo
        IF NOT FOUND THEN
            INSERT INTO metricas_uso_organizacion (organizacion_id, uso_invitados_total)
            VALUES (NEW.organizacion_id, 1)
            ON CONFLICT (organizacion_id) DO UPDATE
            SET uso_invitados_total = COALESCE(metricas_uso_organizacion.uso_invitados_total, 0) + 1,
                ultima_actualizacion = NOW();
        END IF;
        RETURN NEW;

    ELSIF TG_OP = 'DELETE' THEN
        UPDATE metricas_uso_organizacion
        SET uso_invitados_total = GREATEST(0, COALESCE(uso_invitados_total, 0) - 1),
            ultima_actualizacion = NOW()
        WHERE organizacion_id = OLD.organizacion_id;
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_metricas_invitados_evento ON invitados_evento;
CREATE TRIGGER trg_metricas_invitados_evento
    AFTER INSERT OR DELETE ON invitados_evento
    FOR EACH ROW
    EXECUTE FUNCTION trigger_metricas_invitados_evento();

COMMENT ON FUNCTION trigger_metricas_invitados_evento IS
    'Mantiene actualizado el contador uso_invitados_total en metricas_uso_organizacion';

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
    -- Estadísticas
    total_confirmados INTEGER,
    total_asistentes INTEGER,
    -- Ubicaciones
    ubicaciones JSONB,
    -- Mesa de regalos count
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
        -- Total regalos
        (SELECT COUNT(*) FROM mesa_regalos_evento m WHERE m.evento_id = e.id AND m.activo = true)::INTEGER,
        -- Total felicitaciones
        (SELECT COUNT(*) FROM felicitaciones_evento f WHERE f.evento_id = e.id AND f.aprobado = true)::INTEGER
    FROM eventos_digitales e
    WHERE e.slug = p_slug
      AND e.estado = 'publicado'
      AND e.activo = true;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION obtener_evento_publico_por_slug IS
    'Obtiene toda la información pública de un evento por su slug, incluyendo ubicaciones y contadores';
