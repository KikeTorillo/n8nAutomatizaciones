-- ====================================================================
-- 🔄 MÓDULO BLOQUEOS - TRIGGERS AUTOMÁTICOS
-- ====================================================================
--
-- PROPÓSITO:
-- Triggers que automatizan validaciones, actualizaciones de timestamps
-- y mantenimiento de métricas en bloqueos de horarios.
--
-- COMPONENTES:
-- • 3 triggers automáticos
--
-- CARACTERÍSTICAS:
-- ✅ Actualización automática de timestamps
-- ✅ Validación de coherencia organizacional
-- ✅ Detección de solapamientos
-- ✅ Actualización de métricas de uso
--
-- ORDEN DE EJECUCIÓN:
-- BEFORE INSERT/UPDATE:
--   1. trigger_validar_bloqueos_horarios (validación)
--   2. trigger_actualizar_timestamp_bloqueos (timestamp)
--
-- AFTER INSERT/UPDATE/DELETE:
--   3. trigger_actualizar_metricas_bloqueos (métricas)
--
-- ORDEN DE CARGA: #8 (después de funciones)
-- VERSIÓN: 1.0.0
-- FECHA: 17 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- TRIGGER 1: VALIDACIÓN DE COHERENCIA Y SOLAPAMIENTOS
-- ====================================================================
-- Se ejecuta: BEFORE INSERT OR UPDATE
-- Función: validar_bloqueos_horarios()
-- Validaciones:
-- • Coherencia organizacional (profesional/servicio)
-- • Solapamientos con otros bloqueos activos
-- ────────────────────────────────────────────────────────────────────

CREATE TRIGGER trigger_validar_bloqueos_horarios
    BEFORE INSERT OR UPDATE ON bloqueos_horarios
    FOR EACH ROW
    EXECUTE FUNCTION validar_bloqueos_horarios();

COMMENT ON TRIGGER trigger_validar_bloqueos_horarios ON bloqueos_horarios IS
'Valida coherencia organizacional y detecta solapamientos de horarios antes de INSERT/UPDATE.
Función: validar_bloqueos_horarios()
Validaciones:
  1. Profesional pertenece a la organización
  2. Servicio pertenece a la organización
  3. No hay solapamientos con otros bloqueos activos del mismo profesional';

-- ====================================================================
-- TRIGGER 2: ACTUALIZACIÓN AUTOMÁTICA DE TIMESTAMPS
-- ====================================================================
-- Se ejecuta: BEFORE UPDATE
-- Función: actualizar_timestamp_bloqueos()
-- Actualiza: campo actualizado_en con NOW()
-- ────────────────────────────────────────────────────────────────────

CREATE TRIGGER trigger_actualizar_timestamp_bloqueos
    BEFORE UPDATE ON bloqueos_horarios
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp_bloqueos();

COMMENT ON TRIGGER trigger_actualizar_timestamp_bloqueos ON bloqueos_horarios IS
'Actualiza automáticamente el campo actualizado_en en cada UPDATE.
Función: actualizar_timestamp_bloqueos()';

-- ====================================================================
-- TRIGGER 3: ACTUALIZACIÓN DE MÉTRICAS DE USO
-- ====================================================================
-- Se ejecuta: AFTER INSERT OR UPDATE OR DELETE
-- Función: actualizar_metricas_bloqueos()
-- Actualiza: metricas_uso_organizacion.ultima_actualizacion
-- ────────────────────────────────────────────────────────────────────

CREATE TRIGGER trigger_actualizar_metricas_bloqueos
    AFTER INSERT OR DELETE OR UPDATE ON bloqueos_horarios
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_metricas_bloqueos();

COMMENT ON TRIGGER trigger_actualizar_metricas_bloqueos ON bloqueos_horarios IS
'Actualiza métricas de uso en metricas_uso_organizacion después de INSERT/UPDATE/DELETE.
Función: actualizar_metricas_bloqueos()
Actualiza: ultima_actualizacion en la organización afectada';

-- ====================================================================
-- 📊 RESUMEN DE TRIGGERS
-- ====================================================================
-- Total: 3 triggers automáticos
--
-- Por momento de ejecución:
-- • 2 BEFORE triggers (validación + timestamp)
-- • 1 AFTER trigger (métricas)
--
-- Por operación:
-- • INSERT: 3 triggers (validación, timestamp N/A, métricas)
-- • UPDATE: 3 triggers (validación, timestamp, métricas)
-- • DELETE: 1 trigger (métricas)
--
-- Orden de ejecución en INSERT:
-- 1. BEFORE: trigger_validar_bloqueos_horarios
-- 2. INSERT ejecutado
-- 3. AFTER: trigger_actualizar_metricas_bloqueos
--
-- Orden de ejecución en UPDATE:
-- 1. BEFORE: trigger_validar_bloqueos_horarios
-- 2. BEFORE: trigger_actualizar_timestamp_bloqueos
-- 3. UPDATE ejecutado
-- 4. AFTER: trigger_actualizar_metricas_bloqueos
--
-- Orden de ejecución en DELETE:
-- 1. DELETE ejecutado
-- 2. AFTER: trigger_actualizar_metricas_bloqueos
-- ====================================================================
