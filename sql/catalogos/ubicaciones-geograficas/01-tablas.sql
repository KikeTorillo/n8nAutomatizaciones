-- ====================================================================
-- MÓDULO CATÁLOGOS: TABLAS DE UBICACIONES GEOGRÁFICAS
-- ====================================================================
-- Catálogos normalizados para ubicaciones geográficas de México.
-- Evita inconsistencias como "Veracruz" vs "veracrus" vs "VERACRUZ".
--
-- ESTRUCTURA JERÁRQUICA:
-- paises → estados → ciudades → codigos_postales
--
-- Fecha creación: 24 Noviembre 2025
-- Versión: 1.0.0
-- ====================================================================

-- ====================================================================
-- TABLA 1: PAISES
-- ====================================================================
-- Catálogo de países. Inicialmente solo México, extensible a futuro.
-- ====================================================================

CREATE TABLE paises (
    -- 🔑 IDENTIFICADOR
    id SERIAL PRIMARY KEY,

    -- 📋 IDENTIFICACIÓN
    codigo VARCHAR(3) NOT NULL UNIQUE,          -- ISO 3166-1 alpha-3: 'MEX'
    codigo_alfa2 VARCHAR(2) NOT NULL UNIQUE,    -- ISO 3166-1 alpha-2: 'MX'
    nombre VARCHAR(100) NOT NULL,               -- 'México'
    nombre_oficial VARCHAR(200),                -- 'Estados Unidos Mexicanos'

    -- 🌍 CONFIGURACIÓN REGIONAL
    codigo_telefonico VARCHAR(10),              -- '+52'
    moneda_codigo VARCHAR(3),                   -- 'MXN'
    zona_horaria_default VARCHAR(50),           -- 'America/Mexico_City'

    -- ⚙️ CONTROL
    activo BOOLEAN DEFAULT true,
    es_default BOOLEAN DEFAULT false,           -- País por defecto en formularios

    -- 🕐 TIMESTAMPS
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================================
-- TABLA 2: ESTADOS
-- ====================================================================
-- Catálogo de estados/entidades federativas de México (32 estados).
-- ====================================================================

CREATE TABLE estados (
    -- 🔑 IDENTIFICADOR
    id SERIAL PRIMARY KEY,

    -- 🔗 RELACIONES
    pais_id INTEGER NOT NULL REFERENCES paises(id) ON DELETE CASCADE,

    -- 📋 IDENTIFICACIÓN
    codigo VARCHAR(10) NOT NULL,                -- Clave INEGI: '30' (Veracruz)
    abreviatura VARCHAR(10),                    -- 'VER', 'JAL', 'CDMX'
    nombre VARCHAR(100) NOT NULL,               -- 'Veracruz de Ignacio de la Llave'
    nombre_corto VARCHAR(50),                   -- 'Veracruz'

    -- 🌍 CONFIGURACIÓN REGIONAL
    zona_horaria VARCHAR(50),                   -- 'America/Mexico_City'

    -- ⚙️ CONTROL
    activo BOOLEAN DEFAULT true,
    orden_display INTEGER DEFAULT 0,            -- Para ordenar en selects

    -- 🕐 TIMESTAMPS
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 🔒 CONSTRAINTS
    CONSTRAINT estados_codigo_pais_unique UNIQUE (pais_id, codigo),
    CONSTRAINT estados_nombre_pais_unique UNIQUE (pais_id, nombre)
);

-- ====================================================================
-- TABLA 3: CIUDADES (Municipios)
-- ====================================================================
-- Catálogo de ciudades/municipios de México.
-- Solo ciudades principales inicialmente, extensible según necesidad.
-- ====================================================================

CREATE TABLE ciudades (
    -- 🔑 IDENTIFICADOR
    id SERIAL PRIMARY KEY,

    -- 🔗 RELACIONES
    estado_id INTEGER NOT NULL REFERENCES estados(id) ON DELETE CASCADE,

    -- 📋 IDENTIFICACIÓN
    codigo VARCHAR(10),                         -- Clave INEGI del municipio
    nombre VARCHAR(100) NOT NULL,               -- 'Xalapa'
    nombre_completo VARCHAR(200),               -- 'Xalapa-Enríquez'

    -- 📍 UBICACIÓN
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),

    -- 🏙️ CLASIFICACIÓN
    es_capital BOOLEAN DEFAULT false,           -- Capital del estado
    poblacion INTEGER,                          -- Población aproximada
    tipo VARCHAR(20) DEFAULT 'ciudad',          -- 'ciudad', 'municipio', 'delegacion'

    -- ⚙️ CONTROL
    activo BOOLEAN DEFAULT true,
    es_principal BOOLEAN DEFAULT false,         -- Ciudades más importantes (para filtros)
    orden_display INTEGER DEFAULT 0,

    -- 🕐 TIMESTAMPS
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 🔒 CONSTRAINTS
    CONSTRAINT ciudades_nombre_estado_unique UNIQUE (estado_id, nombre)
);

-- ====================================================================
-- TABLA 4: CODIGOS_POSTALES
-- ====================================================================
-- Catálogo de códigos postales (opcional, para validación avanzada).
-- Se puede poblar incrementalmente según necesidad.
-- ====================================================================

CREATE TABLE codigos_postales (
    -- 🔑 IDENTIFICADOR
    id SERIAL PRIMARY KEY,

    -- 🔗 RELACIONES
    ciudad_id INTEGER REFERENCES ciudades(id) ON DELETE CASCADE,
    estado_id INTEGER NOT NULL REFERENCES estados(id) ON DELETE CASCADE,

    -- 📋 IDENTIFICACIÓN
    codigo VARCHAR(10) NOT NULL,                -- '91000'
    colonia VARCHAR(200),                       -- 'Centro'
    tipo_asentamiento VARCHAR(50),              -- 'Colonia', 'Fraccionamiento'

    -- ⚙️ CONTROL
    activo BOOLEAN DEFAULT true,

    -- 🕐 TIMESTAMPS
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 🔒 CONSTRAINTS
    CONSTRAINT cp_codigo_estado_unique UNIQUE (estado_id, codigo, colonia)
);

-- ====================================================================
-- ÍNDICES PARA BÚSQUEDAS EFICIENTES
-- ====================================================================

-- Índices para paises
CREATE INDEX idx_paises_codigo ON paises(codigo);
CREATE INDEX idx_paises_activo ON paises(activo) WHERE activo = true;

-- Índices para estados
CREATE INDEX idx_estados_pais ON estados(pais_id);
CREATE INDEX idx_estados_codigo ON estados(codigo);
CREATE INDEX idx_estados_nombre ON estados(nombre);
CREATE INDEX idx_estados_nombre_corto ON estados(nombre_corto);
CREATE INDEX idx_estados_activo ON estados(activo) WHERE activo = true;
CREATE INDEX idx_estados_busqueda ON estados USING gin(to_tsvector('spanish', nombre || ' ' || COALESCE(nombre_corto, '')));

-- Índices para ciudades
CREATE INDEX idx_ciudades_estado ON ciudades(estado_id);
CREATE INDEX idx_ciudades_nombre ON ciudades(nombre);
CREATE INDEX idx_ciudades_activo ON ciudades(activo) WHERE activo = true;
CREATE INDEX idx_ciudades_principales ON ciudades(es_principal) WHERE es_principal = true;
CREATE INDEX idx_ciudades_busqueda ON ciudades USING gin(to_tsvector('spanish', nombre || ' ' || COALESCE(nombre_completo, '')));

-- Índices para códigos postales
CREATE INDEX idx_cp_estado ON codigos_postales(estado_id);
CREATE INDEX idx_cp_ciudad ON codigos_postales(ciudad_id);
CREATE INDEX idx_cp_codigo ON codigos_postales(codigo);

-- ====================================================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- ====================================================================

COMMENT ON TABLE paises IS
'Catálogo de países. Inicialmente solo México, extensible a futuro para expansión regional.';

COMMENT ON TABLE estados IS
'Catálogo de estados/entidades federativas. Los 32 estados de México con claves INEGI oficiales.';

COMMENT ON TABLE ciudades IS
'Catálogo de ciudades/municipios. Ciudades principales inicialmente, extensible según demanda.';

COMMENT ON TABLE codigos_postales IS
'Catálogo de códigos postales (opcional). Se puede poblar incrementalmente para validación avanzada.';

COMMENT ON COLUMN estados.codigo IS
'Clave INEGI oficial del estado (ej: 30 = Veracruz, 14 = Jalisco)';

COMMENT ON COLUMN ciudades.es_principal IS
'true = ciudad importante que aparece en filtros rápidos. Capitales y ciudades grandes.';
