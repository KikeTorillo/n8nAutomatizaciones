-- ====================================================================
-- MÓDULO ORGANIZACIÓN: TABLAS DE ESTRUCTURA ORGANIZACIONAL
-- ====================================================================
-- Sistema de gestión de estructura organizacional para empleados.
-- Incluye departamentos, puestos y categorías de profesionales.
--
-- CONTENIDO:
-- • departamentos - Áreas/departamentos de la organización
-- • puestos - Puestos de trabajo
-- • categorias_profesional - Categorías flexibles (especialidad, nivel, etc.)
-- • profesionales_categorias - Relación M:N profesionales ↔ categorías
--
-- DEPENDENCIAS:
-- • Módulo nucleo: organizaciones
-- • Módulo negocio: profesionales (FK diferida)
--
-- Fecha: Diciembre 2025
-- ====================================================================

-- ====================================================================
-- 🏢 TABLA: departamentos
-- ====================================================================
-- Áreas o departamentos de la organización.
-- Soporta jerarquía (departamento padre).
-- ====================================================================
CREATE TABLE departamentos (
    -- 🔑 IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- 📋 INFORMACIÓN BÁSICA
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    codigo VARCHAR(20),                       -- Código interno (RRHH, VEN, ADM)

    -- 🌳 JERARQUÍA
    parent_id INTEGER REFERENCES departamentos(id) ON DELETE SET NULL,

    -- 👤 RESPONSABLE
    -- NOTA: FK a profesionales se agrega después de crear profesionales extendido
    gerente_id INTEGER,

    -- ⚙️ CONFIGURACIÓN
    activo BOOLEAN DEFAULT true,

    -- 📅 TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ CONSTRAINTS
    CONSTRAINT uk_departamentos_nombre_org UNIQUE (organizacion_id, nombre),
    CONSTRAINT uk_departamentos_codigo_org UNIQUE (organizacion_id, codigo)
);

-- Índices
CREATE INDEX idx_departamentos_org ON departamentos(organizacion_id);
CREATE INDEX idx_departamentos_parent ON departamentos(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_departamentos_activo ON departamentos(organizacion_id) WHERE activo = true;

-- Comentarios
COMMENT ON TABLE departamentos IS 'Departamentos/áreas de la organización. Soporta jerarquía via parent_id.';
COMMENT ON COLUMN departamentos.parent_id IS 'Departamento padre para estructura jerárquica. NULL = departamento raíz.';
COMMENT ON COLUMN departamentos.gerente_id IS 'Profesional responsable del departamento. FK a profesionales.';

-- ====================================================================
-- 💼 TABLA: puestos
-- ====================================================================
-- Puestos de trabajo dentro de la organización.
-- Puede estar asociado a un departamento.
-- ====================================================================
CREATE TABLE puestos (
    -- 🔑 IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- 📋 INFORMACIÓN BÁSICA
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    codigo VARCHAR(20),                       -- Código interno (GER-VEN, AUX-ADM)

    -- 🏢 RELACIÓN CON DEPARTAMENTO
    departamento_id INTEGER REFERENCES departamentos(id) ON DELETE SET NULL,

    -- 💰 COMPENSACIÓN SUGERIDA
    salario_minimo DECIMAL(10,2),
    salario_maximo DECIMAL(10,2),

    -- ⚙️ CONFIGURACIÓN
    activo BOOLEAN DEFAULT true,

    -- 📅 TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ CONSTRAINTS
    CONSTRAINT uk_puestos_nombre_org UNIQUE (organizacion_id, nombre),
    CONSTRAINT uk_puestos_codigo_org UNIQUE (organizacion_id, codigo),
    CONSTRAINT chk_puestos_salario CHECK (
        salario_minimo IS NULL OR salario_maximo IS NULL OR salario_minimo <= salario_maximo
    )
);

-- Índices
CREATE INDEX idx_puestos_org ON puestos(organizacion_id);
CREATE INDEX idx_puestos_departamento ON puestos(departamento_id) WHERE departamento_id IS NOT NULL;
CREATE INDEX idx_puestos_activo ON puestos(organizacion_id) WHERE activo = true;

-- Comentarios
COMMENT ON TABLE puestos IS 'Puestos de trabajo de la organización. Pueden asociarse a departamentos.';
COMMENT ON COLUMN puestos.salario_minimo IS 'Salario mínimo sugerido para este puesto.';
COMMENT ON COLUMN puestos.salario_maximo IS 'Salario máximo sugerido para este puesto.';

-- ====================================================================
-- 🏷️ TABLA: categorias_profesional
-- ====================================================================
-- Sistema flexible de categorías para profesionales.
-- Reemplaza el concepto rígido de "tipos_profesional".
-- Cada organización crea sus propias categorías sin datos del sistema.
--
-- TIPOS DE CATEGORÍA:
-- • especialidad: Barbero, Estilista, Masajista, Doctor
-- • nivel: Junior, Senior, Master, Trainee
-- • area: Recepción, Servicios, Administración
-- • certificacion: Certificado Loreal, Diplomado X
-- • general: Cualquier otra clasificación
-- ====================================================================
CREATE TABLE categorias_profesional (
    -- 🔑 IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- 📋 INFORMACIÓN BÁSICA
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,

    -- 🏷️ TIPO DE CATEGORÍA (para agrupar en UI)
    tipo_categoria VARCHAR(20) NOT NULL DEFAULT 'general',

    -- 🎨 APARIENCIA
    color VARCHAR(7) DEFAULT '#753572',       -- Color hex (marca Nexo por default)
    icono VARCHAR(50),                        -- Nombre del icono (lucide)

    -- ⚙️ CONFIGURACIÓN
    orden INTEGER DEFAULT 0,                  -- Orden de visualización en UI
    activo BOOLEAN DEFAULT true,

    -- 📅 TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ CONSTRAINTS
    CONSTRAINT uk_categorias_nombre_org UNIQUE (organizacion_id, nombre),
    CONSTRAINT chk_tipo_categoria CHECK (
        tipo_categoria IN ('especialidad', 'nivel', 'area', 'certificacion', 'general')
    ),
    CONSTRAINT chk_categorias_color CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

-- Índices
CREATE INDEX idx_categorias_org ON categorias_profesional(organizacion_id);
CREATE INDEX idx_categorias_org_tipo ON categorias_profesional(organizacion_id, tipo_categoria);
CREATE INDEX idx_categorias_activo ON categorias_profesional(organizacion_id) WHERE activo = true;

-- Comentarios
COMMENT ON TABLE categorias_profesional IS
'Categorías flexibles por organización. Cada org crea sus propias categorías.
No hay datos del sistema. Tipos: especialidad, nivel, area, certificacion, general.';

COMMENT ON COLUMN categorias_profesional.tipo_categoria IS
'Tipo de categoría para agrupar en UI:
- especialidad: Barbero, Estilista, Masajista
- nivel: Junior, Senior, Master
- area: Recepción, Servicios
- certificacion: Certificado Andis, Diplomado X
- general: Cualquier otra';

-- ====================================================================
-- 🔗 TABLA: profesionales_categorias
-- ====================================================================
-- Relación M:N entre profesionales y categorías.
-- Un profesional puede tener múltiples categorías.
-- ====================================================================
CREATE TABLE profesionales_categorias (
    -- 🔑 CLAVES
    profesional_id INTEGER NOT NULL,          -- FK a profesionales (se agrega después)
    categoria_id INTEGER NOT NULL REFERENCES categorias_profesional(id) ON DELETE CASCADE,

    -- 📅 METADATA
    fecha_asignacion DATE DEFAULT CURRENT_DATE,
    notas TEXT,                               -- Notas opcionales (ej: "Certificado en 2024")

    -- ✅ PRIMARY KEY COMPUESTA
    PRIMARY KEY (profesional_id, categoria_id)
);

-- Índices
CREATE INDEX idx_prof_cat_profesional ON profesionales_categorias(profesional_id);
CREATE INDEX idx_prof_cat_categoria ON profesionales_categorias(categoria_id);

-- Comentarios
COMMENT ON TABLE profesionales_categorias IS
'Relación M:N entre profesionales y categorías. Un profesional puede tener múltiples categorías.';

COMMENT ON COLUMN profesionales_categorias.fecha_asignacion IS
'Fecha en que se asignó la categoría al profesional.';
