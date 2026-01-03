-- ====================================================================
-- MÓDULO PROFESIONALES: CURRÍCULUM Y HABILIDADES
-- ====================================================================
-- Fase 4 del Plan de Empleados Competitivo - Enero 2026
-- Gestión de experiencia laboral, educación formal y habilidades
--
-- Dependencias: profesionales (01-tablas.sql), organizaciones, usuarios
-- ====================================================================

-- ====================================================================
-- 📋 ENUMS
-- ====================================================================

-- Niveles de educación formal
DO $$ BEGIN
    CREATE TYPE nivel_educacion AS ENUM (
        'basica',
        'intermedia',
        'preparatoria',
        'tecnica',
        'licenciatura',
        'especialidad',
        'maestria',
        'doctorado'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Categorías de habilidades
DO $$ BEGIN
    CREATE TYPE categoria_habilidad AS ENUM (
        'tecnica',
        'blanda',
        'idioma',
        'herramienta',
        'sector'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Niveles de dominio de habilidad
DO $$ BEGIN
    CREATE TYPE nivel_habilidad AS ENUM (
        'basico',
        'intermedio',
        'avanzado',
        'experto'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ====================================================================
-- 💼 TABLA: EXPERIENCIA_LABORAL
-- ====================================================================
-- Historial de empleos anteriores del profesional
-- ====================================================================
CREATE TABLE IF NOT EXISTS experiencia_laboral (
    -- 🔑 CLAVE PRIMARIA
    id SERIAL PRIMARY KEY,

    -- 🏢 RELACIÓN MULTI-TENANT
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    profesional_id INTEGER NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE,

    -- 💼 DATOS DEL EMPLEO
    empresa VARCHAR(200) NOT NULL,                  -- Nombre de la empresa
    puesto VARCHAR(150) NOT NULL,                   -- Cargo desempeñado
    descripcion TEXT,                               -- Responsabilidades y logros

    -- 📍 UBICACIÓN
    ubicacion VARCHAR(200),                         -- Ciudad/País

    -- 📅 PERÍODO
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,                                 -- NULL si es empleo actual
    es_empleo_actual BOOLEAN DEFAULT false,

    -- 📋 INFORMACIÓN ADICIONAL
    sector_industria VARCHAR(100),                  -- Sector/industria
    tamanio_empresa VARCHAR(50),                    -- Pequeña, Mediana, Grande
    motivo_salida VARCHAR(200),                     -- Razón de término
    contacto_referencia VARCHAR(200),               -- Contacto para referencias
    telefono_referencia VARCHAR(30),

    -- 🔢 ORDEN DE VISUALIZACIÓN
    orden INTEGER DEFAULT 0,                        -- Para reordenamiento manual

    -- 🗑️ SOFT DELETE Y AUDITORÍA
    activo BOOLEAN DEFAULT true,
    eliminado_en TIMESTAMPTZ DEFAULT NULL,
    eliminado_por INTEGER REFERENCES usuarios(id),
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    creado_por INTEGER REFERENCES usuarios(id),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_por INTEGER REFERENCES usuarios(id),

    -- ✅ CONSTRAINTS
    CONSTRAINT chk_exp_fechas CHECK (fecha_fin IS NULL OR fecha_inicio <= fecha_fin),
    CONSTRAINT chk_exp_actual CHECK (
        (es_empleo_actual = true AND fecha_fin IS NULL) OR
        (es_empleo_actual = false)
    ),
    CONSTRAINT chk_exp_empresa CHECK (length(empresa) >= 2),
    CONSTRAINT chk_exp_puesto CHECK (length(puesto) >= 2)
);

-- ====================================================================
-- 🎓 TABLA: EDUCACION_FORMAL
-- ====================================================================
-- Estudios y formación académica del profesional
-- ====================================================================
CREATE TABLE IF NOT EXISTS educacion_formal (
    -- 🔑 CLAVE PRIMARIA
    id SERIAL PRIMARY KEY,

    -- 🏢 RELACIÓN MULTI-TENANT
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    profesional_id INTEGER NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE,

    -- 🎓 DATOS ACADÉMICOS
    institucion VARCHAR(200) NOT NULL,              -- Nombre de la institución
    titulo VARCHAR(200) NOT NULL,                   -- Título obtenido o en curso
    nivel nivel_educacion NOT NULL,                 -- Nivel educativo (ENUM)
    campo_estudio VARCHAR(150),                     -- Área de especialización

    -- 📅 PERÍODO
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,                                 -- NULL si está en curso
    en_curso BOOLEAN DEFAULT false,

    -- 📋 INFORMACIÓN ADICIONAL
    descripcion TEXT,                               -- Descripción adicional
    promedio VARCHAR(10),                           -- Promedio/calificación
    numero_cedula VARCHAR(50),                      -- Cédula profesional (México)
    ubicacion VARCHAR(200),                         -- Ciudad/País de la institución

    -- 🔢 ORDEN DE VISUALIZACIÓN
    orden INTEGER DEFAULT 0,                        -- Para reordenamiento manual

    -- 🗑️ SOFT DELETE Y AUDITORÍA
    activo BOOLEAN DEFAULT true,
    eliminado_en TIMESTAMPTZ DEFAULT NULL,
    eliminado_por INTEGER REFERENCES usuarios(id),
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    creado_por INTEGER REFERENCES usuarios(id),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_por INTEGER REFERENCES usuarios(id),

    -- ✅ CONSTRAINTS
    CONSTRAINT chk_edu_fechas CHECK (fecha_fin IS NULL OR fecha_inicio <= fecha_fin),
    CONSTRAINT chk_edu_en_curso CHECK (
        (en_curso = true AND fecha_fin IS NULL) OR
        (en_curso = false)
    ),
    CONSTRAINT chk_edu_institucion CHECK (length(institucion) >= 2),
    CONSTRAINT chk_edu_titulo CHECK (length(titulo) >= 2)
);

-- ====================================================================
-- 📚 TABLA: CATALOGO_HABILIDADES
-- ====================================================================
-- Catálogo maestro de habilidades por organización
-- ====================================================================
CREATE TABLE IF NOT EXISTS catalogo_habilidades (
    -- 🔑 CLAVE PRIMARIA
    id SERIAL PRIMARY KEY,

    -- 🏢 RELACIÓN MULTI-TENANT
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- 📚 DATOS DE LA HABILIDAD
    nombre VARCHAR(100) NOT NULL,                   -- Nombre de la habilidad
    categoria categoria_habilidad NOT NULL,         -- Categoría (ENUM)
    descripcion TEXT,                               -- Descripción detallada

    -- ⚙️ CONFIGURACIÓN
    icono VARCHAR(50),                              -- Icono opcional (emoji o clase CSS)
    color VARCHAR(20),                              -- Color para UI

    -- 🗑️ SOFT DELETE Y AUDITORÍA
    activo BOOLEAN DEFAULT true,
    eliminado_en TIMESTAMPTZ DEFAULT NULL,
    eliminado_por INTEGER REFERENCES usuarios(id),
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    creado_por INTEGER REFERENCES usuarios(id),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_por INTEGER REFERENCES usuarios(id),

    -- ✅ CONSTRAINTS
    CONSTRAINT chk_cat_hab_nombre CHECK (length(nombre) >= 2),
    CONSTRAINT uq_catalogo_hab_org_nombre UNIQUE (organizacion_id, nombre)
);

-- ====================================================================
-- 🏅 TABLA: HABILIDADES_EMPLEADO
-- ====================================================================
-- Relación M:N entre profesionales y habilidades con nivel
-- ====================================================================
CREATE TABLE IF NOT EXISTS habilidades_empleado (
    -- 🔑 CLAVE PRIMARIA
    id SERIAL PRIMARY KEY,

    -- 🏢 RELACIÓN MULTI-TENANT
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    profesional_id INTEGER NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE,
    habilidad_id INTEGER NOT NULL REFERENCES catalogo_habilidades(id) ON DELETE CASCADE,

    -- 🏅 DATOS DE LA HABILIDAD DEL EMPLEADO
    nivel nivel_habilidad NOT NULL DEFAULT 'basico',  -- Nivel de dominio (ENUM)
    anios_experiencia DECIMAL(4,1) DEFAULT 0,         -- Años de experiencia

    -- ✓ VERIFICACIÓN
    verificado BOOLEAN DEFAULT false,                 -- Verificado por admin/RRHH
    verificado_por INTEGER REFERENCES usuarios(id),
    fecha_verificacion TIMESTAMPTZ,

    -- 📋 NOTAS
    notas TEXT,                                       -- Notas adicionales
    certificaciones TEXT,                             -- Certificaciones relacionadas

    -- 🗑️ SOFT DELETE Y AUDITORÍA
    activo BOOLEAN DEFAULT true,
    eliminado_en TIMESTAMPTZ DEFAULT NULL,
    eliminado_por INTEGER REFERENCES usuarios(id),
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    creado_por INTEGER REFERENCES usuarios(id),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_por INTEGER REFERENCES usuarios(id),

    -- ✅ CONSTRAINTS
    CONSTRAINT chk_hab_emp_anios CHECK (anios_experiencia >= 0),
    CONSTRAINT uq_habilidad_empleado UNIQUE (organizacion_id, profesional_id, habilidad_id)
);

-- ====================================================================
-- 📇 ÍNDICES ESPECIALIZADOS
-- ====================================================================

-- Experiencia Laboral
CREATE INDEX IF NOT EXISTS idx_experiencia_org_prof
    ON experiencia_laboral(organizacion_id, profesional_id)
    WHERE eliminado_en IS NULL;

CREATE INDEX IF NOT EXISTS idx_experiencia_actual
    ON experiencia_laboral(organizacion_id, profesional_id, es_empleo_actual)
    WHERE eliminado_en IS NULL AND es_empleo_actual = true;

CREATE INDEX IF NOT EXISTS idx_experiencia_orden
    ON experiencia_laboral(organizacion_id, profesional_id, orden)
    WHERE eliminado_en IS NULL;

-- Educación Formal
CREATE INDEX IF NOT EXISTS idx_educacion_org_prof
    ON educacion_formal(organizacion_id, profesional_id)
    WHERE eliminado_en IS NULL;

CREATE INDEX IF NOT EXISTS idx_educacion_nivel
    ON educacion_formal(organizacion_id, nivel)
    WHERE eliminado_en IS NULL;

CREATE INDEX IF NOT EXISTS idx_educacion_orden
    ON educacion_formal(organizacion_id, profesional_id, orden)
    WHERE eliminado_en IS NULL;

-- Catálogo Habilidades
CREATE INDEX IF NOT EXISTS idx_catalogo_hab_org
    ON catalogo_habilidades(organizacion_id)
    WHERE eliminado_en IS NULL;

CREATE INDEX IF NOT EXISTS idx_catalogo_hab_categoria
    ON catalogo_habilidades(organizacion_id, categoria)
    WHERE eliminado_en IS NULL;

-- Habilidades Empleado
CREATE INDEX IF NOT EXISTS idx_hab_emp_org_prof
    ON habilidades_empleado(organizacion_id, profesional_id)
    WHERE eliminado_en IS NULL;

CREATE INDEX IF NOT EXISTS idx_hab_emp_habilidad
    ON habilidades_empleado(organizacion_id, habilidad_id)
    WHERE eliminado_en IS NULL;

CREATE INDEX IF NOT EXISTS idx_hab_emp_nivel
    ON habilidades_empleado(organizacion_id, nivel)
    WHERE eliminado_en IS NULL;

CREATE INDEX IF NOT EXISTS idx_hab_emp_verificado
    ON habilidades_empleado(organizacion_id, verificado)
    WHERE eliminado_en IS NULL AND verificado = true;

-- ====================================================================
-- 🔒 ROW LEVEL SECURITY
-- ====================================================================

-- Experiencia Laboral
ALTER TABLE experiencia_laboral ENABLE ROW LEVEL SECURITY;

CREATE POLICY experiencia_laboral_tenant_policy ON experiencia_laboral
    USING (
        organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::integer, 0)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- Educación Formal
ALTER TABLE educacion_formal ENABLE ROW LEVEL SECURITY;

CREATE POLICY educacion_formal_tenant_policy ON educacion_formal
    USING (
        organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::integer, 0)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- Catálogo Habilidades
ALTER TABLE catalogo_habilidades ENABLE ROW LEVEL SECURITY;

CREATE POLICY catalogo_habilidades_tenant_policy ON catalogo_habilidades
    USING (
        organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::integer, 0)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- Habilidades Empleado
ALTER TABLE habilidades_empleado ENABLE ROW LEVEL SECURITY;

CREATE POLICY habilidades_empleado_tenant_policy ON habilidades_empleado
    USING (
        organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::integer, 0)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- ====================================================================
-- 🔄 TRIGGERS
-- ====================================================================

-- Trigger para actualizar timestamp en experiencia_laboral
CREATE TRIGGER trg_experiencia_laboral_actualizado
    BEFORE UPDATE ON experiencia_laboral
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

-- Trigger para actualizar timestamp en educacion_formal
CREATE TRIGGER trg_educacion_formal_actualizado
    BEFORE UPDATE ON educacion_formal
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

-- Trigger para actualizar timestamp en catalogo_habilidades
CREATE TRIGGER trg_catalogo_habilidades_actualizado
    BEFORE UPDATE ON catalogo_habilidades
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

-- Trigger para actualizar timestamp en habilidades_empleado
CREATE TRIGGER trg_habilidades_empleado_actualizado
    BEFORE UPDATE ON habilidades_empleado
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

-- ====================================================================
-- 📝 COMENTARIOS
-- ====================================================================

COMMENT ON TABLE experiencia_laboral IS
'Historial de experiencia laboral de los profesionales.
Fase 4 del Plan de Empleados Competitivo (Enero 2026).
Soporta reordenamiento manual vía campo orden.';

COMMENT ON TABLE educacion_formal IS
'Historial de educación y formación académica de los profesionales.
Fase 4 del Plan de Empleados Competitivo (Enero 2026).
Niveles: básica, intermedia, preparatoria, técnica, licenciatura, especialidad, maestría, doctorado.';

COMMENT ON TABLE catalogo_habilidades IS
'Catálogo maestro de habilidades por organización.
Fase 4 del Plan de Empleados Competitivo (Enero 2026).
Categorías: técnica, blanda, idioma, herramienta, sector.';

COMMENT ON TABLE habilidades_empleado IS
'Relación M:N entre profesionales y habilidades del catálogo.
Fase 4 del Plan de Empleados Competitivo (Enero 2026).
Niveles: básico, intermedio, avanzado, experto. Soporta verificación por RRHH.';

COMMENT ON TYPE nivel_educacion IS 'Niveles de educación formal: básica hasta doctorado';
COMMENT ON TYPE categoria_habilidad IS 'Categorías de habilidades: técnica, blanda, idioma, herramienta, sector';
COMMENT ON TYPE nivel_habilidad IS 'Niveles de dominio: básico, intermedio, avanzado, experto';

COMMENT ON COLUMN experiencia_laboral.orden IS 'Orden de visualización para reordenamiento manual (drag-and-drop)';
COMMENT ON COLUMN educacion_formal.numero_cedula IS 'Cédula profesional (México) para títulos que la requieran';
COMMENT ON COLUMN habilidades_empleado.verificado IS 'Indica si la habilidad fue verificada por RRHH/admin';
