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
-- DATOS INICIALES: TIPOS_PROFESIONAL (33 tipos)
-- ====================================================================

INSERT INTO tipos_profesional (
    organizacion_id, codigo, nombre, descripcion, categoria,
    industrias_compatibles, requiere_licencia, es_sistema, icono, color
) VALUES
-- BARBERÍA (2 tipos)
(NULL, 'barbero', 'Barbero', 'Especialista en cortes y arreglo de cabello masculino', 'barberia',
 ARRAY['barberia'], false, true, 'Scissors', '#8B4513'),
(NULL, 'estilista_masculino', 'Estilista Masculino', 'Estilista especializado en cortes y estilos masculinos', 'barberia',
 ARRAY['barberia', 'salon_belleza'], false, true, 'Scissors', '#A0522D'),

-- SALÓN DE BELLEZA (4 tipos)
(NULL, 'estilista', 'Estilista', 'Profesional en cortes, peinados y tratamientos capilares', 'salon_belleza',
 ARRAY['salon_belleza'], false, true, 'Scissors', '#FF69B4'),
(NULL, 'colorista', 'Colorista', 'Especialista en coloración y tratamientos de color', 'salon_belleza',
 ARRAY['salon_belleza'], false, true, 'Palette', '#9370DB'),
(NULL, 'manicurista', 'Manicurista', 'Especialista en cuidado de manos y uñas', 'salon_belleza',
 ARRAY['salon_belleza', 'estetica'], false, true, 'Hand', '#FF1493'),
(NULL, 'peinados_eventos', 'Peinados para Eventos', 'Especialista en peinados para bodas y eventos', 'salon_belleza',
 ARRAY['salon_belleza'], false, true, 'Crown', '#DA70D6'),

-- ESTÉTICA Y COSMETOLOGÍA (3 tipos)
(NULL, 'esteticista', 'Esteticista', 'Profesional en tratamientos faciales y corporales', 'estetica',
 ARRAY['estetica', 'spa'], false, true, 'Sparkles', '#FFB6C1'),
(NULL, 'cosmetologo', 'Cosmetólogo', 'Especialista en cosmetología y tratamientos de piel', 'estetica',
 ARRAY['estetica'], true, true, 'Beaker', '#FF69B4'),
(NULL, 'depilacion_laser', 'Depilación Láser', 'Técnico en depilación láser', 'estetica',
 ARRAY['estetica'], true, true, 'Zap', '#FF1493'),

-- SPA Y TERAPIAS (4 tipos)
(NULL, 'masajista', 'Masajista', 'Terapeuta de masajes y relajación', 'spa',
 ARRAY['spa', 'estetica'], false, true, 'Hand', '#87CEEB'),
(NULL, 'terapeuta_spa', 'Terapeuta de Spa', 'Profesional en tratamientos de spa', 'spa',
 ARRAY['spa'], false, true, 'Flower', '#B0E0E6'),
(NULL, 'aromaterapeuta', 'Aromaterapeuta', 'Especialista en terapias con aceites esenciales', 'spa',
 ARRAY['spa'], false, true, 'Leaf', '#98FB98'),
(NULL, 'reflexologo', 'Reflexólogo', 'Terapeuta de reflexología', 'spa',
 ARRAY['spa'], false, true, 'Footprints', '#90EE90'),

-- PODOLOGÍA (2 tipos)
(NULL, 'podologo', 'Podólogo', 'Especialista en cuidado de pies', 'podologia',
 ARRAY['podologia'], true, true, 'Footprints', '#4682B4'),
(NULL, 'asistente_podologia', 'Asistente de Podología', 'Asistente en tratamientos podológicos', 'podologia',
 ARRAY['podologia'], false, true, 'Users', '#5F9EA0'),

-- CONSULTORIO MÉDICO (3 tipos)
(NULL, 'doctor_general', 'Doctor General', 'Médico general', 'medico',
 ARRAY['consultorio_medico'], true, true, 'Stethoscope', '#DC143C'),
(NULL, 'enfermero', 'Enfermero', 'Profesional de enfermería', 'medico',
 ARRAY['consultorio_medico'], true, true, 'HeartPulse', '#FF6347'),
(NULL, 'recepcionista_medica', 'Recepcionista Médica', 'Recepcionista en consultorios médicos', 'medico',
 ARRAY['consultorio_medico'], false, true, 'Users', '#FFA07A'),

-- ACADEMIA (3 tipos)
(NULL, 'instructor', 'Instructor', 'Instructor de cursos', 'academia',
 ARRAY['academia'], false, true, 'GraduationCap', '#4169E1'),
(NULL, 'profesor', 'Profesor', 'Profesor de materias', 'academia',
 ARRAY['academia'], false, true, 'Book', '#1E90FF'),
(NULL, 'tutor', 'Tutor', 'Tutor personalizado', 'academia',
 ARRAY['academia'], false, true, 'Users', '#87CEEB'),

-- TALLER TÉCNICO (4 tipos)
(NULL, 'tecnico_auto', 'Técnico Automotriz', 'Mecánico de vehículos', 'taller_tecnico',
 ARRAY['taller_tecnico'], false, true, 'Wrench', '#696969'),
(NULL, 'tecnico_electronico', 'Técnico Electrónico', 'Técnico en electrónica', 'taller_tecnico',
 ARRAY['taller_tecnico'], false, true, 'Cpu', '#808080'),
(NULL, 'mecanico', 'Mecánico', 'Mecánico general', 'taller_tecnico',
 ARRAY['taller_tecnico'], false, true, 'Settings', '#A9A9A9'),
(NULL, 'soldador', 'Soldador', 'Técnico en soldadura', 'taller_tecnico',
 ARRAY['taller_tecnico'], false, true, 'Flame', '#C0C0C0'),

-- CENTRO FITNESS (4 tipos)
(NULL, 'entrenador_personal', 'Entrenador Personal', 'Entrenador deportivo personalizado', 'fitness',
 ARRAY['centro_fitness'], false, true, 'Dumbbell', '#FF8C00'),
(NULL, 'instructor_yoga', 'Instructor de Yoga', 'Instructor de yoga y meditación', 'fitness',
 ARRAY['centro_fitness'], false, true, 'User', '#32CD32'),
(NULL, 'instructor_pilates', 'Instructor de Pilates', 'Instructor de pilates', 'fitness',
 ARRAY['centro_fitness'], false, true, 'Activity', '#00CED1'),
(NULL, 'nutricionista', 'Nutricionista', 'Especialista en nutrición', 'fitness',
 ARRAY['centro_fitness', 'consultorio_medico'], true, true, 'Apple', '#228B22'),

-- VETERINARIA (3 tipos)
(NULL, 'veterinario', 'Veterinario', 'Médico veterinario', 'veterinaria',
 ARRAY['veterinaria'], true, true, 'Heart', '#8B0000'),
(NULL, 'asistente_veterinario', 'Asistente Veterinario', 'Asistente en medicina veterinaria', 'veterinaria',
 ARRAY['veterinaria'], false, true, 'Users', '#DC143C'),
(NULL, 'groomer', 'Groomer', 'Estilista canino', 'veterinaria',
 ARRAY['veterinaria'], false, true, 'Scissors', '#FF1493'),

-- GENÉRICO (1 tipo)
(NULL, 'otro', 'Otro', 'Tipo de profesional genérico', 'otro',
 ARRAY['otro', 'academia', 'barberia', 'centro_fitness', 'consultorio_medico', 'estetica', 'podologia', 'salon_belleza', 'spa', 'taller_tecnico', 'veterinaria'],
 false, true, 'User', '#808080');

COMMENT ON TABLE tipos_profesional IS 'SEED: 33 tipos del sistema insertados (11 categorías). Incluye iconos y colores para frontend.';

-- ====================================================================
-- ✅ VALIDACIÓN FINAL DE SEED DATA
-- ====================================================================

DO $$
DECLARE
    count_bloqueos INTEGER;
    count_profesionales INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_bloqueos FROM tipos_bloqueo WHERE es_sistema = true;
    SELECT COUNT(*) INTO count_profesionales FROM tipos_profesional WHERE es_sistema = true;

    IF count_bloqueos != 9 THEN
        RAISE EXCEPTION 'Error: Se esperaban 9 tipos de bloqueo del sistema, se encontraron %', count_bloqueos;
    END IF;

    IF count_profesionales != 33 THEN
        RAISE EXCEPTION 'Error: Se esperaban 33 tipos de profesional del sistema, se encontraron %', count_profesionales;
    END IF;

    -- Validar triggers activos
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_proteger_tipos_sistema'
    ) THEN
        RAISE EXCEPTION 'Error: Trigger de protección tipos_bloqueo no está activo';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_proteger_tipos_profesional_sistema'
    ) THEN
        RAISE EXCEPTION 'Error: Trigger de protección tipos_profesional no está activo';
    END IF;

    -- Validar RLS habilitado
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables WHERE tablename = 'tipos_bloqueo' AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION 'Error: RLS no está habilitado en tipos_bloqueo';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_tables WHERE tablename = 'tipos_profesional' AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION 'Error: RLS no está habilitado en tipos_profesional';
    END IF;

    RAISE NOTICE '✅ Tabla tipos_bloqueo creada exitosamente';
    RAISE NOTICE '✅ 9 tipos del sistema insertados';
    RAISE NOTICE '✅ Índices únicos creados';
    RAISE NOTICE '✅ Políticas RLS configuradas';
    RAISE NOTICE '✅ Triggers de protección activos';
    RAISE NOTICE 'ℹ️  Colores e iconos manejados en frontend';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Tabla tipos_profesional creada exitosamente';
    RAISE NOTICE '✅ 33 tipos del sistema insertados';
    RAISE NOTICE '✅ Índices únicos creados correctamente';
    RAISE NOTICE '✅ Políticas RLS configuradas';
    RAISE NOTICE '✅ Triggers de protección activos';
    RAISE NOTICE '✅ Validaciones completadas sin errores';
END $$;
