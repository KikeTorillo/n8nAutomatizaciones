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
-- NOTA: La función obtener_evento_publico_por_slug está definida en
-- 06-bloques-invitacion.sql con soporte para bloques_invitacion
-- ====================================================================
