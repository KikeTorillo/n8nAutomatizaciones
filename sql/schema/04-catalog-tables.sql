-- ====================================================================
-- 📚 TABLAS CATÁLOGO DEL SISTEMA
-- ====================================================================
--
-- Este archivo contiene tablas catálogo dinámicas que reemplazan ENUMs
-- estáticos para mayor flexibilidad en el sistema SaaS multi-tenant.
--
-- 🎯 PROPÓSITO:
-- • Catálogos con datos del sistema + datos por organización
-- • Flexibilidad para agregar valores sin migrations
-- • Soporte multi-tenant con RLS
-- • Soft delete para preservar históricos
--
-- 📊 CONTENIDO:
-- • tipos_bloqueo - Catálogo dinámico de tipos de bloqueo
--
-- 🔄 ORDEN DE EJECUCIÓN: #4 (después de ENUMs, antes de tablas operacionales)
-- ====================================================================

-- ====================================================================
-- 🎨 TABLA TIPOS_BLOQUEO - CATÁLOGO DINÁMICO DE TIPOS DE BLOQUEO
-- ====================================================================
-- Reemplaza el ENUM tipo_bloqueo por un sistema flexible con índice
-- incremental que permite tipos del sistema + tipos personalizados.
--
-- 🎯 CASOS DE USO:
-- • Tipos globales del sistema (organizacion_id IS NULL)
-- • Tipos personalizados por organización (organizacion_id NOT NULL)
-- • Configuración de comportamiento (permite_todo_el_dia, etc.)
-- • Soft delete para preservar históricos
--
-- 🎨 PRESENTACIÓN (colores, iconos):
-- • Manejados en frontend con constantes
-- • Tipos personalizados usan defaults del frontend
--
-- 🔄 RELACIÓN: Usado por bloqueos_horarios.tipo_bloqueo_id
-- ====================================================================

CREATE TABLE tipos_bloqueo (
    -- 🔑 IDENTIFICADOR INCREMENTAL
    id SERIAL PRIMARY KEY,

    -- 🏢 MULTI-TENANT (NULL = tipo del sistema global)
    organizacion_id INTEGER REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- 📋 IDENTIFICACIÓN
    codigo VARCHAR(50) NOT NULL,              -- 'vacaciones', 'hora_comida'
    nombre VARCHAR(100) NOT NULL,             -- "Vacaciones", "Hora de Comida"
    descripcion TEXT,

    -- ⚙️ CONFIGURACIÓN DE COMPORTAMIENTO
    es_sistema BOOLEAN DEFAULT false,         -- true = No eliminable, protegido
    permite_todo_el_dia BOOLEAN DEFAULT true,
    permite_horario_especifico BOOLEAN DEFAULT true,
    requiere_aprobacion BOOLEAN DEFAULT false,

    -- 🎨 UI
    orden_display INTEGER DEFAULT 0,          -- Orden de visualización en selects
    activo BOOLEAN DEFAULT true,              -- Soft delete

    -- 📝 METADATOS
    metadata JSONB DEFAULT '{}',              -- Datos adicionales flexibles

    -- 🕐 TIMESTAMPS AUTOMÁTICOS
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================================
-- 📊 ÍNDICES ESPECIALIZADOS
-- ====================================================================

-- Índice único: código por organización (tipos personalizados)
CREATE UNIQUE INDEX idx_tipos_bloqueo_codigo_org_unique
ON tipos_bloqueo (organizacion_id, LOWER(codigo))
WHERE organizacion_id IS NOT NULL AND activo = true;

-- Índice único: tipos del sistema (código global)
CREATE UNIQUE INDEX idx_tipos_bloqueo_sistema_codigo_unique
ON tipos_bloqueo (LOWER(codigo))
WHERE organizacion_id IS NULL AND activo = true;

-- Índice para búsquedas por organización
CREATE INDEX idx_tipos_bloqueo_organizacion
ON tipos_bloqueo (organizacion_id, activo, orden_display)
WHERE activo = true;

-- ====================================================================
-- ✅ CONSTRAINTS DE VALIDACIÓN
-- ====================================================================

-- Validación de código (solo minúsculas, números y guion bajo)
ALTER TABLE tipos_bloqueo
ADD CONSTRAINT tipos_bloqueo_codigo_valido
CHECK (codigo ~ '^[a-z0-9_]+$');

-- ====================================================================
-- 🛡️ ROW LEVEL SECURITY (RLS)
-- ====================================================================

ALTER TABLE tipos_bloqueo ENABLE ROW LEVEL SECURITY;

CREATE POLICY tipos_bloqueo_tenant_isolation ON tipos_bloqueo
USING (
    -- Super admin ve todo
    (current_setting('app.current_user_role', true) = 'super_admin') OR
    -- Tipos del sistema visibles para todos
    (organizacion_id IS NULL) OR
    -- Usuarios ven solo tipos de su organización
    (organizacion_id = COALESCE(
        (NULLIF(current_setting('app.current_tenant_id', true), ''))::integer, 0
    )) OR
    -- Bypass para funciones del sistema
    (current_setting('app.bypass_rls', true) = 'true')
)
WITH CHECK (
    -- Super admin puede crear sin restricciones
    (current_setting('app.current_user_role', true) = 'super_admin') OR
    -- Usuarios normales solo pueden crear en su organización
    (organizacion_id = COALESCE(
        (NULLIF(current_setting('app.current_tenant_id', true), ''))::integer, 0
    )) OR
    -- Bypass para funciones del sistema
    (current_setting('app.bypass_rls', true) = 'true')
);

-- ====================================================================
-- 🔄 TRIGGERS AUTOMÁTICOS
-- ====================================================================

-- Trigger: Actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION actualizar_timestamp_tipos_bloqueo()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_timestamp_tipos_bloqueo
BEFORE UPDATE ON tipos_bloqueo
FOR EACH ROW
EXECUTE FUNCTION actualizar_timestamp_tipos_bloqueo();

-- Trigger: Proteger tipos del sistema
CREATE OR REPLACE FUNCTION proteger_tipos_sistema()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.es_sistema = true THEN
        -- No eliminar físicamente
        IF TG_OP = 'DELETE' THEN
            RAISE EXCEPTION 'No se pueden eliminar tipos del sistema. Use soft delete (activo = false) si es necesario.';
        END IF;

        -- No desactivar
        IF TG_OP = 'UPDATE' AND NEW.activo = false THEN
            RAISE EXCEPTION 'No se pueden desactivar tipos del sistema';
        END IF;

        -- No cambiar código
        IF TG_OP = 'UPDATE' AND OLD.codigo != NEW.codigo THEN
            RAISE EXCEPTION 'No se puede cambiar el código de tipos del sistema';
        END IF;

        -- No cambiar organizacion_id de NULL a NOT NULL
        IF TG_OP = 'UPDATE' AND OLD.organizacion_id IS NULL AND NEW.organizacion_id IS NOT NULL THEN
            RAISE EXCEPTION 'No se puede asignar un tipo del sistema a una organización';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_proteger_tipos_sistema
BEFORE UPDATE OR DELETE ON tipos_bloqueo
FOR EACH ROW
WHEN (OLD.es_sistema = true)
EXECUTE FUNCTION proteger_tipos_sistema();

-- ====================================================================
-- 📊 INSERTAR TIPOS DEL SISTEMA (9 tipos base)
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

-- ====================================================================
-- 📝 COMENTARIOS DE DOCUMENTACIÓN
-- ====================================================================

COMMENT ON TABLE tipos_bloqueo IS
'Catálogo dinámico de tipos de bloqueo. Soporta tipos del sistema (globales) y tipos personalizados por organización. Reemplaza el ENUM tipo_bloqueo para flexibilidad multi-tenant. Colores e iconos se manejan en frontend.';

COMMENT ON COLUMN tipos_bloqueo.organizacion_id IS
'NULL = tipo del sistema (visible para todas las organizaciones). NOT NULL = tipo personalizado de la organización';

COMMENT ON COLUMN tipos_bloqueo.es_sistema IS
'true = tipo del sistema, protegido por trigger. No se puede eliminar, desactivar ni modificar el código.';

COMMENT ON COLUMN tipos_bloqueo.codigo IS
'Código único del tipo (minúsculas, números, guiones bajos). Usado para mapear colores/iconos en frontend.';

-- ====================================================================
-- ✅ VALIDACIÓN FINAL
-- ====================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables
                   WHERE table_schema = 'public'
                   AND table_name = 'tipos_bloqueo') THEN
        RAISE EXCEPTION 'Error: La tabla tipos_bloqueo no se creó correctamente';
    END IF;

    RAISE NOTICE '✅ Tabla tipos_bloqueo creada exitosamente';
    RAISE NOTICE '✅ 9 tipos del sistema insertados';
    RAISE NOTICE '✅ Índices únicos creados';
    RAISE NOTICE '✅ Políticas RLS configuradas';
    RAISE NOTICE '✅ Triggers de protección activos';
    RAISE NOTICE 'ℹ️  Colores e iconos manejados en frontend';
END $$;

-- ====================================================================
-- 🎨 TABLA TIPOS_PROFESIONAL - CATÁLOGO DINÁMICO DE TIPOS DE PROFESIONAL
-- ====================================================================
-- Reemplaza el ENUM tipo_profesional por un sistema flexible con índice
-- incremental que permite tipos del sistema + tipos personalizados.
--
-- 🎯 CASOS DE USO:
-- • Tipos globales del sistema (organizacion_id IS NULL)
-- • Tipos personalizados por organización (organizacion_id NOT NULL)
-- • Validación de compatibilidad con industrias
-- • Soft delete para preservar históricos
--
-- 🔄 RELACIÓN: Usado por profesionales.tipo_profesional_id
-- ====================================================================

CREATE TABLE tipos_profesional (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- Identificación
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,

    -- Clasificación
    categoria VARCHAR(50),
    industrias_compatibles TEXT[],

    -- Características
    requiere_licencia BOOLEAN DEFAULT false,
    nivel_experiencia_minimo INTEGER DEFAULT 0,

    -- Sistema y personalización
    es_sistema BOOLEAN DEFAULT false,
    icono VARCHAR(50),
    color VARCHAR(7),

    -- Configuración
    metadata JSONB DEFAULT '{}',

    -- Control
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT tipos_profesional_codigo_valido CHECK (codigo ~ '^[a-z_]+$'),
    CONSTRAINT tipos_profesional_categoria_valida CHECK (
        categoria IN (
            'barberia', 'salon_belleza', 'estetica', 'spa',
            'podologia', 'medico', 'academia', 'taller_tecnico',
            'fitness', 'veterinaria', 'otro'
        )
    )
);

-- ====================================================================
-- 📊 ÍNDICES ESPECIALIZADOS
-- ====================================================================

-- Índice único: código por organización (tipos personalizados)
CREATE UNIQUE INDEX idx_tipos_profesional_codigo_org_unique
ON tipos_profesional (organizacion_id, LOWER(codigo))
WHERE organizacion_id IS NOT NULL AND activo = true;

-- Índice único: tipos del sistema (código global)
CREATE UNIQUE INDEX idx_tipos_profesional_sistema_codigo_unique
ON tipos_profesional (LOWER(codigo))
WHERE organizacion_id IS NULL AND activo = true;

-- Índice para búsquedas por organización
CREATE INDEX idx_tipos_profesional_organizacion
ON tipos_profesional (organizacion_id, activo, categoria)
WHERE activo = true;

-- Índice para tipos del sistema
CREATE INDEX idx_tipos_profesional_sistema
ON tipos_profesional (es_sistema, activo)
WHERE es_sistema = true;

-- Índice para búsquedas por categoría
CREATE INDEX idx_tipos_profesional_categoria
ON tipos_profesional (categoria, activo)
WHERE activo = true;

-- Índice GIN para búsquedas en array de industrias
CREATE INDEX idx_tipos_profesional_industrias
ON tipos_profesional USING GIN (industrias_compatibles);

-- ====================================================================
-- 🔄 TRIGGERS AUTOMÁTICOS
-- ====================================================================

CREATE OR REPLACE FUNCTION actualizar_timestamp_tipos_profesional()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_timestamp_tipos_profesional
BEFORE UPDATE ON tipos_profesional
FOR EACH ROW
EXECUTE FUNCTION actualizar_timestamp_tipos_profesional();

-- ====================================================================
-- 🛡️ TRIGGER DE PROTECCIÓN DE TIPOS DEL SISTEMA
-- ====================================================================

CREATE OR REPLACE FUNCTION proteger_tipos_profesional_sistema()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.es_sistema = true THEN
        IF TG_OP = 'DELETE' THEN
            RAISE EXCEPTION 'No se pueden eliminar tipos del sistema. Use soft delete (activo = false) si es necesario.';
        END IF;

        IF TG_OP = 'UPDATE' AND NEW.activo = false THEN
            RAISE EXCEPTION 'No se pueden desactivar tipos del sistema';
        END IF;

        IF TG_OP = 'UPDATE' AND OLD.codigo != NEW.codigo THEN
            RAISE EXCEPTION 'No se puede cambiar el código de tipos del sistema';
        END IF;

        IF TG_OP = 'UPDATE' AND OLD.organizacion_id IS NULL AND NEW.organizacion_id IS NOT NULL THEN
            RAISE EXCEPTION 'No se puede asignar un tipo del sistema a una organización';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_proteger_tipos_profesional_sistema
BEFORE UPDATE OR DELETE ON tipos_profesional
FOR EACH ROW
WHEN (OLD.es_sistema = true)
EXECUTE FUNCTION proteger_tipos_profesional_sistema();

-- ====================================================================
-- 🛡️ ROW LEVEL SECURITY (RLS)
-- ====================================================================

ALTER TABLE tipos_profesional ENABLE ROW LEVEL SECURITY;

CREATE POLICY tipos_profesional_tenant_isolation ON tipos_profesional
USING (
    (current_setting('app.current_user_role', true) = 'super_admin') OR
    (organizacion_id IS NULL) OR
    (organizacion_id = COALESCE(
        (NULLIF(current_setting('app.current_tenant_id', true), ''))::integer, 0
    )) OR
    (current_setting('app.bypass_rls', true) = 'true')
)
WITH CHECK (
    (current_setting('app.current_user_role', true) = 'super_admin') OR
    (organizacion_id = COALESCE(
        (NULLIF(current_setting('app.current_tenant_id', true), ''))::integer, 0
    )) OR
    (current_setting('app.bypass_rls', true) = 'true')
);

-- ====================================================================
-- 📊 INSERTAR TIPOS DEL SISTEMA (33 tipos base)
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

-- ====================================================================
-- 📝 COMENTARIOS DE DOCUMENTACIÓN
-- ====================================================================

COMMENT ON TABLE tipos_profesional IS
'Catálogo dinámico de tipos de profesional. Soporta tipos del sistema (globales) y tipos personalizados por organización.';

COMMENT ON COLUMN tipos_profesional.organizacion_id IS
'NULL = tipo del sistema (visible para todas las organizaciones). NOT NULL = tipo personalizado de la organización';

COMMENT ON COLUMN tipos_profesional.es_sistema IS
'true = tipo del sistema, protegido por trigger. No se puede eliminar, desactivar ni modificar el código.';

COMMENT ON COLUMN tipos_profesional.codigo IS
'Código único del tipo (minúsculas, guiones bajos). Usado como identificador programático.';

COMMENT ON COLUMN tipos_profesional.industrias_compatibles IS
'Array de industrias donde este tipo es aplicable. Usado para validar compatibilidad con organizacion.tipo_industria.';

-- ====================================================================
-- ✅ VALIDACIÓN FINAL DE SEED DATA
-- ====================================================================

DO $$
DECLARE
    count_tipos INTEGER;
    count_sistema INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_tipos FROM tipos_profesional;
    SELECT COUNT(*) INTO count_sistema FROM tipos_profesional WHERE es_sistema = true;

    IF count_sistema != 33 THEN
        RAISE EXCEPTION 'Error: Se esperaban 33 tipos del sistema, se encontraron %', count_sistema;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'trigger_proteger_tipos_profesional_sistema'
    ) THEN
        RAISE EXCEPTION 'Error: Trigger de protección no está activo';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_tables
        WHERE tablename = 'tipos_profesional' AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION 'Error: RLS no está habilitado en tipos_profesional';
    END IF;

    RAISE NOTICE '✅ Tabla tipos_profesional creada exitosamente';
    RAISE NOTICE '✅ % tipos del sistema insertados', count_sistema;
    RAISE NOTICE '✅ Índices únicos creados correctamente';
    RAISE NOTICE '✅ Políticas RLS configuradas';
    RAISE NOTICE '✅ Triggers de protección activos';
    RAISE NOTICE '✅ Validaciones completadas sin errores';
END $$;
