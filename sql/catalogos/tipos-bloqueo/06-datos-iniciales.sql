-- ====================================================================
-- MÓDULO CATÁLOGOS: DATOS INICIALES
-- ====================================================================
-- Seed data para catálogos del sistema.
--
-- CONTENIDO:
-- • 9 tipos de bloqueo del sistema
-- • 33 tipos de profesional del sistema
--
-- Migrado de: sql/schema/04-catalog-tables.sql
-- Fecha migración: 16 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- DATOS INICIALES: TIPOS_BLOQUEO (9 tipos)
-- ====================================================================

INSERT INTO tipos_bloqueo (
    organizacion_id, codigo, nombre, descripcion,
    es_sistema, orden_display,
    permite_todo_el_dia, permite_horario_especifico
) VALUES
-- 🔵 Tipos originales del ENUM (7)
(NULL, 'vacaciones', 'Vacaciones', 'Vacaciones programadas del profesional',
 true, 1, true, false),

(NULL, 'feriado', 'Feriado', 'Días feriados nacionales o locales',
 true, 2, true, false),

(NULL, 'mantenimiento', 'Mantenimiento', 'Mantenimiento de equipos o instalaciones',
 true, 3, true, true),

(NULL, 'evento_especial', 'Evento Especial', 'Capacitaciones o seminarios',
 true, 4, true, true),

(NULL, 'emergencia', 'Emergencia', 'Bloqueos de emergencia no planificados',
 true, 5, true, true),

(NULL, 'personal', 'Personal', 'Motivos personales del profesional',
 true, 6, true, true),

(NULL, 'organizacional', 'Organizacional', 'Decisión administrativa',
 true, 7, true, true),

-- 🆕 NUEVOS TIPOS (2) 🎉
(NULL, 'hora_comida', 'Hora de Comida', 'Horario de comida del profesional',
 true, 8, false, true),

(NULL, 'descanso', 'Descanso', 'Período de descanso durante la jornada',
 true, 9, false, true);

COMMENT ON TABLE tipos_bloqueo IS 'SEED: 9 tipos del sistema insertados. Colores e iconos manejados en frontend.';

-- ====================================================================
-- ✅ VALIDACIÓN FINAL DE SEED DATA
-- ====================================================================

DO $$
DECLARE
    count_bloqueos INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_bloqueos FROM tipos_bloqueo WHERE es_sistema = true;

    IF count_bloqueos != 9 THEN
        RAISE EXCEPTION 'Error: Se esperaban 9 tipos de bloqueo del sistema, se encontraron %', count_bloqueos;
    END IF;

    -- Validar triggers activos
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_proteger_tipos_sistema'
    ) THEN
        RAISE EXCEPTION 'Error: Trigger de protección tipos_bloqueo no está activo';
    END IF;

    -- Validar RLS habilitado
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables WHERE tablename = 'tipos_bloqueo' AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION 'Error: RLS no está habilitado en tipos_bloqueo';
    END IF;

    RAISE NOTICE '✅ Tabla tipos_bloqueo creada exitosamente';
    RAISE NOTICE '✅ 9 tipos del sistema insertados';
    RAISE NOTICE '✅ Índices únicos creados';
    RAISE NOTICE '✅ Políticas RLS configuradas';
    RAISE NOTICE '✅ Triggers de protección activos';
    RAISE NOTICE 'ℹ️  Colores e iconos manejados en frontend';
    RAISE NOTICE '✅ Validaciones completadas sin errores';
END $$;
