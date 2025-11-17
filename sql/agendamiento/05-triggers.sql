-- ====================================================================
-- 📅 MÓDULO AGENDAMIENTO - TRIGGERS
-- ====================================================================
--
-- Versión: 1.0.0
-- Fecha: 16 Noviembre 2025
-- Módulo: agendamiento
--
-- DESCRIPCIÓN:
-- Triggers automáticos para validaciones y actualizaciones en horarios.
-- Garantizan integridad de datos y automatizan tareas repetitivas.
--
-- TRIGGERS:
-- • trigger_validar_solapamiento_horarios: Previene conflictos de horarios
-- • trigger_actualizar_timestamp_horarios_prof: Actualiza timestamps automáticamente
--
-- ====================================================================

-- ====================================================================
-- ⚡ TRIGGERS PARA TABLA HORARIOS_PROFESIONALES
-- ====================================================================

-- TRIGGER 1: Validación de solapamientos
-- Ejecuta ANTES de INSERT o UPDATE para prevenir conflictos
CREATE TRIGGER trigger_validar_solapamiento_horarios
    BEFORE INSERT OR UPDATE ON horarios_profesionales
    FOR EACH ROW EXECUTE FUNCTION validar_solapamiento_horarios();

-- TRIGGER 2: Actualización automática de timestamps
-- Ejecuta ANTES de UPDATE para actualizar actualizado_en
CREATE TRIGGER trigger_actualizar_timestamp_horarios_prof
    BEFORE UPDATE ON horarios_profesionales
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp_horarios_profesionales();

-- ====================================================================
-- 📝 COMENTARIOS DE TRIGGERS
-- ====================================================================

COMMENT ON TRIGGER trigger_validar_solapamiento_horarios ON horarios_profesionales IS
'Valida que no haya solapamientos de horarios del mismo profesional en el mismo día.
Función: validar_solapamiento_horarios()
Ejecución: BEFORE INSERT OR UPDATE
Previene: Conflictos de horarios solapados temporalmente';

COMMENT ON TRIGGER trigger_actualizar_timestamp_horarios_prof ON horarios_profesionales IS
'Actualiza automáticamente el campo actualizado_en al modificar un horario.
Función: actualizar_timestamp_horarios_profesionales()
Ejecución: BEFORE UPDATE
Auditoría: Tracking de cambios en horarios';
