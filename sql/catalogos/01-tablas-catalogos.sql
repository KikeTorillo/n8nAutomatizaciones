-- ====================================================================
-- MÓDULO CATÁLOGOS: TABLAS DE CATÁLOGOS DINÁMICOS
-- ====================================================================
-- Catálogos que reemplazan ENUMs estáticos para flexibilidad multi-tenant.
-- Soportan tipos del sistema (globales) + tipos personalizados por organización.
--
-- Migrado de: sql/schema/04-catalog-tables.sql
-- Fecha migración: 16 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- TABLA 1: TIPOS_BLOQUEO
-- ====================================================================
-- Catálogo dinámico de tipos de bloqueo de horarios.
--
-- CARACTERÍSTICAS:
-- • Tipos del sistema (organizacion_id IS NULL) - 9 tipos base
-- • Tipos personalizados por organización
-- • Configuración de comportamiento (permite_todo_el_dia, etc.)
-- • Soft delete para preservar históricos
-- • Protección de tipos del sistema via trigger
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
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Validación de código (solo minúsculas, números y guion bajo)
    CONSTRAINT tipos_bloqueo_codigo_valido
    CHECK (codigo ~ '^[a-z0-9_]+$')
);

-- ====================================================================
-- TABLA 2: TIPOS_PROFESIONAL
-- ====================================================================
-- Catálogo dinámico de tipos de profesional.
--
-- CARACTERÍSTICAS:
-- • Tipos del sistema (organizacion_id IS NULL) - 33 tipos base
-- • Tipos personalizados por organización
-- • Validación de compatibilidad con industrias
-- • Soft delete para preservar históricos
-- • Protección de tipos del sistema via trigger
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
-- 📝 COMENTARIOS PARA DOCUMENTACIÓN
-- ====================================================================

COMMENT ON TABLE tipos_bloqueo IS
'Catálogo dinámico de tipos de bloqueo. Soporta tipos del sistema (globales) y tipos personalizados por organización. Reemplaza el ENUM tipo_bloqueo para flexibilidad multi-tenant. Colores e iconos se manejan en frontend.';

COMMENT ON COLUMN tipos_bloqueo.organizacion_id IS
'NULL = tipo del sistema (visible para todas las organizaciones). NOT NULL = tipo personalizado de la organización';

COMMENT ON COLUMN tipos_bloqueo.es_sistema IS
'true = tipo del sistema, protegido por trigger. No se puede eliminar, desactivar ni modificar el código.';

COMMENT ON COLUMN tipos_bloqueo.codigo IS
'Código único del tipo (minúsculas, números, guiones bajos). Usado para mapear colores/iconos en frontend.';

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
