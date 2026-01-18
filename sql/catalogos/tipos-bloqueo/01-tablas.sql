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
