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
