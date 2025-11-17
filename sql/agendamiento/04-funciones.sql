-- ====================================================================
-- 📅 MÓDULO AGENDAMIENTO - FUNCIONES
-- ====================================================================
--
-- Versión: 1.0.0
-- Fecha: 16 Noviembre 2025
-- Módulo: agendamiento
--
-- DESCRIPCIÓN:
-- Funciones especializadas para gestión de horarios y validaciones de disponibilidad.
-- Automatizan validaciones de integridad y actualizaciones de timestamps.
--
-- FUNCIONES:
-- • validar_solapamiento_horarios(): Previene conflictos de horarios del mismo profesional
-- • actualizar_timestamp_horarios_profesionales(): Actualiza automáticamente timestamps
--
-- ====================================================================

-- ====================================================================
-- 🔍 FUNCIÓN: VALIDAR SOLAPAMIENTO DE HORARIOS
-- ====================================================================
-- Valida que no haya solapamientos entre horarios del mismo profesional
-- en el mismo día y periodo de vigencia
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION validar_solapamiento_horarios()
RETURNS TRIGGER AS $$
DECLARE
    v_conflictos INTEGER;
BEGIN
    -- Verificar solapamientos con otros horarios activos del mismo profesional en el mismo día
    SELECT COUNT(*)
    INTO v_conflictos
    FROM horarios_profesionales hp
    WHERE hp.profesional_id = NEW.profesional_id
    AND hp.dia_semana = NEW.dia_semana
    AND hp.activo = TRUE
    AND hp.id != COALESCE(NEW.id, 0)  -- Excluir el registro actual en caso de UPDATE
    AND (
        -- Verificar solapamiento temporal (vigencia)
        (NEW.fecha_inicio <= COALESCE(hp.fecha_fin, '2099-12-31') AND
         COALESCE(NEW.fecha_fin, '2099-12-31') >= hp.fecha_inicio)
        AND
        -- Verificar solapamiento de horarios (hora inicio/fin)
        (NEW.hora_inicio < hp.hora_fin AND NEW.hora_fin > hp.hora_inicio)
    );

    IF v_conflictos > 0 THEN
        RAISE EXCEPTION 'Horario se solapa con otro horario existente del profesional en el mismo día';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- 🔄 FUNCIÓN: ACTUALIZAR TIMESTAMP HORARIOS PROFESIONALES
-- ====================================================================
-- Actualiza automáticamente el timestamp al modificar horarios
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION actualizar_timestamp_horarios_profesionales()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- 📝 COMENTARIOS DE FUNCIONES
-- ====================================================================

COMMENT ON FUNCTION validar_solapamiento_horarios() IS
'Valida que no haya solapamientos entre horarios del mismo profesional.
Verifica tanto solapamiento de horarios (hora_inicio/hora_fin) como de vigencia temporal (fecha_inicio/fecha_fin).
Usado por: trigger_validar_solapamiento_horarios
Casos de error:
- Mismo profesional, mismo día, horarios solapados
- Ejemplo: Lunes 9:00-13:00 + Lunes 12:00-18:00 = CONFLICTO';

COMMENT ON FUNCTION actualizar_timestamp_horarios_profesionales() IS
'Actualiza automáticamente el campo actualizado_en al modificar un horario.
Usado por: trigger_actualizar_timestamp_horarios_prof
Ejecución: BEFORE UPDATE en tabla horarios_profesionales';
