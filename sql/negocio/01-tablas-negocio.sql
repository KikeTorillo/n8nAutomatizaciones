-- ====================================================================
-- MÓDULO NEGOCIO: TABLAS DE SERVICIOS
-- ====================================================================
-- Catálogo de servicios y relación con profesionales.
-- Refactorizado Dic 2025: profesionales y clientes movidos a sus módulos.
--
-- CONTENIDO:
-- • servicios - Catálogo de servicios por organización
-- • servicios_profesionales - Relación M:N con configuraciones
--
-- Dependencias: nucleo, profesionales
-- ====================================================================

-- ====================================================================
-- 🎯 TABLA SERVICIOS - CATÁLOGO PERSONALIZADO
-- ====================================================================
-- Catálogo de servicios específicos de cada organización con configuración
-- avanzada, compatibilidad con profesionales y control granular.
--
-- 🔧 CARACTERÍSTICAS TÉCNICAS:
-- • Configuración JSONB flexible por servicio
-- • Validaciones de precios y tiempos
-- • Control de activación granular
-- ====================================================================

CREATE TABLE servicios (
    -- 🔑 Identificación y relaciones
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- ====================================================================
    -- 📋 SECCIÓN: INFORMACIÓN BÁSICA DEL SERVICIO
    -- ====================================================================
    nombre VARCHAR(100) NOT NULL,              -- Nombre del servicio
    descripcion TEXT,                          -- Descripción detallada
    categoria VARCHAR(50),                     -- Categoría principal (ej: "corte", "tratamiento")
    subcategoria VARCHAR(50),                  -- Subcategoría específica (ej: "barba", "facial")

    -- ====================================================================
    -- ⏰ SECCIÓN: CONFIGURACIÓN DE TIEMPO Y PRECIO
    -- ====================================================================
    duracion_minutos INTEGER NOT NULL,         -- Duración base del servicio
    precio DECIMAL(10,2) NOT NULL,             -- Precio base del servicio
    precio_minimo DECIMAL(10,2),               -- Precio mínimo permitido
    precio_maximo DECIMAL(10,2),               -- Precio máximo permitido

    -- ====================================================================
    -- ⚙️ SECCIÓN: CONFIGURACIÓN AVANZADA
    -- ====================================================================
    requiere_preparacion_minutos INTEGER DEFAULT 0,      -- Tiempo preparación pre-servicio
    tiempo_limpieza_minutos INTEGER DEFAULT 5,           -- Tiempo limpieza post-servicio
    max_clientes_simultaneos INTEGER DEFAULT 1,          -- Máximo clientes simultáneos
    color_servicio VARCHAR(7) DEFAULT '#e74c3c',         -- Color para calendario

    -- ====================================================================
    -- 🏷️ SECCIÓN: METADATOS Y ORGANIZACIÓN
    -- ====================================================================
    configuracion_especifica JSONB DEFAULT '{}',         -- Config JSON específica
                                                         -- Ej: {"requiere_cita_previa": true, "productos_incluidos": ["shampoo"]}
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],                 -- Etiquetas para búsqueda y filtros
                                                         -- Ej: ["popular", "promocion", "nuevo"]

    -- 🖼️ IMAGEN (Dic 2025 - Storage MinIO)
    imagen_url TEXT,                                      -- URL de la imagen del servicio

    -- ====================================================================
    -- ⚙️ SECCIÓN: CONTROL Y ESTADO
    -- ====================================================================
    activo BOOLEAN DEFAULT TRUE,               -- Estado activo/inactivo

    -- ====================================================================
    -- 🗑️ SECCIÓN: SOFT DELETE (Dic 2025)
    -- ====================================================================
    eliminado_en TIMESTAMPTZ DEFAULT NULL,     -- NULL = activo, con valor = eliminado
    eliminado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,

    -- ====================================================================
    -- 🕒 SECCIÓN: TIMESTAMPS DE AUDITORÍA
    -- ====================================================================
    creado_en TIMESTAMPTZ DEFAULT NOW(),       -- Fecha de creación
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),  -- Fecha de última actualización

    -- ====================================================================
    -- ✅ SECCIÓN: VALIDACIONES DE INTEGRIDAD
    -- ====================================================================
    CONSTRAINT valid_duracion
        CHECK (duracion_minutos > 0 AND duracion_minutos <= 480),  -- Entre 1 minuto y 8 horas
    CONSTRAINT valid_precio
        CHECK (precio >= 0),
    CONSTRAINT valid_precio_minimo
        CHECK (precio_minimo IS NULL OR precio_minimo >= 0),
    CONSTRAINT valid_precio_maximo
        CHECK (precio_maximo IS NULL OR precio_maximo >= precio),
    CONSTRAINT valid_precio_rango
        CHECK (precio_minimo IS NULL OR precio_maximo IS NULL OR precio_minimo <= precio_maximo),
    CONSTRAINT valid_preparacion
        CHECK (requiere_preparacion_minutos >= 0 AND requiere_preparacion_minutos <= 120),
    CONSTRAINT valid_limpieza
        CHECK (tiempo_limpieza_minutos >= 0 AND tiempo_limpieza_minutos <= 60),
    CONSTRAINT valid_max_clientes
        CHECK (max_clientes_simultaneos > 0 AND max_clientes_simultaneos <= 20),
    CONSTRAINT valid_color_servicio
        CHECK (color_servicio ~ '^#[0-9A-Fa-f]{6}$'),  -- Formato hexadecimal válido

    -- 🔒 Constraint de unicidad por organización
    CONSTRAINT unique_servicio_por_org
        UNIQUE(organizacion_id, nombre)
);

-- ====================================================================
-- 🔗 TABLA SERVICIOS_PROFESIONALES - RELACIÓN MANY-TO-MANY
-- ====================================================================
-- Tabla de relación que define qué profesionales pueden brindar cada servicio
-- con configuraciones personalizadas por profesional.
--
-- 🎯 CASOS DE USO:
-- • Un barbero puede tener precio especial para corte VIP
-- • Un masajista senior puede cobrar más por el mismo servicio
-- • Servicios con duraciones personalizadas por profesional
-- ====================================================================

CREATE TABLE servicios_profesionales (
    -- 🔑 Identificación
    id SERIAL PRIMARY KEY,

    -- 🏢 RELACIÓN MULTI-TENANT (CRÍTICA)
    -- Se pobla automáticamente via trigger desde servicios/profesionales
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    servicio_id INTEGER NOT NULL REFERENCES servicios(id) ON DELETE CASCADE,
    profesional_id INTEGER NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE,

    -- ====================================================================
    -- ⚙️ SECCIÓN: CONFIGURACIÓN PERSONALIZADA POR PROFESIONAL
    -- ====================================================================
    precio_personalizado DECIMAL(10,2),        -- Precio específico de este profesional (override)
    duracion_personalizada INTEGER,            -- Duración específica de este profesional (override)
    notas_especiales TEXT,                     -- Notas específicas para este profesional

    -- ====================================================================
    -- ⚙️ SECCIÓN: CONTROL
    -- ====================================================================
    activo BOOLEAN DEFAULT TRUE,               -- El profesional puede brindar este servicio

    -- ====================================================================
    -- 🕒 SECCIÓN: TIMESTAMPS
    -- ====================================================================
    creado_en TIMESTAMPTZ DEFAULT NOW(),       -- Fecha de asignación
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),  -- Fecha de última actualización

    -- ====================================================================
    -- ✅ SECCIÓN: VALIDACIONES
    -- ====================================================================
    CONSTRAINT valid_precio_personalizado
        CHECK (precio_personalizado IS NULL OR precio_personalizado >= 0),
    CONSTRAINT valid_duracion_personalizada
        CHECK (duracion_personalizada IS NULL OR (duracion_personalizada > 0 AND duracion_personalizada <= 480)),

    -- 🔒 Constraint de unicidad
    UNIQUE(servicio_id, profesional_id)
);

-- Comentarios de documentación
COMMENT ON TABLE servicios IS
'Catálogo de servicios por organización con configuración avanzada de precios, tiempos y metadatos.';

COMMENT ON TABLE servicios_profesionales IS
'Relación M:N entre servicios y profesionales con configuraciones personalizadas (precio, duración).';
